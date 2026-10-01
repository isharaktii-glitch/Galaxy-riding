"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components to avoid SSR 'window is not defined' error
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

// Map FlyToBounds / FlyTo Controller Component
const MapFlyTo = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Component = ({
        bounds,
        center,
        zoom,
      }: {
        bounds?: [[number, number], [number, number]];
        center?: [number, number];
        zoom?: number;
      }) => {
        const map = mod.useMap();
        useEffect(() => {
          if (map) {
            if (bounds && bounds[0][0] !== bounds[1][0]) {
              map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            } else if (center && zoom) {
              map.flyTo(center, zoom, { animate: true, duration: 1.5 });
            }
          }
        }, [bounds, center, zoom, map]);
        return null;
      };
      return Component;
    }),
  { ssr: false }
);

interface User {
  name: string;
  phone: string;
  role: "driver" | "passenger";
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
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
  bookedBy?: {
    passengerName: string;
    passengerPhone: string;
    passengerCoords: [number, number];
  };
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

  // Driver Locations & Coordinates
  const [startQuery, setStartQuery] = useState("My Live GPS Location");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9271, 79.8612]);
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);

  const [endQuery, setEndQuery] = useState("Kandy Temple of the Tooth");
  const [endCoords, setEndCoords] = useState<[number, number]>([7.2936, 80.6413]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);

  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]]>([
    [6.9271, 79.8612],
    [7.2936, 80.6413],
  ]);

  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");

  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);

  // Passenger Specific States
  const [passengerPickupQuery, setPassengerPickupQuery] = useState("Current Location");
  const [passengerCoords, setPassengerCoords] = useState<[number, number]>([6.9271, 79.8612]);
  const [passengerSuggestions, setPassengerSuggestions] = useState<Suggestion[]>([]);
  const [searchDestination, setSearchDestination] = useState("");

  const [greenIcon, setGreenIcon] = useState<any>(null);
  const [redIcon, setRedIcon] = useState<any>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load Leaflet Icons & Dynamic CSS CDN safely on Client Side
  useEffect(() => {
    // Dynamically append Leaflet CSS to DOM (Fixes TypeScript import error)
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      const green = new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const red = new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      setGreenIcon(green);
      setRedIcon(red);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coords: [number, number] = [lat, lng];
          setStartCoords(coords);
          setPassengerCoords(coords);
        },
        (err) => console.log("GPS Location Permission Pending")
      );
    }
  }, []);

  const fetchSuggestions = (query: string, setFn: (suggestions: Suggestion[]) => void) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 2) {
      setFn([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query + ", Sri Lanka"
          )}&limit=6&addressdetails=1`
        );
        const data = await res.json();
        setFn(data || []);
      } catch (err) {
        console.error("Autosuggest Error:", err);
      }
    }, 300);
  };

  const selectStartSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    const displayName = s.display_name.split(",").slice(0, 3).join(",");
    setStartQuery(displayName);
    setStartCoords(coords);
    setStartSuggestions([]);
    updateRouteAndBounds(coords, endCoords);
  };

  const selectEndSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    const displayName = s.display_name.split(",").slice(0, 3).join(",");
    setEndQuery(displayName);
    setEndCoords(coords);
    setEndSuggestions([]);
    updateRouteAndBounds(startCoords, coords);
  };

  const selectPassengerSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    const displayName = s.display_name.split(",").slice(0, 3).join(",");
    setPassengerPickupQuery(displayName);
    setPassengerCoords(coords);
    setPassengerSuggestions([]);
  };

  const handleFindMyLocation = (isPassengerMode = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords: [number, number] = [lat, lng];

          if (isPassengerMode) {
            setPassengerCoords(coords);
            setPassengerPickupQuery("My Live GPS Location");
            alert("📍 Passenger location updated!");
          } else {
            setStartCoords(coords);
            setStartQuery("My Live GPS Location");
            updateRouteAndBounds(coords, endCoords);
            alert("📍 Start location set to Live GPS!");
          }
        },
        (error) => alert("Please allow browser GPS location access.")
      );
    }
  };

  const updateRouteAndBounds = async (start: [number, number], end: [number, number]) => {
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

        setMapBounds([
          [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
          [Math.max(start[0], end[0]), Math.max(start[1], end[1])],
        ]);
      } else {
        setRoadRoute([start, end]);
      }
    } catch (err) {
      console.error("OSRM Route Fetch Error:", err);
      setRoadRoute([start, end]);
    }
  };

  useEffect(() => {
    updateRouteAndBounds(startCoords, endCoords);
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !passwordInput) {
      alert("Please enter phone number and password!");
      return;
    }
    setCurrentUser({
      name: nameInput || (selectedRole === "driver" ? "Driver User" : "Passenger User"),
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
      routePolyline: roadRoute.length > 0 ? roadRoute : [startCoords, endCoords],
      distanceKm: routeDistance || "N/A",
      isLadiesOnly,
    };

    setRidePosts([newRide, ...ridePosts]);
    alert("🚀 Ride Route Published Live!");
  };

  const handleBookRide = (rideId: string) => {
    if (!currentUser) return;

    setRidePosts((prev) =>
      prev.map((ride) => {
        if (ride.id === rideId) {
          return {
            ...ride,
            bookedBy: {
              passengerName: currentUser.name,
              passengerPhone: currentUser.phone,
              passengerCoords: passengerCoords,
            },
          };
        }
        return ride;
      })
    );
    alert("🎉 Ride Booked! Driver can view your pickup location.");
  };

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155", width: "100%", maxWidth: "420px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1 style={{ color: "#38bdf8", margin: "0 0 8px 0" }}>🌌 Galaxy Rides 3D</h1>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Smart Live Carpooling</p>
          </div>

          <div style={{ display: "flex", background: "#0f172a", padding: "4px", borderRadius: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setSelectedRole("passenger")}
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "passenger" ? "#0284c7" : "transparent", color: "#fff" }}
            >
              🙋‍♂️ Passenger
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("driver")}
              style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "driver" ? "#0284c7" : "transparent", color: "#fff" }}
            >
              🚗 Driver
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
          <h2 style={{ margin: "0", color: "#38bdf8" }}>🌌 Galaxy Rides 3D</h2>
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

      {/* DRIVER VIEW */}
      {currentUser.role === "driver" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ color: "#38bdf8", margin: 0 }}>🚗 Driver Panel & Route Setup</h3>
              <button
                onClick={() => handleFindMyLocation(false)}
                style={{ padding: "6px 12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
              >
                🎯 Use Live GPS
              </button>
            </div>

            <div style={{ marginBottom: "16px", position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "4px" }}>
                📍 Start Location (Optional - Default: Live GPS)
              </label>
              <input
                type="text"
                placeholder="Type location or leave as GPS..."
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  fetchSuggestions(e.target.value, setStartSuggestions);
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
              />
              {startSuggestions.length > 0 && (
                <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: "0", margin: "4px 0 0 0", zIndex: 1000, maxHeight: "180px", overflowY: "auto" }}>
                  {startSuggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => selectStartSuggestion(item)}
                      style={{ padding: "10px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem", color: "#e2e8f0" }}
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginBottom: "16px", position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "4px" }}>
                🏁 Destination Location (e.g. type "nuwara")
              </label>
              <input
                type="text"
                placeholder="Search destination in Sri Lanka..."
                value={endQuery}
                onChange={(e) => {
                  setEndQuery(e.target.value);
                  fetchSuggestions(e.target.value, setEndSuggestions);
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #38bdf8", background: "#0f172a", color: "#fff" }}
              />
              {endSuggestions.length > 0 && (
                <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: "0", margin: "4px 0 0 0", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                  {endSuggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => selectEndSuggestion(item)}
                      style={{ padding: "10px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem", color: "#e2e8f0" }}
                    >
                      🗺️ {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {routeDistance && (
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", border: "1px solid #0284c7", marginBottom: "12px", color: "#38bdf8" }}>
                🗺️ Calculated Road Distance: <b>{routeDistance}</b>
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
              <label htmlFor="ladiesOnly" style={{ color: "#f472b6", fontWeight: "bold" }}>🌸 Ladies-Only Ride</label>
            </div>

            <button
              onClick={handlePublishRide}
              style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            >
              🚀 Publish Route Live
            </button>
          </div>

          <div style={{ height: "520px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
            <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
              <MapFlyTo bounds={mapBounds} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {greenIcon && (
                <Marker position={startCoords} icon={greenIcon}>
                  <Popup>🟢 Start: {startQuery}</Popup>
                </Marker>
              )}

              {redIcon && (
                <Marker position={endCoords} icon={redIcon}>
                  <Popup>🔴 Destination: {endQuery}</Popup>
                </Marker>
              )}

              {roadRoute.length > 0 && (
                <Polyline positions={roadRoute} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.85 }} />
              )}
            </MapContainer>
          </div>
        </div>
      )}

      {/* PASSENGER VIEW */}
      {currentUser.role === "passenger" && (
        <div style={{ maxWidth: "950px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ color: "#38bdf8", margin: 0 }}>🔍 Search & Select Pickup Location</h3>
              <button
                onClick={() => handleFindMyLocation(true)}
                style={{ padding: "6px 12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
              >
                🎯 GPS Location
              </button>
            </div>

            <div style={{ marginBottom: "12px", position: "relative" }}>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Your Pickup Point</label>
              <input
                type="text"
                placeholder="Search pickup location in Sri Lanka..."
                value={passengerPickupQuery}
                onChange={(e) => {
                  setPassengerPickupQuery(e.target.value);
                  fetchSuggestions(e.target.value, setPassengerSuggestions);
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff", marginTop: "4px" }}
              />
              {passengerSuggestions.length > 0 && (
                <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: "0", margin: "4px 0 0 0", zIndex: 1000, maxHeight: "180px", overflowY: "auto" }}>
                  {passengerSuggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => selectPassengerSuggestion(item)}
                      style={{ padding: "10px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem", color: "#e2e8f0" }}
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Filter Destination</label>
            <input
              type="text"
              placeholder="Filter by destination (e.g. Kandy, Nuwara Eliya)"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff", marginTop: "4px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {ridePosts.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8" }}>No published rides available yet.</p>
            ) : (
              ridePosts
                .filter((r) => r.endName.toLowerCase().includes(searchDestination.toLowerCase()))
                .map((ride) => {
                  const fitBounds: [[number, number], [number, number]] = [
                    [Math.min(ride.startCoords[0], ride.endCoords[0]), Math.min(ride.startCoords[1], ride.endCoords[1])],
                    [Math.max(ride.startCoords[0], ride.endCoords[0]), Math.max(ride.startCoords[1], ride.endCoords[1])],
                  ];

                  return (
                    <div key={ride.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ margin: "0", color: "#38bdf8", fontSize: "1.1rem" }}>{ride.driverName} ({ride.vehicle})</h4>
                          <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: "0.85rem" }}>📞 Phone: {ride.driverPhone}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80", marginRight: "12px" }}>LKR {ride.price}</span>
                          {!ride.bookedBy ? (
                            <button
                              onClick={() => handleBookRide(ride.id)}
                              style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                            >
                              🚕 Book Ride Now
                            </button>
                          ) : (
                            <span style={{ background: "#0284c7", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
                              ✅ Booked
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: "12px 0 0 0", color: "#cbd5e1" }}>
                        <b>Full Route:</b> {ride.startName} ➔ {ride.endName} ({ride.distanceKm})
                      </p>

                      <div style={{ height: "300px", borderRadius: "8px", overflow: "hidden", marginTop: "14px" }}>
                        <MapContainer bounds={fitBounds} style={{ height: "100%", width: "100%" }}>
                          <MapFlyTo bounds={fitBounds} />
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                          {greenIcon && (
                            <Marker position={ride.startCoords} icon={greenIcon}>
                              <Popup>🚗 <b>Driver Location</b></Popup>
                            </Marker>
                          )}

                          {redIcon && (
                            <Marker position={ride.endCoords} icon={redIcon}>
                              <Popup>🔴 Destination</Popup>
                            </Marker>
                          )}

                          {ride.bookedBy && (
                            <Marker position={ride.bookedBy.passengerCoords}>
                              <Popup>🙋‍♂️️ <b>Your Pickup Point</b></Popup>
                            </Marker>
                          )}

                          <Polyline positions={ride.routePolyline} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.85 }} />
                        </MapContainer>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
