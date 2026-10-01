"use client";

import React, { useState, useEffect, useRef } from "react";
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
  id: string;
  name: string;
  phone: string;
  role: "driver" | "passenger";
  driverIdNo?: string;
  profilePhoto?: string;
  vehicleType?: string;
  isProfileComplete?: boolean;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Review {
  passengerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface RidePost {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPhoto?: string;
  vehicle: string;
  vehicleCategory: "Small Car/Nano" | "Sedan/Prius" | "Van/Mini Bus" | "Bike";
  seats: number;
  price: number;
  startName: string;
  startCoords: [number, number];
  endName: string;
  endCoords: [number, number];
  routePolyline: [number, number][];
  distanceKm: string;
  isLadiesOnly: boolean;
  status: "active" | "finished";
  aiShortcutAnalysis?: string;
  bookedBy?: {
    passengerName: string;
    passengerPhone: string;
  };
  reviews?: Review[];
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GalaxyRides3D() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger">("passenger");

  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // Driver Full Profile Setup
  const [driverIdNo, setDriverIdNo] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150");
  const [vehicleCategory, setVehicleCategory] = useState<"Small Car/Nano" | "Sedan/Prius" | "Van/Mini Bus" | "Bike">("Sedan/Prius");

  // Ride Form
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState("Toyota Prius Hybrid");
  const [price, setPrice] = useState(1200);
  const [seats, setSeats] = useState(3);
  const [isLadiesOnly, setIsLadiesOnly] = useState(false);

  // Driver Locations & Coordinates
  const [startQuery, setStartQuery] = useState("Colombo Fort");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9344, 79.8428]);
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);

  const [endQuery, setEndQuery] = useState("Kandy Clock Tower");
  const [endCoords, setEndCoords] = useState<[number, number]>([7.2906, 80.6337]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);

  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]]>([
    [6.9344, 79.8428],
    [7.2906, 80.6337],
  ]);

  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>("");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);

  // Passenger Search
  const [passengerEndQuery, setPassengerEndQuery] = useState("");
  const [passengerEndCoords, setPassengerEndCoords] = useState<[number, number] | null>(null);
  const [passengerEndSuggestions, setPassengerEndSuggestions] = useState<Suggestion[]>([]);

  // Rating Modal State
  const [ratingTargetPostId, setRatingTargetPostId] = useState<string | null>(null);
  const [starCount, setStarCount] = useState(5);
  const [commentText, setCommentText] = useState("");

  const [greenIcon, setGreenIcon] = useState<any>(null);
  const [redIcon, setRedIcon] = useState<any>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
          )}&limit=8&addressdetails=1`
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
    setStartQuery(s.display_name);
    setStartCoords(coords);
    setStartSuggestions([]);
    updateRouteAndBounds(coords, endCoords);
  };

  const selectEndSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    setEndQuery(s.display_name);
    setEndCoords(coords);
    setEndSuggestions([]);
    updateRouteAndBounds(startCoords, coords);
  };

  const selectPassengerEndSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    setPassengerEndQuery(s.display_name);
    setPassengerEndCoords(coords);
    setPassengerEndSuggestions([]);
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
      setRoadRoute([start, end]);
    }
  };

  const generateAiShortcuts = () => {
    setIsAiAnalyzing(true);
    setAiAnalysisResult("");

    setTimeout(() => {
      let shortcutAdvice = "";
      if (vehicleCategory === "Van/Mini Bus") {
        shortcutAdvice = `🚐 Vehicle Type: Van/Mini Bus\n⚠️ WARNING: Main Highways recommended. Avoid narrow interior village lanes around ${endQuery.split(",")[0]}.\n🛣️ Best Route: Stick to Primary A-Grade Highways. Recommended bypass shortcut via Outer Circular Road to avoid city bottleneck.`;
      } else if (vehicleCategory === "Bike") {
        shortcutAdvice = `🏍️ Vehicle Type: Motorcycle\n⚡ Fast By-Pass Active: Can utilize narrow interior shortcuts, bypass traffic signals through local roads. Total saved time ~15 mins.`;
      } else {
        shortcutAdvice = `🚗 Vehicle Category: Sedan / Medium Car\n✅ AI Shortcut Detected: Good balance. Use B-grade secondary connector roads to bypass toll/heavy traffic sections near ${startQuery.split(",")[0]}. Watch out for sharp turns in hilly areas.`;
      }

      setAiAnalysisResult(`🤖 AI Route Optimization Breakdown:\n📍 Distance: ${routeDistance}\n${shortcutAdvice}`);
      setIsAiAnalyzing(false);
    }, 1200);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !passwordInput) return;
    const user: User = {
      id: "USR-" + Date.now().toString().slice(-4),
      name: nameInput || (selectedRole === "driver" ? "Driver User" : "Passenger User"),
      phone: phoneInput,
      role: selectedRole,
      isProfileComplete: selectedRole === "passenger",
    };
    setCurrentUser(user);
  };

  const handleCompleteDriverRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      driverIdNo,
      profilePhoto: profilePhotoUrl,
      vehicleType: vehicleCategory,
      isProfileComplete: true,
    });
  };

  const handlePublishOrUpdateRide = () => {
    if (!currentUser) return;

    if (editingPostId) {
      setRidePosts((prev) =>
        prev.map((post) =>
          post.id === editingPostId
            ? {
                ...post,
                vehicle,
                vehicleCategory,
                seats,
                price,
                startName: startQuery,
                startCoords,
                endName: endQuery,
                endCoords,
                routePolyline: roadRoute,
                distanceKm: routeDistance,
                isLadiesOnly,
                aiShortcutAnalysis: aiAnalysisResult,
              }
            : post
        )
      );
      setEditingPostId(null);
      alert("✅ Ride Post Updated Successfully!");
    } else {
      const newRide: RidePost = {
        id: "RIDE-" + Date.now().toString().slice(-4),
        driverId: currentUser.id,
        driverName: currentUser.name,
        driverPhone: currentUser.phone,
        driverPhoto: currentUser.profilePhoto,
        vehicle,
        vehicleCategory,
        seats,
        price,
        startName: startQuery,
        startCoords,
        endName: endQuery,
        endCoords,
        routePolyline: roadRoute.length > 0 ? roadRoute : [startCoords, endCoords],
        distanceKm: routeDistance || "N/A",
        isLadiesOnly,
        status: "active",
        aiShortcutAnalysis: aiAnalysisResult,
        reviews: [],
      };
      setRidePosts([newRide, ...ridePosts]);
      alert("🚀 Ride Route Published Live!");
    }
  };

  const handleEditPost = (post: RidePost) => {
    setEditingPostId(post.id);
    setVehicle(post.vehicle);
    setVehicleCategory(post.vehicleCategory);
    setPrice(post.price);
    setSeats(post.seats);
    setStartQuery(post.startName);
    setStartCoords(post.startCoords);
    setEndQuery(post.endName);
    setEndCoords(post.endCoords);
    setIsLadiesOnly(post.isLadiesOnly);
    setAiAnalysisResult(post.aiShortcutAnalysis || "");
    updateRouteAndBounds(post.startCoords, post.endCoords);
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Are you sure you want to delete this ride post?")) {
      setRidePosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleMarkAsFinished = (postId: string) => {
    setRidePosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, status: "finished" } : post))
    );
    alert("✅ Ride marked as Finished!");
  };

  const handleSubmitReview = () => {
    if (!ratingTargetPostId || !currentUser) return;

    const newReview: Review = {
      passengerName: currentUser.name,
      rating: starCount,
      comment: commentText,
      date: new Date().toLocaleDateString(),
    };

    setRidePosts((prev) =>
      prev.map((post) =>
        post.id === ratingTargetPostId
          ? { ...post, reviews: [...(post.reviews || []), newReview] }
          : post
      )
    );

    setRatingTargetPostId(null);
    setCommentText("");
    alert("🌟 Thank you for your review!");
  };

  const filteredRides = passengerEndCoords
    ? ridePosts
        .filter((ride) => ride.status === "active")
        .map((ride) => {
          const distToDriverEnd = getDistanceInKm(
            passengerEndCoords[0],
            passengerEndCoords[1],
            ride.endCoords[0],
            ride.endCoords[1]
          );
          return { ...ride, distToPassengerEnd: distToDriverEnd };
        })
        .filter((ride) => ride.distToPassengerEnd <= 10)
        .sort((a, b) => a.distToPassengerEnd - b.distToPassengerEnd)
    : [];

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155", width: "100%", maxWidth: "420px" }}>
          <h1 style={{ color: "#38bdf8", textAlign: "center" }}>🌌 Galaxy Rides 3D</h1>
          <div style={{ display: "flex", background: "#0f172a", padding: "4px", borderRadius: "8px", marginBottom: "20px" }}>
            <button type="button" onClick={() => setSelectedRole("passenger")} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "passenger" ? "#0284c7" : "transparent", color: "#fff" }}>🙋‍♂️ Passenger</button>
            <button type="button" onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "driver" ? "#0284c7" : "transparent", color: "#fff" }}>🚗 Driver</button>
          </div>
          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {authMode === "register" && (
              <input type="text" placeholder="Full Name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
            )}
            <input type="text" placeholder="Phone Number" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={{ padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
            <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
            <button type="submit" style={{ padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>{authMode === "login" ? "Login" : "Register"}</button>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser.role === "driver" && !currentUser.isProfileComplete) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155", width: "100%", maxWidth: "480px" }}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>🪪 Driver ID & Vehicle Registration</h2>
          <form onSubmit={handleCompleteDriverRegistration} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>NIC or Driver's License Number</label>
              <input type="text" placeholder="e.g. 1998XXXXXV or 98234XXXX" value={driverIdNo} onChange={(e) => setDriverIdNo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Profile Photo URL / Upload Link</label>
              <input type="text" value={profilePhotoUrl} onChange={(e) => setProfilePhotoUrl(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Vehicle Category</label>
              <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value as any)} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }}>
                <option value="Sedan/Prius">Sedan / Hybrid Car</option>
                <option value="Small Car/Nano">Small Car / Alto / Nano</option>
                <option value="Van/Mini Bus">Van / Mini Bus / Coaster</option>
                <option value="Bike">Motorcycle / Bike</option>
              </select>
            </div>
            <button type="submit" style={{ padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>Complete Driver Profile</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#1e293b", padding: "15px 20px", borderRadius: "12px", border: "1px solid #334155" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {currentUser.profilePhoto && (
            <img src={currentUser.profilePhoto} alt="Driver Avatar" style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8" }} />
          )}
          <div>
            <h2 style={{ margin: 0, color: "#38bdf8" }}>🌌 Galaxy Rides 3D</h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
              {currentUser.name} | ID: <b>{currentUser.driverIdNo || currentUser.id}</b> ({currentUser.role.toUpperCase()})
            </p>
          </div>
        </div>
        <button onClick={() => setCurrentUser(null)} style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>Logout</button>
      </header>

      {/* DRIVER VIEW */}
      {currentUser.role === "driver" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
              <h3 style={{ color: "#38bdf8", margin: "0 0 12px 0" }}>
                {editingPostId ? "✏️ Edit Ride Post" : "🚗 Publish New Route"}
              </h3>

              <div style={{ marginBottom: "12px", position: "relative" }}>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Start Location (Google/OSRM Search)</label>
                <input type="text" value={startQuery} onChange={(e) => { setStartQuery(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                {startSuggestions.length > 0 && (
                  <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: 0, margin: "4px 0 0 0", zIndex: 1000, maxHeight: "160px", overflowY: "auto" }}>
                    {startSuggestions.map((item, idx) => (
                      <li key={idx} onClick={() => selectStartSuggestion(item)} style={{ padding: "8px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem" }}>📍 {item.display_name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ marginBottom: "12px", position: "relative" }}>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>End Destination (Google/OSRM Search)</label>
                <input type="text" value={endQuery} onChange={(e) => { setEndQuery(e.target.value); fetchSuggestions(e.target.value, setEndSuggestions); }} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #38bdf8" }} />
                {endSuggestions.length > 0 && (
                  <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: 0, margin: "4px 0 0 0", zIndex: 1000, maxHeight: "160px", overflowY: "auto" }}>
                    {endSuggestions.map((item, idx) => (
                      <li key={idx} onClick={() => selectEndSuggestion(item)} style={{ padding: "8px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem" }}>🏁 {item.display_name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <button onClick={generateAiShortcuts} disabled={isAiAnalyzing} style={{ width: "100%", padding: "10px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginBottom: "12px" }}>
                {isAiAnalyzing ? "⏳ AI Analyzing Shortest Routes..." : "🤖 Create Shortcut & Analysis with AI"}
              </button>

              {aiAnalysisResult && (
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", border: "1px solid #8b5cf6", whiteSpace: "pre-wrap", fontSize: "0.85rem", marginBottom: "12px", color: "#c084fc" }}>
                  {aiAnalysisResult}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Vehicle Model" style={{ padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price LKR" style={{ padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
              </div>

              <button onClick={handlePublishOrUpdateRide} style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                {editingPostId ? "💾 Save Changes" : "🚀 Publish Route Live"}
              </button>
            </div>

            <div style={{ height: "460px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
              <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                <MapFlyTo bounds={mapBounds} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {greenIcon && <Marker position={startCoords} icon={greenIcon}><Popup>🟢 Start</Popup></Marker>}
                {redIcon && <Marker position={endCoords} icon={redIcon}><Popup>🔴 Destination</Popup></Marker>}
                {roadRoute.length > 0 && <Polyline positions={roadRoute} pathOptions={{ color: "#2563eb", weight: 6 }} />}
              </MapContainer>
            </div>
          </div>

          <h3 style={{ color: "#38bdf8" }}>📋 My Posted Rides</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ridePosts.filter((p) => p.driverId === currentUser.id && p.status === "active").map((post) => (
              <div key={post.id} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, color: "#38bdf8" }}>{post.startName} ➔ {post.endName}</h4>
                  <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#94a3b8" }}>LKR {post.price} | {post.vehicle} ({post.vehicleCategory})</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleEditPost(post)} style={{ padding: "6px 12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>✏️ Edit</button>
                  <button onClick={() => handleDeletePost(post.id)} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🗑️ Delete</button>
                  <button onClick={() => handleMarkAsFinished(post.id)} style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>✅ Mark Finished</button>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ color: "#4ade80", marginTop: "30px" }}>🏁 Finished Rides ✅ Archive (Non-deletable)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ridePosts.filter((p) => p.driverId === currentUser.id && p.status === "finished").map((post) => (
              <div key={post.id} style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", border: "1px solid #16a34a" }}>
                <h4 style={{ margin: 0, color: "#4ade80" }}>✅ COMPLETED: {post.startName} ➔ {post.endName}</h4>
                <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>Passenger Reviews & Ratings:</p>
                {post.reviews && post.reviews.length > 0 ? (
                  post.reviews.map((rev, idx) => (
                    <div key={idx} style={{ background: "#1e293b", padding: "8px", borderRadius: "6px", marginTop: "4px", fontSize: "0.85rem" }}>
                      ⭐ <b>{rev.rating}/5</b> by {rev.passengerName}: "{rev.comment}"
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No passenger comments yet.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PASSENGER VIEW */}
      {currentUser.role === "passenger" && (
        <div style={{ maxWidth: "950px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #334155" }}>
            <h3 style={{ color: "#38bdf8", margin: "0 0 12px 0" }}>🏁 Search Your Destination (End Point)</h3>
            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Type destination in Sri Lanka..." value={passengerEndQuery} onChange={(e) => { setPassengerEndQuery(e.target.value); fetchSuggestions(e.target.value, setPassengerEndSuggestions); }} style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #38bdf8", background: "#0f172a", color: "#fff" }} />
              {passengerEndSuggestions.length > 0 && (
                <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "8px", listStyle: "none", padding: 0, margin: "4px 0 0 0", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                  {passengerEndSuggestions.map((item, idx) => (
                    <li key={idx} onClick={() => selectPassengerEndSuggestion(item)} style={{ padding: "10px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem" }}>🗺️ {item.display_name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredRides.map((ride) => (
              <div key={ride.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  {ride.driverPhoto && <img src={ride.driverPhoto} alt="Driver" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />}
                  <div>
                    <h4 style={{ margin: 0, color: "#38bdf8" }}>{ride.driverName} (ID: {ride.driverId})</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>🚗 {ride.vehicle} | 📞 {ride.driverPhone}</p>
                  </div>
                </div>
                <p style={{ color: "#cbd5e1", margin: "6px 0" }}><b>Route:</b> {ride.startName} ➔ {ride.endName}</p>
                <button onClick={() => setRatingTargetPostId(ride.id)} style={{ padding: "8px 14px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>⭐ Rate & Review Driver</button>
              </div>
            ))}
          </div>

          {ratingTargetPostId && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
              <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", width: "350px", border: "1px solid #38bdf8" }}>
                <h3 style={{ color: "#38bdf8", marginTop: 0 }}>⭐ Rate Driver</h3>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Rating Stars (1-5)</label>
                <input type="number" min="1" max="5" value={starCount} onChange={(e) => setStarCount(Number(e.target.value))} style={{ width: "100%", padding: "8px", margin: "6px 0 12px 0", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Comment / Feedback</label>
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ width: "100%", padding: "8px", margin: "6px 0 16px 0", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleSubmitReview} style={{ flex: 1, padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}>Submit</button>
                  <button onClick={() => setRatingTargetPostId(null)} style={{ flex: 1, padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
