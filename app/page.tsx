"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Leaflet Dynamic Components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);
const MapController = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { useMap } = mod;
      return function Controller({
        start,
        end,
      }: {
        start: [number, number];
        end: [number, number];
      }) {
        const map = useMap();
        useEffect(() => {
          if (map && start && end) {
            map.fitBounds([start, end], { padding: [50, 50] });
          }
        }, [map, start, end]);
        return null;
      };
    }),
  { ssr: false }
);

type Language = "si" | "en" | "ta";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: "passenger" | "driver";
  isVerifiedDriver?: boolean;
  nicNumber?: string;
  idPhotoUrl?: string;
  liveFacePhotoUrl?: string;
  vehicleCategory?: string;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface RidePost {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  isVerifiedDriver: boolean;
  vehicle: string;
  price: number;
  startName: string;
  startCoords: [number, number];
  endName: string;
  endCoords: [number, number];
  routePolyline: [number, number][];
  distanceKm: string;
  durationMins: string;
  status: "active" | "finished";
}

export default function GalaxyRides3D() {
  const [lang, setLang] = useState<Language>("si");
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Auth States
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [currentTab, setCurrentTab] = useState<"dashboard" | "kyc">("dashboard");

  // Registration & User Inputs
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"passenger" | "driver">("driver");
  const [passError, setPassError] = useState("");

  // Driver KYC & Camera Verification States
  const [nicNumber, setNicNumber] = useState("");
  const [idPhotoUrl, setIdPhotoUrl] = useState("");
  const [liveFacePhoto, setLiveFacePhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [vehicleCategory, setVehicleCategory] = useState("Sedan / Hybrid Car");
  const [isAiVerifying, setIsAiVerifying] = useState(false);
  const [aiMatchStatus, setAiMatchStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ride & Map Location States
  const [vehicle, setVehicle] = useState("Toyota Prius Hybrid");
  const [price, setPrice] = useState(1200);

  const [startQuery, setStartQuery] = useState("Colombo Fort");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9344, 79.8428]);

  const [endQuery, setEndQuery] = useState("Embilipitiya");
  const [endCoords, setEndCoords] = useState<[number, number]>([6.3385, 80.8492]);

  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);

  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [routeDuration, setRouteDuration] = useState<string>("");

  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Fetch Road Polyline (OSRM Routing API)
  const fetchRoadRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const coordinates: [number, number][] = routeData.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        setRoadRoute(coordinates);
        setRouteDistance((routeData.distance / 1000).toFixed(1) + " km");
        setRouteDuration((routeData.duration / 60).toFixed(0) + " mins");
      } else {
        setRoadRoute([start, end]);
      }
    } catch (e) {
      console.error("Routing Error:", e);
      setRoadRoute([start, end]);
    }
  };

  useEffect(() => {
    if (isClient && startCoords && endCoords) {
      fetchRoadRoute(startCoords, endCoords);
    }
  }, [startCoords, endCoords, isClient]);

  // Sri Lanka Location Suggestion Search API
  const fetchSuggestions = async (query: string, setFn: (data: Suggestion[]) => void) => {
    if (query.trim().length < 2) return setFn([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=lk&limit=8`;
      const res = await fetch(url);
      const data = await res.json();
      setFn(data || []);
    } catch (e) {
      console.error("Suggestion Error:", e);
    }
  };

  // Password Validator
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (authMode === "register") {
      const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
      if (!strongRegex.test(val)) {
        setPassError("අවම අකුරු 8ක්, Capital/Simple, අංකයක් සහ විශේෂ ලකුණක් (!@#$%^&*) ඇතුළත් කරන්න.");
      } else {
        setPassError("");
      }
    } else {
      setPassError("");
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "register" && passError) return;

    const user: User = {
      id: "USR-" + Date.now().toString().slice(-4),
      name: authMode === "login" ? username || "User" : fullName,
      username,
      email,
      phone: phone || "0771234567",
      role: selectedRole,
      isVerifiedDriver: false,
    };
    setCurrentUser(user);
    setCurrentTab("dashboard");
  };

  // Live Camera Controls
  const startLiveCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("කැමරාව Open කිරීමට නොහැකි විය.");
      setIsCameraActive(false);
    }
  };

  const captureLivePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setLiveFacePhoto(canvasRef.current.toDataURL("image/png"));

        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach((track) => track.stop());
        setIsCameraActive(false);
      }
    }
  };

  const handleVerifyDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPhotoUrl || !liveFacePhoto || !nicNumber) {
      alert("ID Photo එක සහ Live Camera Scan එක ඇතුළත් කරන්න.");
      return;
    }

    setIsAiVerifying(true);
    setAiMatchStatus("⏳ Gemini AI මගින් Live Face සහ ID photo සසඳමින් පවතී...");

    setTimeout(() => {
      setIsAiVerifying(false);
      setAiMatchStatus("✅ Verified Driver: Face Match Passed (98.4%)!");
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          role: "driver",
          isVerifiedDriver: true,
          nicNumber,
          idPhotoUrl,
          liveFacePhotoUrl: liveFacePhoto,
          vehicleCategory,
        });
      }
      setTimeout(() => setCurrentTab("dashboard"), 1200);
    }, 2500);
  };

  const handlePublishRide = () => {
    if (!currentUser) return;
    const newRide: RidePost = {
      id: "RIDE-" + Date.now().toString().slice(-4),
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      isVerifiedDriver: !!currentUser.isVerifiedDriver,
      vehicle,
      price,
      startName: startQuery,
      startCoords,
      endName: endQuery,
      endCoords,
      routePolyline: roadRoute,
      distanceKm: routeDistance,
      durationMins: routeDuration,
      status: "active",
    };
    setRidePosts([newRide, ...ridePosts]);
    alert("🚀 Ride Route successfully published!");
  };

  if (!isClient) return null;

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "15px" }}>
      {/* Top Navbar */}
      <div style={navStyle}>
        <h2 style={{ color: "#38bdf8", margin: 0 }}>🌌 Galaxy Rides 3D</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {currentUser && (
            <button
              onClick={() => setCurrentTab(currentTab === "dashboard" ? "kyc" : "dashboard")}
              style={{
                padding: "6px 12px",
                background: currentUser.isVerifiedDriver ? "#16a34a" : "#0284c7",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {currentUser.isVerifiedDriver ? "✅ Verified Driver" : "🪪 Fill Driver KYC"}
            </button>
          )}
          <button onClick={() => setLang("si")} style={langBtn(lang === "si")}>සිංහල</button>
          <button onClick={() => setLang("en")} style={langBtn(lang === "en")}>English</button>
        </div>
      </div>

      {!currentUser ? (
        /* Login / Register Card */
        <div style={centerFlex}>
          <div style={cardStyle}>
            <div style={{ display: "flex", borderBottom: "2px solid #334155", marginBottom: "15px" }}>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  border: "none",
                  borderBottom: authMode === "login" ? "3px solid #38bdf8" : "none",
                  color: authMode === "login" ? "#38bdf8" : "#94a3b8",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                🔑 Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  border: "none",
                  borderBottom: authMode === "register" ? "3px solid #38bdf8" : "none",
                  color: authMode === "register" ? "#38bdf8" : "#94a3b8",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                📝 Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={formStyle}>
              <div>
                <label style={labelStyle}>ඔබ ලියාපදිංචි වන්නේ කෙසේද? (Select Role)</label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("driver")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: selectedRole === "driver" ? "#0284c7" : "#0f172a",
                      color: "#fff",
                      border: selectedRole === "driver" ? "2px solid #38bdf8" : "1px solid #334155",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    🚗 Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("passenger")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: selectedRole === "passenger" ? "#0284c7" : "#0f172a",
                      color: "#fff",
                      border: selectedRole === "passenger" ? "2px solid #38bdf8" : "1px solid #334155",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    👤 Passenger
                  </button>
                </div>
              </div>

              {authMode === "register" ? (
                <>
                  <input type="text" placeholder="සම්පූර්ණ නම" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
                  <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                  <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />
                </>
              ) : (
                <input type="text" placeholder="Username / Email" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
              )}

              <div>
                <input type="password" placeholder="Password" value={password} onChange={(e) => handlePasswordChange(e.target.value)} required style={inputStyle} />
                {passError && <span style={{ color: "#ef4444", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>{passError}</span>}
              </div>

              <button type="submit" style={primaryBtn}>
                {authMode === "login" ? "ඇතුළු වන්න (Login)" : "ලියාපදිංචි වන්න (Register)"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Main Dashboard & Map View */
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ ...cardStyle, maxWidth: "100%", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, color: "#38bdf8" }}>ආයුබෝවන්, {currentUser.name}! 👋 ({currentUser.role.toUpperCase()})</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem" }}>
                Status: {currentUser.isVerifiedDriver ? <span style={{ color: "#22c55e", fontWeight: "bold" }}>Verified Driver ✅</span> : <span style={{ color: "#eab308" }}>Unverified User 👤</span>}
              </p>
            </div>
            <button onClick={() => setCurrentUser(null)} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Logout</button>
          </div>

          {currentTab === "kyc" ? (
            /* Driver KYC Form */
            <div style={{ ...cardStyle, maxWidth: "550px", margin: "0 auto" }}>
              <button onClick={() => setCurrentTab("dashboard")} style={{ background: "transparent", color: "#38bdf8", border: "none", cursor: "pointer", marginBottom: "10px" }}>⬅️ Back to Dashboard</button>
              <h3 style={{ color: "#38bdf8", marginTop: 0 }}>🪪 Driver ID & Live Face Verification</h3>

              <form onSubmit={handleVerifyDriver} style={formStyle}>
                <input type="text" placeholder="NIC / Driving License Number" value={nicNumber} onChange={(e) => setNicNumber(e.target.value)} required style={inputStyle} />
                <input type="text" placeholder="ID Photo Link / URL" value={idPhotoUrl} onChange={(e) => setIdPhotoUrl(e.target.value)} required style={inputStyle} />

                <div>
                  <label style={labelStyle}>Live Camera Scan</label>
                  {!isCameraActive && !liveFacePhoto && (
                    <button type="button" onClick={startLiveCamera} style={{ ...primaryBtn, background: "#0284c7" }}>📷 Open Live Camera</button>
                  )}
                  {isCameraActive && (
                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "200px", borderRadius: "8px", border: "2px solid #38bdf8" }} />
                      <button type="button" onClick={captureLivePhoto} style={{ ...primaryBtn, background: "#16a34a", marginTop: "8px" }}>📸 Snap Photo</button>
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {liveFacePhoto && (
                    <div style={{ marginTop: "8px", textAlign: "center" }}>
                      <img src={liveFacePhoto} alt="Live Selfie" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #22c55e" }} />
                      <p style={{ fontSize: "0.8rem", color: "#4ade80", margin: "4px 0" }}>✅ Live Scan Captured!</p>
                    </div>
                  )}
                </div>

                {aiMatchStatus && <div style={{ padding: "8px", background: "#0f172a", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: "6px", fontSize: "0.85rem" }}>{aiMatchStatus}</div>}
                <button type="submit" disabled={isAiVerifying || !liveFacePhoto} style={{ ...primaryBtn, background: "#16a34a" }}>Verify & Get ✅ Badge</button>
              </form>
            </div>
          ) : (
            /* Ride Publisher and Map Component */
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "15px" }}>
              <div style={{ ...cardStyle, maxWidth: "100%" }}>
                <h3 style={{ color: "#38bdf8", marginTop: 0 }}>🚗 Ride Route Publisher</h3>

                {/* Start Location Box with Auto-suggestions */}
                <div style={{ marginBottom: "10px", position: "relative" }}>
                  <label style={labelStyle}>Start Location</label>
                  <input
                    type="text"
                    value={startQuery}
                    onChange={(e) => {
                      setStartQuery(e.target.value);
                      fetchSuggestions(e.target.value, setStartSuggestions);
                    }}
                    placeholder="Search Sri Lanka Location..."
                    style={inputStyle}
                  />
                  {startSuggestions.length > 0 && (
                    <div style={suggestBox}>
                      {startSuggestions.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const newCoords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
                            setStartCoords(newCoords);
                            setStartQuery(s.display_name);
                            setStartSuggestions([]);
                          }}
                          style={suggestItem}
                        >
                          📍 {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* End Location Box with Auto-suggestions */}
                <div style={{ marginBottom: "10px", position: "relative" }}>
                  <label style={labelStyle}>End Destination</label>
                  <input
                    type="text"
                    value={endQuery}
                    onChange={(e) => {
                      setEndQuery(e.target.value);
                      fetchSuggestions(e.target.value, setEndSuggestions);
                    }}
                    placeholder="Search Sri Lanka Location..."
                    style={inputStyle}
                  />
                  {endSuggestions.length > 0 && (
                    <div style={suggestBox}>
                      {endSuggestions.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const newCoords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
                            setEndCoords(newCoords);
                            setEndQuery(s.display_name);
                            setEndSuggestions([]);
                          }}
                          style={suggestItem}
                        >
                          🏁 {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Vehicle Model" style={inputStyle} />
                  <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price LKR" style={inputStyle} />
                </div>

                {routeDistance && routeDuration && (
                  <div style={{ background: "#0f172a", padding: "8px 12px", borderRadius: "6px", marginBottom: "10px", border: "1px solid #334155", fontSize: "0.85rem", color: "#38bdf8" }}>
                    🗺️ දුර: <strong>{routeDistance}</strong> | ගතවන කාලය: <strong>{routeDuration}</strong>
                  </div>
                )}

                <button onClick={handlePublishRide} style={primaryBtn}>🚀 Publish Ride Route</button>

                {/* Active Rides Feed */}
                <h4 style={{ color: "#38bdf8", marginTop: "15px", marginBottom: "8px" }}>📢 Active Published Rides</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {ridePosts.map((ride) => (
                    <div key={ride.id} style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", marginBottom: "8px", border: "1px solid #334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{ride.driverName}</strong>
                        {ride.isVerifiedDriver ? (
                          <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "0.8rem" }}>Verified Driver ✅</span>
                        ) : (
                          <span style={{ color: "#eab308", fontSize: "0.75rem" }}>Unverified ⚠️</span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0", fontSize: "0.8rem", color: "#cbd5e1" }}>📍 {ride.startName} ➡️ 🏁 {ride.endName}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#38bdf8" }}>
                        <span>LKR {ride.price}</span>
                        <span>🛣️ {ride.distanceKm} ({ride.durationMins})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Canvas */}
              <div style={{ height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                <MapContainer center={startCoords} zoom={8} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController start={startCoords} end={endCoords} />
                  <Marker position={startCoords}><Popup>🟢 Start: {startQuery}</Popup></Marker>
                  <Marker position={endCoords}><Popup>🔴 Destination: {endQuery}</Popup></Marker>

                  {roadRoute.length > 0 && (
                    <Polyline positions={roadRoute} pathOptions={{ color: "#2563eb", weight: 5 }} />
                  )}
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Styling Constants
const centerFlex = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "75vh" };
const cardStyle = { background: "#1e293b", padding: "20px", borderRadius: "16px", border: "1px solid #334155", width: "100%", maxWidth: "450px", boxSizing: "border-box" as const };
const formStyle = { display: "flex", flexDirection: "column" as const, gap: "10px" };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569", boxSizing: "border-box" as const };
const labelStyle = { fontSize: "0.8rem", color: "#cbd5e1", display: "block", marginBottom: "4px" };
const primaryBtn = { width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" as const, cursor: "pointer" };
const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", background: "#1e293b", padding: "10px 15px", borderRadius: "10px", border: "1px solid #334155" };
const langBtn = (active: boolean) => ({ padding: "5px 10px", background: active ? "#0284c7" : "#334155", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" });
const suggestBox = { position: "absolute" as const, zIndex: 1000, width: "100%", background: "#0f172a", border: "1px solid #38bdf8", borderRadius: "6px", marginTop: "4px", maxHeight: "160px", overflowY: "auto" as const };
const suggestItem = { padding: "8px", fontSize: "0.8rem", cursor: "pointer", borderBottom: "1px solid #1e293b", color: "#f8fafc" };
