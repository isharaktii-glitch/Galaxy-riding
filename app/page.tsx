"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic Imports for Leaflet (SSR Safe)
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

interface User {
  id: string;
  name: string;
  phone: string;
  role: "driver" | "passenger";
  vehicleType?: string;
  vehicleModel?: string;
  currentCoords?: [number, number];
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
  vehicle: string;
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

export default function GalaxyRidesApp() {
  const [lang, setLang] = useState<Language>("si");

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger">("driver");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

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

  // Selected Ride for Passenger Detail View
  const [selectedRideForPassenger, setSelectedRideForPassenger] = useState<RidePost | null>(null);

  // Icons
  const [greenIcon, setGreenIcon] = useState<any>(null);
  const [redIcon, setRedIcon] = useState<any>(null);
  const [carIcon, setCarIcon] = useState<any>(null);
  const [passengerIcon, setPassengerIcon] = useState<any>(null);

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
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3202/3202003.png", // Car Icon
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        })
      );
      setPassengerIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/2815/2815428.png", // Person Icon
          iconSize: [35, 35],
          iconAnchor: [17, 35],
        })
      );
    });
  }, []);

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

  // Auth Submit
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput) return;
    setCurrentUser({
      id: "USR-" + Date.now().toString().slice(-4),
      name: nameInput || (selectedRole === "driver" ? "Driver App" : "Passenger App"),
      phone: phoneInput,
      role: selectedRole,
      vehicleModel: "Toyota Prius (CAD-1234)",
    });
  };

  // Driver Post Ride
  const handlePublishRide = () => {
    if (!currentUser) return;

    const newRide: RidePost = {
      id: "RIDE-" + Date.now().toString().slice(-4),
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      vehicle: currentUser.vehicleModel || "Vehicle",
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
    alert("🚀 Ride Route Published!");
  };

  // 🔴 DRIVER: START RIDE WITH MANDATORY GPS LOCATION ON
  const handleStartRide = (rideId: string) => {
    if (!navigator.geolocation) {
      alert("⚠️ Your device does not support Geolocation!");
      return;
    }

    // Force Location Request
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        // Update Ride Status
        setRidePosts((prev) =>
          prev.map((r) =>
            r.id === rideId ? { ...r, status: "started", driverLiveCoords: liveCoords } : r
          )
        );

        alert("🏁 Ride Started! Location ON and sharing live tracking to passengers.");

        // Continuous Live Tracking (PickMe Style)
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
        alert("🚨 Location Access Denied! Please TURN ON GPS/Location to start the ride.");
      },
      { enableHighAccuracy: true }
    );
  };

  // PASSENGER: APPLY FOR RIDE
  const handleApplyRide = (ride: RidePost) => {
    if (!currentUser) return;

    // Get Passenger Location
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

  // DRIVER: ACCEPT PASSENGER REQUEST
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
    alert("✅ Passenger Request Accepted! Passenger location is now visible on your map.");
  };

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      {!currentUser ? (
        <div style={{ maxWidth: "400px", margin: "80px auto", background: "#1e293b", padding: "30px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h2 style={{ color: "#38bdf8", textAlign: "center" }}>🌌 Galaxy Rides Live</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "10px", background: selectedRole === "driver" ? "#0284c7" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px" }}>Driver</button>
            <button onClick={() => setSelectedRole("passenger")} style={{ flex: 1, padding: "10px", background: selectedRole === "passenger" ? "#0284c7" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px" }}>Passenger</button>
          </div>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="text" placeholder="Full Name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ padding: "10px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
            <input type="text" placeholder="Phone Number" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={{ padding: "10px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} required />
            <button type="submit" style={{ padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}>Enter App</button>
          </form>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", padding: "15px 20px", borderRadius: "10px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, color: "#38bdf8" }}>🌌 Galaxy Rides ({currentUser.role.toUpperCase()})</h2>
            <button onClick={() => setCurrentUser(null)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Logout</button>
          </div>

          {/* DRIVER VIEW */}
          {currentUser.role === "driver" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
              {/* Left Column: Form & Active Rides */}
              <div>
                <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#38bdf8", margin: "0 0 10px 0" }}>🚗 Post New Route</h3>
                  
                  <div style={{ marginBottom: "10px", position: "relative" }}>
                    <label style={{ fontSize: "0.8rem" }}>Start Location</label>
                    <input type="text" value={startQuery} onChange={(e) => { setStartQuery(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                    {startSuggestions.length > 0 && (
                      <ul style={{ position: "absolute", background: "#1e293b", border: "1px solid #38bdf8", width: "100%", zIndex: 100, listStyle: "none", padding: 0 }}>
                        {startSuggestions.map((s, idx) => (
                          <li key={idx} onClick={() => { setStartCoords([parseFloat(s.lat), parseFloat(s.lon)]); setStartQuery(s.display_name); setStartSuggestions([]); updateRoute([parseFloat(s.lat), parseFloat(s.lon)], endCoords); }} style={{ padding: "8px", cursor: "pointer" }}>🟢 {s.display_name}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginBottom: "10px", position: "relative" }}>
                    <label style={{ fontSize: "0.8rem" }}>Destination</label>
                    <input type="text" value={endQuery} onChange={(e) => { setEndQuery(e.target.value); fetchSuggestions(e.target.value, setEndSuggestions); }} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #38bdf8", borderRadius: "6px" }} />
                    {endSuggestions.length > 0 && (
                      <ul style={{ position: "absolute", background: "#1e293b", border: "1px solid #38bdf8", width: "100%", zIndex: 100, listStyle: "none", padding: 0 }}>
                        {endSuggestions.map((s, idx) => (
                          <li key={idx} onClick={() => { setEndCoords([parseFloat(s.lat), parseFloat(s.lon)]); setEndQuery(s.display_name); setEndSuggestions([]); updateRoute(startCoords, [parseFloat(s.lat), parseFloat(s.lon)]); }} style={{ padding: "8px", cursor: "pointer" }}>🔴 {s.display_name}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button onClick={handlePublishRide} style={{ width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}>Publish Route Live</button>
                </div>

                {/* Driver's Posted Rides & Passenger Requests */}
                <h3>📋 My Posted Rides</h3>
                {ridePosts.filter((r) => r.driverId === currentUser.id).map((ride) => (
                  <div key={ride.id} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #334155" }}>
                    <h4>{ride.startName} ➔ {ride.endName}</h4>
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Status: {ride.status === "started" ? "🟢 LIVE IN PROGRESS" : "⏳ Not Started"}</p>
                    
                    {ride.status !== "started" && (
                      <button onClick={() => handleStartRide(ride.id)} style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                        📍 Turn ON GPS & Start Ride
                      </button>
                    )}

                    {/* Pending Requests */}
                    {ride.requests.length > 0 && (
                      <div style={{ marginTop: "10px", background: "#0f172a", padding: "10px", borderRadius: "8px" }}>
                        <h5 style={{ margin: "0 0 6px 0", color: "#f59e0b" }}>📩 Passenger Requests:</h5>
                        {ride.requests.map((req, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "0.85rem" }}>🙋‍♂️ {req.passengerName} ({req.passengerPhone})</span>
                            {req.status === "pending" ? (
                              <button onClick={() => handleAcceptPassenger(ride.id, req.passengerId)} style={{ background: "#0284c7", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>Accept</button>
                            ) : (
                              <span style={{ color: "#4ade80", fontSize: "0.8rem" }}>✅ Accepted (Location Visible)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column: Driver Map */}
              <div style={{ height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                  <MapFlyTo bounds={mapBounds} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {greenIcon && <Marker position={startCoords} icon={greenIcon}><Popup>Start</Popup></Marker>}
                  {redIcon && <Marker position={endCoords} icon={redIcon}><Popup>End</Popup></Marker>}
                  {roadRoute.length > 0 && <Polyline positions={roadRoute} pathOptions={{ color: "#2563eb", weight: 5 }} />}

                  {/* Show Driver's Live Location (PickMe Style) */}
                  {ridePosts.find((r) => r.driverId === currentUser.id)?.driverLiveCoords && carIcon && (
                    <Marker position={ridePosts.find((r) => r.driverId === currentUser.id)!.driverLiveCoords!} icon={carIcon}>
                      <Popup>🚘 Your Live Driver Position</Popup>
                    </Marker>
                  )}

                  {/* Show Accepted Passengers' Locations */}
                  {ridePosts.find((r) => r.driverId === currentUser.id)?.requests.filter((req) => req.status === "accepted").map((req, i) => (
                    passengerIcon && (
                      <Marker key={i} position={req.passengerCoords} icon={passengerIcon}>
                        <Popup>🙋‍♂️️ Passenger: {req.passengerName}</Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {/* PASSENGER VIEW */}
          {currentUser.role === "passenger" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
              {/* Left Column: All Available Drivers */}
              <div>
                <h3>🚗 Available Driver Rides</h3>
                {ridePosts.map((ride) => (
                  <div key={ride.id} onClick={() => { setSelectedRideForPassenger(ride); setMapBounds([[ride.startCoords[0], ride.startCoords[1]], [ride.endCoords[0], ride.endCoords[1]]]); }} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "12px", border: selectedRideForPassenger?.id === ride.id ? "2px solid #38bdf8" : "1px solid #334155", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h4 style={{ margin: 0, color: "#38bdf8" }}>{ride.driverName}</h4>
                      {ride.status === "started" ? (
                        <span style={{ background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem" }}>🔴 LIVE RIDE STARTED</span>
                      ) : (
                        <span style={{ background: "#64748b", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem" }}>Scheduled</span>
                      )}
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "0.85rem" }}>📍 {ride.startName} ➔ {ride.endName}</p>
                    <p style={{ margin: "0", color: "#94a3b8", fontSize: "0.8rem" }}>Vehicle: {ride.vehicle} | LKR {ride.price}</p>
                    
                    <button onClick={(e) => { e.stopPropagation(); handleApplyRide(ride); }} style={{ marginTop: "10px", padding: "8px 14px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                      ✋ Apply / Book Ride
                    </button>
                  </div>
                ))}
              </div>

              {/* Right Column: Passenger Map showing Selected Driver's Route & Live GPS */}
              <div style={{ height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                  <MapFlyTo bounds={mapBounds} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {selectedRideForPassenger && (
                    <>
                      {greenIcon && <Marker position={selectedRideForPassenger.startCoords} icon={greenIcon}><Popup>Start: {selectedRideForPassenger.startName}</Popup></Marker>}
                      {redIcon && <Marker position={selectedRideForPassenger.endCoords} icon={redIcon}><Popup>End: {selectedRideForPassenger.endName}</Popup></Popup></Marker>}
                      <Polyline positions={selectedRideForPassenger.routePolyline} pathOptions={{ color: "#2563eb", weight: 5 }} />

                      {/* Live Moving Car Icon if Driver Has Started Ride */}
                      {selectedRideForPassenger.driverLiveCoords && carIcon && (
                        <Marker position={selectedRideForPassenger.driverLiveCoords} icon={carIcon}>
                          <Popup>🚘 Driver's Live Location</Popup>
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
    </div>
  );
}
