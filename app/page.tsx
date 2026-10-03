'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Leaflet Dynamic Components
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

interface Landmark {
  name: string;
  coords: [number, number];
}

const landmarkDatabase: Landmark[] = [
  { name: 'Kandy City Centre (KCC)', coords: [7.2936, 80.6350] },
  { name: 'Temple of Tooth, Kandy', coords: [7.2936, 80.6413] },
  { name: 'Colombo Fort Railway Station', coords: [6.9344, 79.8510] },
  { name: 'One Galle Face Mall, Colombo', coords: [6.9272, 79.8454] },
  { name: 'Galle Bus Stand & Fort', coords: [6.0329, 80.2168] },
];

export default function GalaxyRidesPro() {
  const [isMounted, setIsMounted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Registration Form State
  const [regData, setRegData] = useState({
    fullName: '',
    phone: '',
    role: 'DRIVER' as 'DRIVER' | 'PASSENGER',
    vehicleNo: '',
  });

  // Ride & Search States
  const [startInput, setStartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([6.9271, 79.8612]);
  const [suggestions, setSuggestions] = useState<Landmark[]>([]);
  const [activeField, setActiveField] = useState<'START' | 'DEST' | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.fullName && regData.phone) {
      setIsRegistered(true);
    }
  };

  const handleSearch = (text: string, field: 'START' | 'DEST') => {
    if (field === 'START') setStartInput(text);
    else setDestInput(text);
    setActiveField(field);

    if (text.length > 1) {
      const match = landmarkDatabase.filter((l) =>
        l.name.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(match);
    } else {
      setSuggestions([]);
    }
  };

  const selectPlace = (place: Landmark) => {
    if (activeField === 'START') setStartInput(place.name);
    else {
      setDestInput(place.name);
      setSelectedCoords(place.coords);
    }
    setSuggestions([]);
  };

  if (!isMounted) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Leaflet Dynamic Styles Injection */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* Background Interactive Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={selectedCoords} zoom={13} className="w-full h-full">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <Marker position={selectedCoords}>
            <Popup>{destInput || 'Selected Location'}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Modal: Full Registration Form */}
      {!isRegistered && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg shadow-sky-500/20">
                🌌
              </div>
              <h1 className="text-xl font-bold text-white tracking-wide">Galaxy Rides Registration</h1>
              <p className="text-xs text-slate-400">ඔබගේ ගමන ආරම්භ කිරීමට විස්තර ඇතුළත් කරන්න</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">සම්පූර්ණ නම (Full Name)</label>
                <input
                  type="text"
                  required
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                  placeholder="Ishara Sadaruwan"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">දුරකථන අංකය (Phone / WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="+94 77 123 4567"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ඔබගේ කාර්යභාරය (Role)</label>
                <select
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value as 'DRIVER' | 'PASSENGER' })}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="DRIVER">🚕 රියදුරු (Driver)</option>
                  <option value="PASSENGER">👤 මගී (Passenger)</option>
                </select>
              </div>

              {regData.role === 'DRIVER' && (
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">වාහන අංකය (Vehicle No)</label>
                  <input
                    type="text"
                    required
                    value={regData.vehicleNo}
                    onChange={(e) => setRegData({ ...regData, vehicleNo: e.target.value })}
                    placeholder="WP CAD-1234"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-500/25 transition mt-2 text-sm"
              >
                ලියාපදිංචි වන්න (Register Now) 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Glassmorphic Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 max-w-xl mx-auto flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-lg shadow">
            🌌
          </div>
          <div>
            <h1 className="text-xs font-bold text-sky-400">Galaxy Rides Pro</h1>
            <p className="text-[10px] text-slate-300">
              {isRegistered ? `Welcome, ${regData.fullName} (${regData.role})` : 'Guest Mode'}
            </p>
          </div>
        </div>

        {isRegistered && (
          <button
            onClick={() => setIsRegistered(false)}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg font-semibold"
          >
            Edit Profile ⚙️
          </button>
        )}
      </div>

      {/* Bottom Main UI Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-xl mx-auto">
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto opacity-50"></div>

          <h2 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <span>🚕</span> Route Search & Suggestions
          </h2>

          <div className="space-y-2 relative">
            <input
              type="text"
              value={startInput}
              onChange={(e) => handleSearch(e.target.value, 'START')}
              placeholder="Type Start (e.g. Colombo Fort)"
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />

            <div className="flex gap-2">
              <input
                type="text"
                value={destInput}
                onChange={(e) => handleSearch(e.target.value, 'DEST')}
                placeholder="Type Destination (e.g. Kandy)"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => alert(`Target locked: ${destInput}`)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
              >
                Done 🎯
              </button>
            </div>

            {/* Suggestions Overlay Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-500/50 rounded-xl shadow-2xl z-50 overflow-hidden">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPlace(item)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-sky-950/80 border-b border-slate-800/50 text-slate-200 transition"
                  >
                    📍 {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
