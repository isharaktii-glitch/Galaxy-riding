"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Leaflet Components Dynamic Import
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

interface RidePost {
  id: string;
  driverName: string;
  driverPhone: string;
  isVerified: boolean;
  vehicle: string;
  seats: number;
  price: number;
  startName: string;
  startCoords: [number, number];
  endName: string;
  endCoords: [number, number];
  routePolyline: [number, number][];
  isLadiesOnly: boolean;
  rating: number;
  otpCode: string;
}

function MapController({ coords }: { coords: [number, number] }) {
  useEffect(() => {
    import("react-leaflet").then(() => {
      // Leaflet map controller ready
    });
  }, [coords]);
  return null;
}

export default function GalaxyRides3D() {
  const [activeTab, setActiveTab] = useState<"driver" | "passenger">("driver");

  // Driver Form State
  const [driverName, setDriverName] = useState("සහාන්");
  const [driverPhone, setDriverPhone] = useState("0771234567");
  const [vehicle, setVehicle] = useState("Toyota Prius Hybrid");
  const [price, setPrice] = useState(1200);
  const [seats, setSeats] = useState(3);
  const [isLadiesOnly, setIsLadiesOnly] = useState(false);

  // Locations & Coordinates State
  const [startQuery, setStartQuery] = useState("Colombo Fort");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9344, 79.8428]);

  const [endQuery, setEndQuery] = useState("Kandy Clock Tower");
  const [endCoords, setEndCoords] = useState<[number, number]>([7.2936, 80.6413]);

  // Ride Posts List
  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);

  // Passenger State
  const [searchDestination, setSearchDestination] = useState("");
  const [filterLadiesOnly, setFilterLadiesOnly] = useState(false);
  const [trackingRide, setTrackingRide] = useState<RidePost | null>(null);
  const [driverLiveLocation, setDriverLiveLocation] = useState<[number, number] | null>(null);

  // 1. Forward Geocoding (Text -> Coordinates)
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

  // 2. Reverse Geocoding (Coordinates -> Text Name)
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        return parts.slice(0, 3).join(",");
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

  const handlePublishRide = () => {
    const newRide: RidePost = {
      id: Date.now().toString(),
      driverName,
      driverPhone,
      isVerified: true,
      vehicle,
      seats,
      price,
      startName: startQuery,
      startCoords,
      endName: endQuery,
      endCoords,
      routePolyline: [startCoords, endCoords],
      isLadiesOnly,
      rating: 4.9,
      otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
    };

    setRidePosts([newRide, ...ridePosts]);
    alert("🎉 ඔබගේ Ride එක සාර්ථකව Publish කරන ලදී!");
    setActiveTab("passenger");
  };

  useEffect(() => {
    let watchId: number;
    if (trackingRide && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setDriverLiveLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [trackingRide]);

  const filteredRides = ridePosts.filter((ride) => {
    const matchesDest =
      searchDestination === "" ||
      ride.endName.toLowerCase().includes(searchDestination.toLowerCase());
    const matchesLadies = filterLadiesOnly ? ride.isLadiesOnly : true;
    return matchesDest && matchesLadies;
  });

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      <header style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2.2rem", color: "#38bdf8", margin: "0" }}>🌌 Galaxy Rides 3D</h1>
        <p style={{ color: "#94a3b8" }}>Real-time Smart Carpooling & Interactive Pin Map</p>

        <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("driver")}
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", backgroundColor: activeTab === "driver" ? "#0284c7" : "#334155", color: "#fff" }}
          >
            🚗 Driver (ගමනක් Publish කරන්න)
          </button>
          <button
            onClick={() => setActiveTab("passenger")}
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", backgroundColor: activeTab === "passenger" ? "#0284c7" : "#334155", color: "#fff" }}
          >
            🔍 Passenger (Rides සොයන්න)
          </button>
        </div>
      </header>

      {/* DRIVER PANEL */}
      {activeTab === "driver" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
            <h2 style={{ color: "#38bdf8", marginTop: "0" }}>1. ගමනේ විස්තර ඇතුලත් කරන්න</h2>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", color: "#cbd5e1" }}>Start Location (ආරම්භය)</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={startQuery}
                  onChange={(e) => setStartQuery(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
                <button onClick={handleStartSearch} style={{ padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🔍 Go</button>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", color: "#cbd5e1" }}>Ending Location (ගමනාන්තය)</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={endQuery}
                  onChange={(e) => setEndQuery(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
                />
                <button onClick={handleEndSearch} style={{ padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🔍 Go</button>
              </div>
            </div>

            <p style={{ color: "#38bdf8", fontSize: "0.85rem", margin: "8px 0" }}>
              💡 <b>Tip:</b> Map එකේ ඇති Markers (🟢 Start / 🔴 End) Drag කරලා ඔයාට අවශ්‍ය නිවැරදිම තැනට තියන්න. නම Auto Update වේ!
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px", marginTop: "16px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>වාහනය</label>
                <input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>ගාන (LKR)</label>
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }} />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>ඇත ඇති අසුන් ගණන (Seats)</label>
              <input type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }} />
            </div>

            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="ladiesOnly" checked={isLadiesOnly} onChange={(e) => setIsLadiesOnly(e.target.checked)} />
              <label htmlFor="ladiesOnly" style={{ color: "#f472b6", fontWeight: "bold" }}>🌸 Ladies-Only Ride (කාන්තාවන්ට පමණි)</label>
            </div>

            <button
              onClick={handlePublishRide}
              style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer" }}
            >
              🚀 Publish Route Live
            </button>
          </div>

          <div style={{ height: "480px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
            <MapContainer center={startCoords} zoom={9} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController coords={endCoords} />

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
                <Popup>🟢 Start Position (Drag me!)</Popup>
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
                <Popup>🔴 Destination (Drag me!)</Popup>
              </Marker>

              <Polyline positions={[startCoords, endCoords]} color="#38bdf8" weight={4} dashArray="8, 8" />
            </MapContainer>
          </div>
        </div>
      )}

      {/* PASSENGER PANEL */}
      {activeTab === "passenger" && (
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="ඔබට යායුතු ගමනාන්තය සෝයන්න... (e.g. Kandy)"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#fff" }}
            />
            <button
              onClick={() => setFilterLadiesOnly(!filterLadiesOnly)}
              style={{ padding: "12px 16px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", backgroundColor: filterLadiesOnly ? "#ec4899" : "#334155", color: "#fff" }}
            >
              🌸 {filterLadiesOnly ? "Ladies-Only Filtered" : "Filter: Ladies Only"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredRides.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8" }}>දැනට කිසිදු Ride එකක් පළකර නොමැත. (Driver ලෙස ලොග් වී Ride එකක් Publish කරන්න)</p>
            ) : (
              filteredRides.map((ride) => (
                <div key={ride.id} style={{ background: "#1e293b", padding: "18px", borderRadius: "12px", border: "1px solid #334155", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: "0", color: "#38bdf8" }}>{ride.driverName} {ride.isVerified && "✅ (Verified Driver)"}</h3>
                      <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: "0.9rem" }}>🚘 {ride.vehicle} | ⭐ {ride.rating} Rating</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#4ade80" }}>LKR {ride.price}</span>
                      <p style={{ margin: "0", color: "#cbd5e1", fontSize: "0.85rem" }}>{ride.seats} Seats Available</p>
                    </div>
                  </div>

                  <p style={{ margin: "0", color: "#cbd5e1" }}>
                    <b>Route:</b> {ride.startName} ➔ {ride.endName}
                  </p>

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button
                      onClick={() => setTrackingRide(ride)}
                      style={{ flex: 1, padding: "10px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      📡 Track Route & Live Moving Car
                    </button>
                  </div>

                  {trackingRide?.id === ride.id && (
                    <div style={{ marginTop: "16px", background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid #0284c7" }}>
                      <h4 style={{ color: "#38bdf8", marginTop: "0" }}>📡 Live Real-Time Tracking & Safety</h4>

                      <div style={{ height: "300px", borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
                        <MapContainer center={ride.startCoords} zoom={11} style={{ height: "100%", width: "100%" }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={ride.startCoords}><Popup>Start: {ride.startName}</Popup></Marker>
                          <Marker position={ride.endCoords}><Popup>Destination: {ride.endName}</Popup></Marker>
                          {driverLiveLocation && (
                            <Marker position={driverLiveLocation}>
                              <Popup>🚘 Driver ඉන්නේ මෙතනයි! (Live GPS)</Popup>
                            </Marker>
                          )}
                          <Polyline positions={ride.routePolyline} color="#38bdf8" />
                        </MapContainer>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/track?rideId=${ride.id}`;
                            navigator.clipboard.writeText(shareUrl);
                            alert("🔗 Live Trip Link එක Copy විය!");
                          }}
                          style={{ flex: 1, padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          📲 Share Live Trip Link
                        </button>

                        <button
                          onClick={() => {
                            if (confirm("🚨 හදිසි අවස්ථාවක්ද? 119 පොලිස් සේවාව අමතන්නද?")) {
                              window.location.href = "tel:119";
                            }
                          }}
                          style={{ padding: "10px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          🚨 SOS EMERGENCY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
