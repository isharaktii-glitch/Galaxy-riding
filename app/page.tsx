"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic Imports for Leaflet (SSR Fix for Next.js)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

type AppMode = "carpool" | "rural_taxi";

interface LocalDriver {
  id: string;
  name: string;
  phone: string;
  village: string;
  vehicleType: "tuk" | "car" | "truck" | "van";
  vehicleName: string;
  vehicleNo: string;
  ratePerKm: number;
  coords: [number, number];
  isOnline: boolean;
}

export default function GalaxyRidesApp() {
  const [currentUser, setCurrentUser] = useState<string | null>("Ishara");
  const [activeTab, setActiveTab] = useState<AppMode>("rural_taxi");
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>("all");

  // Sample Data for Local / Rural Drivers
  const [localDrivers] = useState<LocalDriver[]>([
    {
      id: "D1",
      name: "සුනිල් අයියා",
      phone: "0771234567",
      village: "තඹුත්තේගම",
      vehicleType: "tuk",
      vehicleName: "4-Stroke Three-Wheel",
      vehicleNo: "AB-1234",
      ratePerKm: 120,
      coords: [8.1500, 80.2833],
      isOnline: true,
    },
    {
      id: "D2",
      name: "සමන්ත",
      phone: "0719876543",
      village: "අනුරාධපුරය",
      vehicleType: "car",
      vehicleName: "Nissan Sunny B11",
      vehicleNo: "300-5678",
      ratePerKm: 150,
      coords: [8.3114, 80.4037],
      isOnline: true,
    },
    {
      id: "D3",
      name: "නිමල් (Dimo Batta)",
      phone: "0751122334",
      village: "එප්පාවල",
      vehicleType: "truck",
      vehicleName: "Dimo Batta Light Truck",
      vehicleNo: "DA-9988",
      ratePerKm: 200,
      coords: [8.1400, 80.3200],
      isOnline: true,
    },
  ]);

  const [mapCenter] = useState<[number, number]>([8.3114, 80.4037]);

  // Leaflet Dynamic Icon States
  const [tukIcon, setTukIcon] = useState<any>(null);
  const [carIcon, setCarIcon] = useState<any>(null);
  const [truckIcon, setTruckIcon] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      setTukIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048314.png",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      );
      setCarIcon(
        new L.Icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3202/3202003.png",
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

  const filteredDrivers = localDrivers.filter(
    (d) => selectedVehicleFilter === "all" || d.vehicleType === selectedVehicleFilter
  );

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      {!currentUser ? (
        <div style={{ maxWidth: "400px", margin: "80px auto", background: "#1e293b", padding: "30px", borderRadius: "12px", border: "1px solid #334155", textAlign: "center" }}>
          <h2 style={{ color: "#38bdf8" }}>🌌 Galaxy Rides Live</h2>
          <p style={{ color: "#94a3b8" }}>ගමන් යන්න හෝ Taxi එකක් සොයාගන්න Login වන්න.</p>
          <button
            onClick={() => setCurrentUser("User1")}
            style={{ width: "100%", padding: "12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            ඇතුළු වන්න (Get Started)
          </button>
        </div>
      ) : (
        <div>
          {/* Top Navigation */}
          <div style={{ background: "#1e293b", padding: "15px", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ margin: 0, color: "#38bdf8" }}>🌌 Galaxy Rides & Rural Taxi</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActiveTab("carpool")}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  background: activeTab === "carpool" ? "#0284c7" : "#0f172a",
                  color: "#fff",
                }}
              >
                🚗 Route Sharing (Carpool)
              </button>
              <button
                onClick={() => setActiveTab("rural_taxi")}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  background: activeTab === "rural_taxi" ? "#16a34a" : "#0f172a",
                  color: "#fff",
                }}
              >
                🛺 ග්‍රාමීය Taxi & බඩු ප්‍රවාහනය
              </button>
            </div>
          </div>

          {/* RURAL TAXI SECTION */}
          {activeTab === "rural_taxi" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {/* Left Column: List */}
              <div>
                <div style={{ background: "#1e293b", padding: "15px", borderRadius: "12px", marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#4ade80" }}>🔎 වාහන කාණ්ඩය (Vehicle Category)</h4>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => setSelectedVehicleFilter("all")} style={{ padding: "8px 12px", background: selectedVehicleFilter === "all" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>සියල්ල</button>
                    <button onClick={() => setSelectedVehicleFilter("tuk")} style={{ padding: "8px 12px", background: selectedVehicleFilter === "tuk" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🛺 ත්‍රීවීල්</button>
                    <button onClick={() => setSelectedVehicleFilter("car")} style={{ padding: "8px 12px", background: selectedVehicleFilter === "car" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🚗 Cars (B11/Alto)</button>
                    <button onClick={() => setSelectedVehicleFilter("truck")} style={{ padding: "8px 12px", background: selectedVehicleFilter === "truck" ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🛻 Dimo Batta/ලොරි</button>
                  </div>
                </div>

                <h3>📍 ළඟ ඉන්න ග්‍රාමීය රියදුරන්</h3>
                {filteredDrivers.map((driver) => (
                  <div key={driver.id} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "#38bdf8" }}>{driver.name} ✅</h4>
                      <span style={{ background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem" }}>ONLINE</span>
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "0.9rem", color: "#cbd5e1" }}>
                      🚘 {driver.vehicleName} ({driver.vehicleNo})
                    </p>
                    <p style={{ margin: "0 0 10px 0", color: "#f59e0b", fontSize: "0.85rem", fontWeight: "bold" }}>
                      🏡 ගම: {driver.village} | 💵 1 km ට රු. {driver.ratePerKm}
                    </p>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <a href={`tel:${driver.phone}`} style={{ flex: 1, textAlign: "center", textDecoration: "none", background: "#2563eb", color: "#fff", padding: "8px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem" }}>
                        📞 Direct Call
                      </a>
                      <a href={`https://wa.me/94${driver.phone.slice(1)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", textDecoration: "none", background: "#16a34a", color: "#fff", padding: "8px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem" }}>
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Map */}
              <div style={{ height: "500px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                <MapContainer center={mapCenter} zoom={11} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {filteredDrivers.map((driver) => {
                    const icon = getDriverIcon(driver.vehicleType);
                    return (
                      icon && (
                        <Marker key={driver.id} position={driver.coords} icon={icon}>
                          <Popup>
                            <div style={{ color: "#000" }}>
                              <strong>{driver.name}</strong> <br />
                              {driver.vehicleName} <br />
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

          {/* CARPOOL SECTION */}
          {activeTab === "carpool" && (
            <div style={{ background: "#1e293b", padding: "30px", borderRadius: "12px", textAlign: "center" }}>
              <h3 style={{ color: "#38bdf8" }}>🚗 Route Sharing (Carpooling) System Active</h3>
              <p style={{ color: "#94a3b8" }}>දීර්ඝ ගමන් සඳහා Seats Share කරගැනීමට මෙතැනින් හැකිය.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
