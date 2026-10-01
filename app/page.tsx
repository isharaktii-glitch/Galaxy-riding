"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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

import "leaflet/dist/leaflet.css";

interface User {
  name: string;
  phone: string;
  role: "driver" | "passenger";
}

interface RidePost {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  seats: number;
  price: number;
  startName: string;
  startCoords: [number, number];
  endName: string;
  endCoords: [number, number];
  routePolyline: [number, number][];
  distanceKm: string;
  isLadiesOnly: boolean;
}

export default function GalaxyRides3D() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger">("passenger");

  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [vehicle, setVehicle] = useState("Toyota Prius Hybrid");
  const [price, setPrice] = useState(1200);
  const [seats, setSeats] = useState(3);
  const [isLadiesOnly, setIsLadiesOnly] = useState(false);

  const [startQuery, setStartQuery] = useState("Colombo Fort");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9344, 79.8428]);

  const [endQuery, setEndQuery] = useState("Warakapola");
  const [endCoords, setEndCoords] = useState<[number, number]>([7.2236, 80.1973]);

  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");

  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);
  const [searchDestination, setSearchDestination] = useState("");

  const fetchRealRoadRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        const leafletCoords: [number, number][] = coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        setRoadRoute(leafletCoords);

        const distInKm = (data.routes[0].distance / 1000).toFixed(1);
        setRouteDistance(`${distInKm} km`);
      }
    } catch (err) {
      console.error("OSRM Route Fetch Error:", err);
      setRoadRoute([start, end]);
    }
  };

  useEffect(() => {
    fetchRealRoadRoute(startCoords, endCoords);
  }, [startCoords, endCoords]);

  const geocodeLocation = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ", Sri Lanka"
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (err) {
      console.error("Geocoding Error:", err);
    }
    return null;
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name.split(",").slice(0, 3).join(",");
      }
    } catch (err) {
      console.error("Reverse Geocoding Error:", err);
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  const handleStartSearch = async () => {
    const coords = await geocodeLocation(startQuery);
    if (coords) setStartCoords(coords);
  };

  const handleEndSearch = async () => {
    const coords = await geocodeLocation(endQuery);
    if (coords) setEndCoords(coords);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !passwordInput) {
      alert("Please fill in all details!");
      return;
    }
    setCurrentUser({
      name: nameInput || "User",
      phone: phoneInput,
      role: selectedRole,
    });
  };

  const handlePublishRide = () => {
    if (!currentUser) return;

    const newRide: RidePost = {
      id: Date.now().toString(),
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      vehicle,
      seats,
      price,
      startName: startQuery,
      startCoords,
      endName: endQuery,
      endCoords,
      routePolyline: roadRoute,
      distanceKm: routeDistance,
      isLadiesOnly,
    };

    setRidePosts([newRide, ...ridePosts]);
    alert("Ride published successfully with real road route!");
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155", width: "100%", maxWidth: "420px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1 style={{ color: "#38bdf8", margin: "0 0 8px 0" }}>Galaxy Rides 3D</h1>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Smart Carpooling Platform</p>
          </div>

          <div style={{ display: "flex", background: "#0f172a", padding: "4px", borderRadius: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setSelectedRole("passenger")}
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "passenger" ? "#0284c7" : "transparent", color: "#fff" }}
            >
              Passenger
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("driver")}
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "driver" ? "#0284c7" : "transparent", color: "#fff" }}
            >
              Driver
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {authMode === "register" && (
              <div>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ishara Sadaruwan"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff", marginTop: "4px" }}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Phone Number</label>
              <input
                type="text"
                placeholder="07X XXXXXXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff", marginTop: "4px" }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff", marginTop: "4px" }}
                required
              />
            </div>

            <button
              type="submit"
              style={{ marginTop: "10px", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}
            >
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.85rem", color: "#94a3b8" }}>
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              style={{ color: "#38bdf8", cursor: "pointer", textDecoration: "underline" }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#1e293b", padding: "15px 20px", borderRadius: "12px", border: "1px solid #334155" }}>
        <div>
          <h2 style={{ margin: "0", color: "#38bdf8" }}>Galaxy Rides 3D</h2>
          <p style={{ margin: "0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Logged in as: <b>{currentUser.name}</b> ({currentUser.role.toUpperCase()})
          </p>
        </div>
        <button
          onClick={() => setCurrentUser(null)}
          style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      {currentUser.role === "driver" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
            <h3 style={{ color: "#38bdf8", marginTop: "0" }}>Driver Control Panel</h3>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1" }}>Start Location</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={startQuery}
                  onChange={(e) => setStartQuery(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
                <button onClick={handleStartSearch} style={{ padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Go</button>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1" }}>Ending Location</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={endQuery}
                  onChange={(e) => setEndQuery(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
                <button onClick={handleEndSearch} style={{ padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Go</button>
              </div>
            </div>

            {routeDistance && (
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", border: "1px solid #0284c7", marginBottom: "12px", color: "#38bdf8" }}>
                Road Distance: <b>{routeDistance}</b>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Vehicle</label>
                <input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Price (LKR)</label>
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }} />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Seats Available</label>
              <input type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }} />
            </div>

            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="ladiesOnly" checked={isLadiesOnly} onChange={(e) => setIsLadiesOnly(e.target.checked)} />
              <label htmlFor="ladiesOnly" style={{ color: "#f472b6", fontWeight: "bold" }}>Ladies-Only Ride</label>
            </div>

            <button
              onClick={handlePublishRide}
              style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            >
              Publish Route Live
            </button>
          </div>

          <div style={{ height: "480px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
            <MapContainer center={startCoords} zoom={9} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <Marker
                position={startCoords}
                draggable={true}
                eventHandlers={{
                  dragend: async (e) => {
                    const pos = e.target.getLatLng();
                    setStartCoords([pos.lat, pos.lng]);
                    const placeName = await reverseGeocode(pos.lat, pos.lng);
                    setStartQuery(placeName);
                  },
                }}
              >
                <Popup>Start Position</Popup>
              </Marker>

              <Marker
                position={endCoords}
                draggable={true}
                eventHandlers={{
                  dragend: async (e) => {
                    const pos = e.target.getLatLng();
                    setEndCoords([pos.lat, pos.lng]);
                    const placeName = await reverseGeocode(pos.lat, pos.lng);
                    setEndQuery(placeName);
                  },
                }}
              >
                <Popup>Destination</Popup>
              </Marker>

              {roadRoute.length > 0 && (
                <Polyline positions={roadRoute} color="#0284c7" weight={5} />
              )}
            </MapContainer>
          </div>
        </div>
      )}

      {currentUser.role === "passenger" && (
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
            <h3 style={{ color: "#38bdf8", marginTop: "0" }}>Find Your Ride</h3>
            <input
              type="text"
              placeholder="Search destination (e.g. Warakapola)"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ridePosts.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8" }}>No published rides available yet.</p>
            ) : (
              ridePosts
                .filter((r) => r.endName.toLowerCase().includes(searchDestination.toLowerCase()))
                .map((ride) => (
                  <div key={ride.id} style={{ background: "#1e293b", padding: "18px", borderRadius: "12px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: "0", color: "#38bdf8" }}>{ride.driverName} ({ride.vehicle})</h4>
                        <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: "0.85rem" }}>Phone: {ride.driverPhone}</p>
                      </div>
                      <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80" }}>LKR {ride.price}</span>
                    </div>

                    <p style={{ margin: "10px 0 0 0", color: "#cbd5e1" }}>
                      <b>Route:</b> {ride.startName} ➔ {ride.endName} ({ride.distanceKm})
                    </p>

                    <div style={{ height: "250px", borderRadius: "8px", overflow: "hidden", marginTop: "12px" }}>
                      <MapContainer center={ride.startCoords} zoom={9} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={ride.startCoords} />
                        <Marker position={ride.endCoords} />
                        <Polyline positions={ride.routePolyline} color="#0284c7" weight={4} />
                      </MapContainer>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
