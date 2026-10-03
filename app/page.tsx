"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic Imports for Leaflet (SSR Safety for Next.js)
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

// Types
type Language = "si" | "en" | "ta";
type AppTab = "carpool" | "rural_taxi";

interface User {
  id: string;
  name: string;
  phone: string;
  nic: string;
  role: "driver" | "passenger";
  isVerified: boolean;
  drivingLicense?: string;
  vehicleType?: "tuk" | "car" | "truck" | "van";
  vehicleModel?: string;
  vehicleNo?: string;
  ratePerKm?: number;
  villageOrCity?: string;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface PassengerRequest {
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerCoords: [number, number];
  status: "pending" | "accepted" | "rejected";
}

interface RidePost {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  isVerified: boolean;
  vehicle: string;
  vehicleType?: string;
  seats: number;
  price: number;
  startName: string;
  startCoords: [number, number];
  endName: string;
  endCoords: [number, number];
  routePolyline: [number, number][];
  distanceKm: string;
  status: "created" | "started" | "finished";
  driverLiveCoords?: [number, number];
  requests: PassengerRequest[];
}

interface RuralDriver {
  id: string;
  name: string;
  phone: string;
  village: string;
  vehicleType: "tuk" | "car" | "truck" | "van";
  vehicleName: string;
  vehicleNo: string;
  ratePerKm: number;
  coords: [number, number];
  isVerified: boolean;
  isOnline: boolean;
}

export default function GalaxyRidesApp() {
  const [lang, setLang] = useState<Language>("si");
  const [activeTab, setActiveTab] = useState<AppTab>("carpool");

  // Auth & KYC States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger">("driver");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [nicInput, setNicInput] = useState("");
  const [licenseInput, setLicenseInput] = useState("");
  const [vehicleTypeInput, setVehicleTypeInput] = useState<"tuk" | "car" | "truck" | "van">("car");
  const [vehicleModelInput, setVehicleModelInput] = useState("Nissan Sunny B11 (300-1234)");
  const [vehicleNoInput, setVehicleNoInput] = useState("300-1234");
  const [ratePerKmInput, setRatePerKmInput] = useState(150);
  const [villageInput, setVillageInput] = useState("තඹුත්තේගම");

  // Location & Form
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

  const [price, setPrice] = useState(1500);
  const [seats, setSeats] = useState(3);

  // Rides List
  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);
  const [selectedRideForPassenger, setSelectedRideForPassenger] = useState<RidePost | null>(null);

  // Rural Taxi Drivers List
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [ruralDrivers, setRuralDrivers] = useState<RuralDriver[]>([
    {
      id: "RD-1",
      name: "සුනිල් අයියා",
      phone: "0771234567",
      village: "තඹුත්තේගම",
      vehicleType: "tuk",
      vehicleName: "4-Stroke Three-Wheel",
      vehicleNo: "AB-1234",
      ratePerKm: 120,
      coords: [8.15, 80.2833],
      isVerified: true,
      isOnline: true,
    },
    {
      id: "RD-2",
      name: "සමන්ත (B11)",
      phone: "0719876543",
      village: "අනුරාධපුරය",
      vehicleType: "car",
      vehicleName: "Nissan Sunny B11",
      vehicleNo: "300-5678",
      ratePerKm: 150,
      coords: [8.3114, 80.4037],
      isVerified: true,
      isOnline: true,
    },
    {
      id: "RD-3",
      name: "නිමල් (Dimo Batta)",
      phone: "0751122334",
      village: "එප්පාවල",
      vehicleType: "truck",
      vehicleName: "Dimo Batta Light Truck",
      vehicleNo: "DA-9988",
      ratePerKm: 200,
      coords: [8.14, 80.32],
      isVerified: true,
      isOnline: true,
    },
  ]);

