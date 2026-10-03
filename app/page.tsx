'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic SSR Safety Leaflet Imports
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

interface Landmark {
  name: string;
  coords: [number, number];
}

const landmarkDatabase: Landmark[] = [
  { name: 'Kandy City Centre (KCC)', coords: [7.2936, 80.635] },
  { name: 'Kandy Sri Dalada Maligawa (Temple of Tooth)', coords: [7.2936, 80.6413] },
  { name: 'Hanthana Mountain Range, Kandy', coords: [7.2581, 80.6272] },
  { name: 'Peradeniya Botanical Garden, Kandy', coords: [7.2683, 80.5966] },
  { name: 'Colombo Fort Railway Station', coords: [6.9344, 79.851] },
  { name: 'One Galle Face Mall, Colombo', coords: [6.9272, 79.8454] },
  { name: 'Galle Bus Stand & Dutch Fort', coords: [6.0329, 80.2168] },
  { name: 'Jaffna Railway Station', coords: [9.6647, 80.0255] },
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

  // KYC State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);

  // Search & Map Focus States
  const [startInput, setStartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([6.9271, 79.8612]);
  const [suggestions, setSuggestions] = useState<Landmark[]>([]);
  const [activeField, setActiveField] = useState<'START' | 'DEST' | null>(null);

  // Published Rides
  const [publishedRides, setPublishedRides] = useState([
    {
      id: 'ride1',
      driverName: 'Ishara Sadaruwan',
      isVerified: true,
      whatsapp: '+94771234567',
      phone: '+94771234567',
      start: 'Colombo Fort Railway Station',
      dest: 'Kandy Sri Dalada Maligawa',
      price: 1500,
      status: 'SCHEDULED',
    },
  ]);

  // Live Location States
  const [driverLiveLocation, setDriverLiveLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Leaflet default icons fix
    import('leaflet').then((L) => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.fullName && regData.phone) {
      setIsRegistered(true);
      alert('🎉 Galaxy Rides වලට සාර්ථකව සම්බන්ධ වුණා!');
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

  const handleDoneLocation = () => {
    alert(`📍 Target locked: ${destInput}`);
  };

  const handleStartRide = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setDriverLiveLocation(coords);
          setSelectedCoords(coords);
          alert('🚀 Live GPS Tracking Active!');
        },
        () => alert('කරුණාකර GPS Location Access ලබා දෙන්න.')
      );
    }
  };

  if (!isMounted) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      
      {/* Dynamic Leaflet CSS Injection */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* 1. Full Screen Interactive Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={selectedCoords} zoom={12} zoomControl={false} className="w-full h-full">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          <Marker position={selectedCoords}>
            <Popup>📍 Target: {destInput || 'Selected Location'}</Popup>
          </Marker>
          {driverLiveLocation && (
            <Marker position={driverLiveLocation}>
              <Popup>🚕 Live Driver Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* 2. Registration Overlay (Glassmorphism Modal) */}
      {!isRegistered && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-sky-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-lg shadow-sky-500/30">
                🌌
              </div>
              <h1 className="text-xl font-bold text-white tracking-wide">Galaxy Rides Pro</h1>
              <p className="text-xs text-slate-400">ඔබගේ Account එක නිර්මාණය කර එකතු වන්න</p>
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
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">දුරකථන / WhatsApp අංකය</label>
                <input
                  type="tel"
                  required
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="+94 77 123 4567"
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ඔබගේ භූමිකාව (Role)</label>
                <select
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value as 'DRIVER' | 'PASSENGER' })}
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-600/30 transition text-sm mt-2"
              >
                Register & Continue 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Top Floating Glassmorphic Header */}
      <div className="absolute top-4 left-4 right-4 z-10 max-w-xl mx-auto flex justify-between items-center bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-lg shadow font-bold">
            🌌
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-sky-400">Galaxy Rides Pro</h1>
              {isKycVerified && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-1 py-0.2 rounded font-bold">
                  Verified ✅
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300">
              {regData.fullName ? `${regData.fullName} (${regData.role})` : 'System Ready'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isKycVerified && regData.role === 'DRIVER' && (
            <button
              onClick={() => setIsKycModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-sky-400/50 shadow"
            >
              Verify KYC 🛡️
            </button>
          )}
          <button
            onClick={() => setRegData({ ...regData, role: regData.role === 'DRIVER' ? 'PASSENGER' : 'DRIVER' })}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow"
          >
            Switch to {regData.role === 'DRIVER' ? 'Passenger' : 'Driver'}
          </button>
        </div>
      </div>

      {/* 4. Bottom Main Action Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-xl mx-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-3xl p-4 shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto opacity-50"></div>

          {regData.role === 'DRIVER' ? (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-sky-400 flex items-center gap-1">
                <span>🚕</span> Post Driver Route & Suggestions
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
                    onClick={handleDoneLocation}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow shrink-0"
                  >
                    Done 🎯
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-500/50 rounded-xl shadow-2xl z-50 max-h-36 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectPlace(item)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-sky-950/80 border-b border-slate-800/50 text-slate-200"
                      >
                        📍 {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {publishedRides.map((ride) => (
                <div key={ride.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sky-300">🚕 {ride.driverName} {isKycVerified && '✅'}</p>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                      {ride.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">📍 {ride.start} ➔ {ride.dest}</p>
                  <button
                    onClick={handleStartRide}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Start Ride (GPS On) 🚀
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-amber-400">🔍 Available Rides Near You</h2>
              {publishedRides.map((ride) => (
                <div key={ride.id} className="bg-slate-950 p-3 rounded-2xl border border-sky-500/30 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sky-300">🚕 {ride.driverName} {ride.isVerified && '✅'}</p>
                      <p className="text-[10px] text-slate-400">📞 {ride.phone}</p>
                    </div>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      Rs. {ride.price}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">📍 {ride.start} ➔ {ride.dest}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => alert('📍 Pickup Request Sent!')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs"
                    >
                      Come Here 📍
                    </button>
                    <a
                      href={`https://wa.me/${ride.whatsapp.replace('+', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-600 hover:bg-green-500 text-white font-bold py-1.5 rounded-xl text-xs text-center block"
                    >
                      WhatsApp 💬
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Driver KYC Modal */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full space-y-3">
            <h2 className="text-sm font-bold text-sky-400">🛡️ Driver KYC Identity Verification</h2>
            <p className="text-xs text-slate-300">
              Verified Driver Badge (✅) එක සඳහා ඔබේ NIC / Driving License තොරතුරු ලබා දෙන්න.
            </p>
            <div className="space-y-2 text-xs">
              <input type="file" className="w-full text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setIsKycVerified(true);
                  setIsKycModalOpen(false);
                  alert('✅ Verified Driver status active!');
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl mt-2"
              >
                Submit Verification ✅
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
