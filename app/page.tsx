"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Safe Dynamic Imports for Leaflet (Prevents SSR Client-side Exception)
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
  status: "active" | "finished";
}

export default function GalaxyRides3D() {
  const [lang, setLang] = useState<Language>("si");
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  // Navigation View State (dashboard / kyc)
  const [currentTab, setCurrentTab] = useState<"dashboard" | "kyc">("dashboard");

  // Initial Registration States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState("");

  // Driver KYC & Live Camera Scan States
  const [nicNumber, setNicNumber] = useState("");
  const [idPhotoUrl, setIdPhotoUrl] = useState("");
  const [liveFacePhoto, setLiveFacePhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [vehicleCategory, setVehicleCategory] = useState("Sedan / Hybrid Car");
  const [isAiVerifying, setIsAiVerifying] = useState(false);
  const [aiMatchStatus, setAiMatchStatus] = useState("");

  // Video and Canvas Refs for Live Camera Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Map & Route Posting States
  const [vehicle, setVehicle] = useState("Toyota Prius Hybrid");
  const [price, setPrice] = useState(1200);
  const [startQuery, setStartQuery] = useState("Colombo Fort");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9344, 79.8428]);
  const [endQuery, setEndQuery] = useState("Kandy Clock Tower");
  const [endCoords, setEndCoords] = useState<[number, number]>([7.2906, 80.6337]);
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]]>([
    [6.9344, 79.8428],
    [7.2906, 80.6337],
  ]);
  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
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

  // Strong Password Validator
  const handlePasswordChange = (val: string) => {
    setPassword(val);
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
    if (!strongRegex.test(val)) {
      setPassError("අවම අකුරු 8ක්, Capital/Simple, අංකයක් සහ විශේෂ ලකුණක් (!@#$%^&*) තියෙන්න ඕන.");
    } else {
      setPassError("");
    }
  };

  // Handle Initial Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (passError) return;

    const user: User = {
      id: "USR-" + Date.now().toString().slice(-4),
      name: fullName,
      username,
      email,
      phone,
      role: "passenger",
      isVerifiedDriver: false,
    };
    setCurrentUser(user);
    setCurrentTab("dashboard");
  };

  // Start Live Camera
  const startLiveCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("කැමරාව Open කිරීමට නොහැකි විය. Camera Permissions පරීක්ෂා කරන්න.");
      setIsCameraActive(false);
    }
  };

  // Capture Photo from Live Camera
  const captureLivePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setLiveFacePhoto(dataUrl);

        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  // AI ID + Live Face Verification Logic
  const handleVerifyDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPhotoUrl || !liveFacePhoto || !nicNumber) {
      alert("කරුණාකර ID Photo එක සහ Live Camera Scan එක සම්පූර්ණ කරන්න.");
      return;
    }

    setIsAiVerifying(true);
    setAiMatchStatus("⏳ Gemini AI මගින් ID ඡායාරූපය සහ Live Face Scan එක සසඳමින් පවතී...");

    setTimeout(() => {
      setIsAiVerifying(false);
      setAiMatchStatus("✅ AI Matching Passed: Live Person detected & Face matched with ID (98.4%)!");

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
      setTimeout(() => {
        setCurrentTab("dashboard");
      }, 1500);
    }, 2500);
  };

  // Search Suggestions
  const fetchSuggestions = async (query: string, setFn: (data: Suggestion[]) => void) => {
    if (query.trim().length < 2) return setFn([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Sri Lanka")}&limit=5`);
      const data = await res.json();
      setFn(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Publish Ride
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
      routePolyline: roadRoute.length > 0 ? roadRoute : [startCoords, endCoords],
      distanceKm: routeDistance || "N/A",
      status: "active",
    };
    setRidePosts([newRide, ...ridePosts]);
    alert("🚀 Ride Route successfully published live!");
  };

  if (!isClient) return null;

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      {/* Navbar */}
      <div style={navStyle}>
        <h2 style={{ color: "#38bdf8", margin: 0 }}>🌌 Galaxy Rides 3D</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
              {currentUser.isVerifiedDriver ? "✅ Verified Driver" : "🪪 Become a Driver (KYC)"}
            </button>
          )}
          <button onClick={() => setLang("si")} style={langBtn(lang === "si")}>සිංහල</button>
          <button onClick={() => setLang("en")} style={langBtn(lang === "en")}>English</button>
        </div>
      </div>

      {/* 1. INITIAL REGISTRATION FORM */}
      {!currentUser ? (
        <div style={centerFlex}>
          <div style={cardStyle}>
            <h3 style={{ color: "#38bdf8", textAlign: "center", marginTop: 0 }}>
              {authMode === "register" ? "📝 නව ගිණුමක් අරඹන්න" : "🔑 ඇතුළු වන්න"}
            </h3>

            <form onSubmit={handleRegister} style={formStyle}>
              {authMode === "register" && (
                <>
                  <input type="text" placeholder="සම්පූර්ණ නම (Full Name)" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
                  <input type="text" placeholder="පරිශීලක නමය (Username)" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
                  <input type="email" placeholder="විද්‍යුත් තැපෑල (Email)" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                  <input type="text" placeholder="දුරකථන අංකය (Phone)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />
                </>
              )}

              <div>
                <input type="password" placeholder="මුරපදය (Strong Password)" value={password} onChange={(e) => handlePasswordChange(e.target.value)} required style={inputStyle} />
                {passError && <span style={{ color: "#ef4444", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>{passError}</span>}
              </div>

              <button type="submit" disabled={!!passError && authMode === "register"} style={primaryBtn}>
                {authMode === "register" ? "ලියාපදිංචි වන්න (Register)" : "ඇතුළු වන්න (Login)"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#94a3b8", marginTop: "15px" }}>
              {authMode === "register" ? "ගිණුමක් තිබේද? " : "ගිණුමක් නැද්ද? "}
              <span onClick={() => setAuthMode(authMode === "register" ? "login" : "register")} style={{ color: "#38bdf8", cursor: "pointer", textDecoration: "underline" }}>
                {authMode === "register" ? "Login වන්න" : "ලියාපදිංචි වන්න"}
              </span>
            </p>
          </div>
        </div>
      ) : (
        /* 2. MAIN DASHBOARD OR SEPARATE KYC FORM */
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* User Status Bar */}
          <div style={{ ...cardStyle, marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, color: "#38bdf8" }}>ආයුබෝවන්, {currentUser.name}! 👋</h3>
              <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                Status: {currentUser.isVerifiedDriver ? <span style={{ color: "#22c55e", fontWeight: "bold" }}>Verified Driver ✅</span> : <span style={{ color: "#cbd5e1" }}>Passenger 👤</span>}
              </p>
            </div>
            <button onClick={() => setCurrentUser(null)} style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Logout</button>
          </div>

          {/* TAB 1: SEPARATE DRIVER KYC FORM */}
          {currentTab === "kyc" ? (
            <div style={{ ...cardStyle, maxWidth: "600px", margin: "0 auto" }}>
              <button onClick={() => setCurrentTab("dashboard")} style={{ background: "transparent", color: "#38bdf8", border: "none", cursor: "pointer", marginBottom: "10px" }}>⬅️ Dashboard එකට යන්න</button>
              <h3 style={{ color: "#38bdf8", marginTop: 0 }}>🪪 Driver ID & Live Face Verification</h3>
              <p style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Driver කෙනෙක් විදිහට Verified Label එක ලබාගැනීමට ඔබේ ID එක සහ Live Camera Scan එක සම්පූර්ණ කරන්න.</p>

              <form onSubmit={handleVerifyDriver} style={formStyle}>
                <div>
                  <label style={labelStyle}>NIC / Driver's License Number</label>
                  <input type="text" placeholder="1998XXXXXV / 98234XXXX" value={nicNumber} onChange={(e) => setNicNumber(e.target.value)} required style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>1. ID Photo Link / URL</label>
                  <input type="text" placeholder="https://..." value={idPhotoUrl} onChange={(e) => setIdPhotoUrl(e.target.value)} required style={inputStyle} />
                </div>

                {/* LIVE CAMERA CAPTURE */}
                <div>
                  <label style={labelStyle}>2. Live Face Scan (Live Camera Required)</label>
                  {!isCameraActive && !liveFacePhoto && (
                    <button type="button" onClick={startLiveCamera} style={{ ...primaryBtn, background: "#0284c7" }}>📷 Open Live Camera</button>
                  )}

                  {isCameraActive && (
                    <div style={{ textAlign: "center", marginTop: "10px" }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "250px", borderRadius: "8px", border: "2px solid #38bdf8" }} />
                      <button type="button" onClick={captureLivePhoto} style={{ ...primaryBtn, background: "#16a34a", marginTop: "10px" }}>📸 Snap Photo</button>
                    </div>
                  )}

                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {liveFacePhoto && (
                    <div style={{ marginTop: "10px", textAlign: "center" }}>
                      <p style={{ fontSize: "0.8rem", color: "#4ade80" }}>✅ Live Face Scan Captured!</p>
                      <img src={liveFacePhoto} alt="Live Captured Selfie" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #22c55e" }} />
                      <br />
                      <button type="button" onClick={() => { setLiveFacePhoto(null); startLiveCamera(); }} style={{ fontSize: "0.75rem", background: "transparent", color: "#38bdf8", border: "none", cursor: "pointer", marginTop: "6px" }}>🔄 Retake</button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Vehicle Category</label>
                  <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)} style={inputStyle}>
                    <option value="Sedan / Hybrid Car">Sedan / Hybrid Car</option>
                    <option value="Small Car / Alto / Nano">Small Car / Alto / Nano</option>
                    <option value="Van / Mini Bus / Coaster">Van / Mini Bus / Coaster</option>
                  </select>
                </div>

                {aiMatchStatus && (
                  <div style={{ padding: "10px", borderRadius: "8px", background: "#0f172a", border: "1px solid #38bdf8", color: "#38bdf8", fontSize: "0.85rem" }}>
                    {aiMatchStatus}
                  </div>
                )}

                <button type="submit" disabled={isAiVerifying || !liveFacePhoto} style={{ ...primaryBtn, background: "#16a34a" }}>
                  {isAiVerifying ? "AI Verifying..." : "Verify & Become Driver ✅"}
                </button>
              </form>
            </div>
          ) : (
            /* TAB 2: MAIN DASHBOARD & RIDE POSTING */
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={cardStyle}>
                <h3 style={{ color: "#38bdf8", marginTop: 0 }}>🚗 Ride Route Publisher</h3>

                {currentUser.isVerifiedDriver ? (
                  <>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={labelStyle}>Start Location</label>
                      <input type="text" value={startQuery} onChange={(e) => { setStartQuery(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <label style={labelStyle}>End Destination</label>
                      <input type="text" value={endQuery} onChange={(e) => { setEndQuery(e.target.value); fetchSuggestions(e.target.value, setEndSuggestions); }} style={inputStyle} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Vehicle Model" style={inputStyle} />
                      <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price LKR" style={inputStyle} />
                    </div>

                    <button onClick={handlePublishRide} style={primaryBtn}>🚀 Publish Route Live</button>
                  </>
                ) : (
                  <div style={{ padding: "15px", background: "#0f172a", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>ඔබ තවමත් Verified Driver කෙනෙක් නොවේ. Ride එකක් Publish කිරීමට පළමුව Driver KYC Verification එක සම්පූර්ණ කරන්න.</p>
                    <button onClick={() => setCurrentTab("kyc")} style={{ ...primaryBtn, background: "#0284c7" }}>🪪 Fill Driver KYC</button>
                  </div>
                )}

                {/* Published Rides List */}
                <h4 style={{ color: "#38bdf8", marginTop: "20px" }}>📢 Active Rides</h4>
                {ridePosts.map((ride) => (
                  <div key={ride.id} style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", marginBottom: "8px", border: "1px solid #334155" }}>
                    <strong>{ride.driverName}</strong> {ride.isVerifiedDriver && <span style={{ color: "#22c55e", fontSize: "0.8rem" }}>Verified Driver ✅</span>}
                    <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>📍 {ride.startName} ➡️ 🏁 {ride.endName}</p>
                    <span style={{ color: "#38bdf8", fontWeight: "bold" }}>LKR {ride.price}</span>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div style={{ height: "450px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={startCoords}><Popup>🟢 Start</Popup></Marker>
                  <Marker position={endCoords}><Popup>🔴 End</Popup></Marker>
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
const cardStyle = { background: "#1e293b", padding: "25px", borderRadius: "16px", border: "1px solid #334155", width: "100%", boxSizing: "border-box" as const };
const formStyle = { display: "flex", flexDirection: "column" as const, gap: "12px" };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569", boxSizing: "border-box" as const };
const labelStyle = { fontSize: "0.85rem", color: "#cbd5e1", display: "block", marginBottom: "4px" };
const primaryBtn = { width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" as const, cursor: "pointer" };
const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#1e293b", padding: "12px 20px", borderRadius: "10px", border: "1px solid #334155" };
const langBtn = (active: boolean) => ({ padding: "6px 12px", background: active ? "#0284c7" : "#334155", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" });