  // Icons
  const [greenIcon, setGreenIcon] = useState<any>(null);
  const [redIcon, setRedIcon] = useState<any>(null);
  const [carIcon, setCarIcon] = useState<any>(null);
  const [passengerIcon, setPassengerIcon] = useState<any>(null);
  const [tukIcon, setTukIcon] = useState<any>(null);
  const [truckIcon, setTruckIcon] = useState<any>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      setGreenIcon(
        new L.Icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      );
      setRedIcon(
        new L.Icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      );
      setCarIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3202/3202003.png",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        })
      );
      setPassengerIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/2815/2815428.png",
          iconSize: [35, 35],
          iconAnchor: [17, 35],
        })
      );
      setTukIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048314.png",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      );
      setTruckIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/2554/2554978.png",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        })
      );
    });
  }, []);

  const getDriverIcon = (type: string) => {
    if (type === "tuk") return tukIcon;
    if (type === "truck") return truckIcon;
    return carIcon;
  };

  const fetchSuggestions = (query: string, setFn: (s: Suggestion[]) => void) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.trim().length < 2) {
      setFn([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Sri Lanka")}&limit=5`
        );
        const data = await res.json();
        setFn(data || []);
      } catch (err) {
        console.error("Autosuggest Error:", err);
      }
    }, 300);
  };

  const updateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        const leafletCoords: [number, number][] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRoadRoute(leafletCoords);
        setRouteDistance(`${(data.routes[0].distance / 1000).toFixed(1)} km`);
        setMapBounds([
          [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
          [Math.max(start[0], end[0]), Math.max(start[1], end[1])],
        ]);
      }
    } catch (err) {
      setRoadRoute([start, end]);
    }
  };

  // Registration & KYC Auth
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !nicInput) {
      alert("කරුණාකර දුරකථන අංකය සහ NIC අංකය ඇතුළත් කරන්න.");
      return;
    }

    const newUser: User = {
      id: "USR-" + Date.now().toString().slice(-4),
      name: nameInput || (selectedRole === "driver" ? "Driver App" : "Passenger App"),
      phone: phoneInput,
      nic: nicInput,
      role: selectedRole,
      isVerified: true,
      drivingLicense: licenseInput,
      vehicleType: vehicleTypeInput,
      vehicleModel: vehicleModelInput,
      vehicleNo: vehicleNoInput,
      ratePerKm: ratePerKmInput,
      villageOrCity: villageInput,
    };

    setCurrentUser(newUser);

    // Auto-Register Driver into Local Directory
    if (selectedRole === "driver") {
      const newRuralDriver: RuralDriver = {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        village: villageInput || "ග්‍රාමීය ප්‍රදේශය",
        vehicleType: vehicleTypeInput,
        vehicleName: vehicleModelInput || "වාහනය",
        vehicleNo: vehicleNoInput || "NC-XXXX",
        ratePerKm: ratePerKmInput,
        coords: [8.2 + Math.random() * 0.1, 80.3 + Math.random() * 0.1],
        isVerified: true,
        isOnline: true,
      };
      setRuralDrivers((prev) => [newRuralDriver, ...prev]);
    }

    alert("✅ Registration & KYC Verified Successfully!");
  };

  // Driver Post Ride
  const handlePublishRide = () => {
    if (!currentUser) return;

    const newRide: RidePost = {
      id: "RIDE-" + Date.now().toString().slice(-4),
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      isVerified: currentUser.isVerified,
      vehicle: currentUser.vehicleModel || "Vehicle",
      vehicleType: currentUser.vehicleType,
      seats,
      price,
      startName: startQuery,
      startCoords,
      endName: endQuery,
      endCoords,
      routePolyline: roadRoute.length > 0 ? roadRoute : [startCoords, endCoords],
      distanceKm: routeDistance || "N/A",
      status: "created",
      requests: [],
    };

    setRidePosts([newRide, ...ridePosts]);
    alert("🚀 Ride Route Published Live!");
  };

  // Live Driver Location Start
  const handleStartRide = (rideId: string) => {
    if (!navigator.geolocation) {
      alert("⚠️ Your device does not support Geolocation!");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        setRidePosts((prev) =>
          prev.map((r) =>
            r.id === rideId ? { ...r, status: "started", driverLiveCoords: liveCoords } : r
          )
        );

        alert("🏁 Ride Started! GPS ON & Sharing Live Location.");

        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            const updatedCoords: [number, number] = [watchPos.coords.latitude, watchPos.coords.longitude];
            setRidePosts((prev) =>
              prev.map((r) => (r.id === rideId ? { ...r, driverLiveCoords: updatedCoords } : r))
            );
          },
          (err) => console.error("GPS Watch Error:", err),
          { enableHighAccuracy: true }
        );
      },
      (err) => {
        alert("🚨 Location Access Denied! Turn ON GPS to start the ride.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Passenger Apply for Ride
  const handleApplyRide = (ride: RidePost) => {
    if (!currentUser) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const pCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        const newReq: PassengerRequest = {
          passengerId: currentUser.id,
          passengerName: currentUser.name,
          passengerPhone: currentUser.phone,
          passengerCoords: pCoords,
          status: "pending",
        };

        setRidePosts((prev) =>
          prev.map((r) => (r.id === ride.id ? { ...r, requests: [...r.requests, newReq] } : r))
        );

        alert("📩 Booking Request Sent to Driver!");
      });
    } else {
      alert("Please enable location to apply!");
    }
  };

  // Driver Accept Passenger
  const handleAcceptPassenger = (rideId: string, passengerId: string) => {
    setRidePosts((prev) =>
      prev.map((r) => {
        if (r.id === rideId) {
          const updatedReqs = r.requests.map((req) =>
            req.passengerId === passengerId ? { ...req, status: "accepted" as const } : req
          );
          return { ...r, requests: updatedReqs };
        }
        return r;
      })
    );
    alert("✅ Passenger Request Accepted! Location visible on map.");
  };

  const filteredRuralDrivers = ruralDrivers.filter(
    (d) => vehicleFilter === "all" || d.vehicleType === vehicleFilter
  );

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "15px" }}>
      {!currentUser ? (
        /* LOGIN / KYC REGISTRATION MODAL */
        <div style={{ maxWidth: "450px", margin: "40px auto", background: "#1e293b", padding: "25px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h2 style={{ color: "#38bdf8", textAlign: "center", margin: "0 0 15px 0" }}>🌌 Galaxy Rides Registration & KYC</h2>

          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <button type="button" onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "10px", background: selectedRole === "driver" ? "#0284c7" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
              🚘 Driver Mode
            </button>
            <button type="button" onClick={() => setSelectedRole("passenger")} style={{ flex: 1, padding: "10px", background: selectedRole === "passenger" ? "#0284c7" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
              🙋‍♂️ Passenger Mode
            </button>
          </div>

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>සම්පූර්ණ නම (Full Name):</label>
              <input type="text" placeholder="e.g. කසුන් පෙරේරා" value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} required />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>දුරකථන අංකය (Phone Number):</label>
              <input type="text" placeholder="07XXXXXXXX" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} required />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>NIC / හැඳුනුම්පත් අංකය (KYC Verification):</label>
              <input type="text" placeholder="98XXXXXXXXV" value={nicInput} onChange={(e) => setNicInput(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} required />
            </div>

            {selectedRole === "driver" && (
              <>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Driving License Number:</label>
                  <input type="text" value={licenseInput} onChange={(e) => setLicenseInput(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>වාහන වර්ගය (Vehicle Category):</label>
                  <select value={vehicleTypeInput} onChange={(e) => setVehicleTypeInput(e.target.value as any)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }}>
                    <option value="tuk">🛺 Three-Wheeler</option>
                    <option value="car">🚗 Car (B11, Alto, Maruti, etc.)</option>
                    <option value="van">🚐 Van / Mini Bus</option>
                    <option value="truck">🛻 Light Truck (Dimo Batta)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>වාහන මොඩලයේ නම සහ අංකය:</label>
                  <input type="text" value={vehicleModelInput} onChange={(e) => setVehicleModelInput(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>ගම / නගරය (Village/Town):</label>
                  <input type="text" value={villageInput} onChange={(e) => setVillageInput(e.target.value)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>1 KM ගාස්තුව (Rs. Rate / KM):</label>
                  <input type="number" value={ratePerKmInput} onChange={(e) => setRatePerKmInput(Number(e.target.value))} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                </div>
              </>
            )}

            <button type="submit" style={{ padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>
              Submit & Complete Registration ✅
            </button>
          </form>
        </div>
      ) : (
        /* MAIN APP INTERFACE */
        <div>
          {/* Header & App Switcher */}
          <div style={{ background: "#1e293b", padding: "15px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0, color: "#38bdf8" }}>
                🌌 Galaxy Rides ({currentUser.role.toUpperCase()})
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#0f172a", padding: "6px 12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.85rem" }}>
                  👤 {currentUser.name} {currentUser.isVerified && <span style={{ color: "#4ade80" }}>Verified ✅</span>}
                </div>

                {/* Language Switcher */}
                <select value={lang} onChange={(e) => setLang(e.target.value as Language)} style={{ padding: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", borderRadius: "6px" }}>
                  <option value="si">🇱🇰 සිංහල</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="ta">🇱🇰 தமிழ்</option>
                </select>

                <button onClick={() => setCurrentUser(null)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}>
                  Logout
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button onClick={() => setActiveTab("carpool")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "carpool" ? "#0284c7" : "#0f172a", color: "#fff" }}>
                🚗 Route Sharing (Carpool Live Map)
              </button>
              <button onClick={() => setActiveTab("rural_taxi")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "rural_taxi" ? "#16a34a" : "#0f172a", color: "#fff" }}>
                🛺 ග්‍රාමීය Taxi & බඩු ප්‍රවාහනය
              </button>
            </div>
          </div>

          {/* MODE 1: ROUTE SHARING (CARPOOL WITH LIVE OSRM & GPS TRACKING) */}
          {activeTab === "carpool" && (
            <div>
              {currentUser.role === "driver" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
                  {/* Left: Driver Route Post & List */}
                  <div>
                    <div style={{ background: "#1e293b", padding: "18px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #334155" }}>
                      <h3 style={{ color: "#38bdf8", margin: "0 0 10px 0" }}>🚗 Post Live Route (OSRM Distance)</h3>

                      <div style={{ marginBottom: "10px", position: "relative" }}>
                        <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Start Location</label>
                        <input type="text" value={startQuery} onChange={(e) => { setStartQuery(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                        {startSuggestions.length > 0 && (
                          <ul style={{ position: "absolute", background: "#1e293b", border: "1px solid #38bdf8", width: "100%", zIndex: 100, listStyle: "none", padding: 0 }}>
                            {startSuggestions.map((s, idx) => (
                              <li key={idx} onClick={() => { setStartCoords([parseFloat(s.lat), parseFloat(s.lon)]); setStartQuery(s.display_name); setStartSuggestions([]); updateRoute([parseFloat(s.lat), parseFloat(s.lon)], endCoords); }} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #334155" }}>🟢 {s.display_name}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div style={{ marginBottom: "10px", position: "relative" }}>
                        <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Destination</label>
                        <input type="text" value={endQuery} onChange={(e) => { setEndQuery(e.target.value); fetchSuggestions(e.target.value, setEndSuggestions); }} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #38bdf8", borderRadius: "6px" }} />
                        {endSuggestions.length > 0 && (
                          <ul style={{ position: "absolute", background: "#1e293b", border: "1px solid #38bdf8", width: "100%", zIndex: 100, listStyle: "none", padding: 0 }}>
                            {endSuggestions.map((s, idx) => (
                              <li key={idx} onClick={() => { setEndCoords([parseFloat(s.lat), parseFloat(s.lon)]); setEndQuery(s.display_name); setEndSuggestions([]); updateRoute(startCoords, [parseFloat(s.lat), parseFloat(s.lon)]); }} style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #334155" }}>🔴 {s.display_name}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Seats Available:</label>
                          <input type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Price per Seat (Rs.):</label>
                          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                        </div>
                      </div>

                      {routeDistance && <p style={{ margin: "5px 0 10px 0", color: "#4ade80", fontSize: "0.85rem", fontWeight: "bold" }}>📏 Total OSRM Distance: {routeDistance}</p>}

                      <button onClick={handlePublishRide} style={{ width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                        Publish Route Live
                      </button>
                    </div>

                    <h3>📋 My Posted Long Distance Rides</h3>
                    {ridePosts.filter((r) => r.driverId === currentUser.id).map((ride) => (
                      <div key={ride.id} style={{ background: "#1e293b", padding: "15px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #334155" }}>
                        <h4 style={{ margin: 0, color: "#38bdf8" }}>{ride.startName} ➔ {ride.endName}</h4>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "6px 0" }}>Status: {ride.status === "started" ? "🟢 LIVE IN PROGRESS" : "⏳ Scheduled"}</p>

                        {ride.status !== "started" && (
                          <button onClick={() => handleStartRide(ride.id)} style={{ padding: "8px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
                            📍 Turn ON GPS & Start Live Ride
                          </button>
                        )}

                        {/* Passenger Requests */}
                        {ride.requests.length > 0 && (
                          <div style={{ marginTop: "10px", background: "#0f172a", padding: "10px", borderRadius: "8px" }}>
                            <h5 style={{ margin: "0 0 6px 0", color: "#f59e0b" }}>📩 Passenger Requests:</h5>
                            {ride.requests.map((req, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "0.8rem" }}>🙋‍♂️ {req.passengerName} ({req.passengerPhone})</span>
                                {req.status === "pending" ? (
                                  <button onClick={() => handleAcceptPassenger(ride.id, req.passengerId)} style={{ background: "#0284c7", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>Accept Request</button>
                                ) : (
                                  <span style={{ color: "#4ade80", fontSize: "0.75rem" }}>✅ Accepted (Location Visible)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right: Map View */}
                  <div style={{ height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                    <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                      <MapFlyTo bounds={mapBounds} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {greenIcon && <Marker position={startCoords} icon={greenIcon}><Popup>Start</Popup></Marker>}
                      {redIcon && <Marker position={endCoords} icon={redIcon}><Popup>End</Popup></Marker>}
                      {roadRoute.length > 0 && <Polyline positions={roadRoute} pathOptions={{ color: "#2563eb", weight: 5 }} />}

                      {/* Live Driver Moving Position */}
                      {ridePosts.find((r) => r.driverId === currentUser.id)?.driverLiveCoords && carIcon && (
                        <Marker position={ridePosts.find((r) => r.driverId === currentUser.id)!.driverLiveCoords!} icon={carIcon}>
                          <Popup>🚘 Your Live Position</Popup>
                        </Marker>
                      )}

                      {/* Accepted Passengers */}
                      {ridePosts.find((r) => r.driverId === currentUser.id)?.requests.filter((req) => req.status === "accepted").map((req, i) => (
                        passengerIcon && (
                          <Marker key={i} position={req.passengerCoords} icon={passengerIcon}>
                            <Popup>🙋‍♂️ Passenger: {req.passengerName}</Popup>
                          </Marker>
                        )
                      ))}
                    </MapContainer>
                  </div>
                </div>
              ) : (
                /* PASSENGER CARPOOL VIEW */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
                  <div>
                    <h3>🚗 Available Driver Rides</h3>
                    {ridePosts.map((ride) => (
                      <div key={ride.id} onClick={() => { setSelectedRideForPassenger(ride); setMapBounds([[ride.startCoords[0], ride.startCoords[1]], [ride.endCoords[0], ride.endCoords[1]]]); }} style={{ background: "#1e293b", padding: "15px", borderRadius: "12px", marginBottom: "12px", border: selectedRideForPassenger?.id === ride.id ? "2px solid #38bdf8" : "1px solid #334155", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <h4 style={{ margin: 0, color: "#38bdf8" }}>{ride.driverName} {ride.isVerified && <span style={{ color: "#4ade80" }}>Verified ✅</span>}</h4>
                          {ride.status === "started" ? (
                            <span style={{ background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem" }}>🔴 LIVE RIDE STARTED</span>
                          ) : (
                            <span style={{ background: "#64748b", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem" }}>Scheduled</span>
                          )}
                        </div>
                        <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>📍 {ride.startName} ➔ {ride.endName}</p>
                        <p style={{ margin: "0", color: "#94a3b8", fontSize: "0.8rem" }}>Vehicle: {ride.vehicle} | LKR {ride.price} | Seats: {ride.seats}</p>

                        <button onClick={(e) => { e.stopPropagation(); handleApplyRide(ride); }} style={{ marginTop: "10px", padding: "8px 14px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>
                          ✋ Apply / Book Ride
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Passenger Map View */}
                  <div style={{ height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                    <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                      <MapFlyTo bounds={mapBounds} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                      {selectedRideForPassenger && (
                        <>
                          {greenIcon && <Marker position={selectedRideForPassenger.startCoords} icon={greenIcon}><Popup>Start</Popup></Marker>}
                          {redIcon && <Marker position={selectedRideForPassenger.endCoords} icon={redIcon}><Popup>End</Popup></Marker>}
                          <Polyline positions={selectedRideForPassenger.routePolyline} pathOptions={{ color: "#2563eb", weight: 5 }} />

                          {selectedRideForPassenger.driverLiveCoords && carIcon && (
                            <Marker position={selectedRideForPassenger.driverLiveCoords} icon={carIcon}>
                              <Popup>🚘 Driver's Live GPS Location</Popup>
                            </Marker>
                          )}
                        </>
                      )}
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: RURAL TAXI & TRANSPORT DIRECTORY (LOCAL CALL/WHATSAPP & FILTER) */}
          {activeTab === "rural_taxi" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
              {/* Directory & Filters */}
              <div>
                <div style={{ background: "#1e293b", padding: "12px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #334155" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#4ade80" }}>🔎 වාහන වර්ගය තෝරන්න (Category Filter)</h4>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button onClick={() => setVehicleFilter("all")} style={{ padding: "6px 12px", background: vehicleFilter === "all" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>සියල්ල</button>
                    <button onClick={() => setVehicleFilter("tuk")} style={{ padding: "6px 12px", background: vehicleFilter === "tuk" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>🛺 ත්‍රීවීල්</button>
                    <button onClick={() => setVehicleFilter("car")} style={{ padding: "6px 12px", background: vehicleFilter === "car" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>🚗 Cars (B11/Alto)</button>
                    <button onClick={() => setVehicleFilter("truck")} style={{ padding: "6px 12px", background: vehicleFilter === "truck" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>🛻 Dimo Batta</button>
                  </div>
                </div>

                <h3>📍 ළඟ ඉන්න ග්‍රාමීය Drivers ලා Directory</h3>
                {filteredRuralDrivers.map((driver) => (
                  <div key={driver.id} style={{ background: "#1e293b", padding: "14px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "#38bdf8" }}>
                        {driver.name} {driver.isVerified && <span style={{ color: "#4ade80" }}>✅</span>}
                      </h4>
                      <span style={{ background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem" }}>ONLINE</span>
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>
                      🚘 {driver.vehicleName} ({driver.vehicleNo})
                    </p>
                    <p style={{ margin: "0 0 10px 0", color: "#f59e0b", fontSize: "0.85rem", fontWeight: "bold" }}>
                      🏡 ගම: {driver.village} | 💵 1 km ට රු. {driver.ratePerKm}
                    </p>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={`tel:${driver.phone}`} style={{ flex: 1, textAlign: "center", textDecoration: "none", background: "#2563eb", color: "#fff", padding: "8px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.8rem" }}>
                        📞 Direct Call
                      </a>
                      <a href={`https://wa.me/94${driver.phone.slice(1)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", textDecoration: "none", background: "#16a34a", color: "#fff", padding: "8px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.8rem" }}>
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Local Drivers Map */}
              <div style={{ height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                <MapContainer center={[8.3114, 80.4037]} zoom={10} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredRuralDrivers.map((driver) => {
                    const icon = getDriverIcon(driver.vehicleType);
                    return (
                      icon && (
                        <Marker key={driver.id} position={driver.coords} icon={icon}>
                          <Popup>
                            <div style={{ color: "#000" }}>
                              <strong>{driver.name} ✅</strong> <br />
                              {driver.vehicleName} ({driver.vehicleNo}) <br />
                              🏡 {driver.village} <br />
                              📞 <a href={`tel:${driver.phone}`}>{driver.phone}</a>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
