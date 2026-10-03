'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic Leaflet Imports
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Map Center Reset Handler
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (map) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Sri Lanka Famous Landmark Places Suggestion Database
const landmarkDatabase = [
  { name: 'Kandy City Centre (KCC)', coords: [7.2936, 80.6350] },
  { name: 'Kandy Sri Dalada Maligawa (Temple of Tooth)', coords: [7.2936, 80.6413] },
  { name: 'Hanthana Mountain Range, Kandy', coords: [7.2581, 80.6272] },
  { name: 'Peradeniya Botanical Garden, Kandy', coords: [7.2683, 80.5966] },
  { name: 'Colombo Fort Railway Station', coords: [6.9344, 79.8510] },
  { name: 'One Galle Face Mall, Colombo', coords: [6.9272, 79.8454] },
  { name: 'Galle Bus Stand & Dutch Fort', coords: [6.0329, 80.2168] },
  { name: 'Jaffna Railway Station', coords: [9.6647, 80.0255] },
];

export default function GalaxyRidesPro() {
  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<'PASSENGER' | 'DRIVER'>('DRIVER');

  // KYC Verification States
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [kycForm, setKycForm] = useState({ idCard: null, faceScanDone: false, jobProof: null });

  // Map Focus State
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.9271, 79.8612]);
  const [mapZoom, setMapZoom] = useState(10);

  // Driver Form & Search States
  const [startInput, setStartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [suggestions, setSuggestions] = useState<typeof landmarkDatabase>([]);
  const [activeSearchField, setActiveSearchField] = useState<'START' | 'DEST' | null>(null);

  // Driver Contact / Registration Data
  const [driverProfile] = useState({
    name: 'Ishara Sadaruwan',
    phone: '+94771234567',
    whatsapp: '+94771234567',
  });

  // Published Live Rides (State)
  const [publishedRides, setPublishedRides] = useState([
    {
      id: 'ride1',
      driverName: 'Ishara Sadaruwan',
      isVerified: true,
      whatsapp: '+94771234567',
      phone: '+94771234567',
      start: 'Colombo Fort Railway Station',
      dest: 'Kandy Sri Dalada Maligawa (Temple of Tooth)',
      destCoords: [7.2936, 80.6413] as [number, number],
      price: 1500,
      seats: 3,
      status: 'SCHEDULED', // SCHEDULED, STARTED, FINISHED
    },
  ]);

  // Live Tracking States
  const [driverLiveLocation, setDriverLiveLocation] = useState<[number, number] | null>(null);
  const [passengerPickupRequest, setPassengerPickupRequest] = useState<[number, number] | null>(null);

  // Rating & Review State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<{ passenger: string; stars: number; comment: string }[]>([]);

  useEffect(() => {
    setIsMounted(true);
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

  // Handle Search Input Change & Auto Suggestions
  const handleInputChange = (text: string, field: 'START' | 'DEST') => {
    if (field === 'START') setStartInput(text);
    else setDestInput(text);
    setActiveSearchField(field);

    if (text.length > 1) {
      const filtered = landmarkDatabase.filter((place) =>
        place.name.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Select Suggestion Option
  const selectSuggestion = (place: { name: string; coords: [number, number] }) => {
    if (activeSearchField === 'START') {
      setStartInput(place.name);
    } else {
      setDestInput(place.name);
      setSelectedCoords(place.coords);
    }
    setSuggestions([]);
  };

  // Click "Done" Button - Zoom to Map Location
  const handleDoneLocation = () => {
    if (selectedCoords) {
      setMapCenter(selectedCoords);
      setMapZoom(15); // High Resolution Google Maps Zoom Level
      alert('📍 Map target location locked & zoomed in successfully!');
    } else {
      alert('කරුණාකර List එකෙන් අදාල ස්ථානය තෝරාගන්න.');
    }
  };

  // Driver KYC Submit
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsKycVerified(true);
    setIsKycModalOpen(false);
    alert('🎉 KYC Verification Completed! Verified Badge (✅) Granted.');
  };

  // Driver Live Ride Start
  const handleStartRide = (rideId: string) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setDriverLiveLocation(coords);
          setMapCenter(coords);
          setMapZoom(16);
          setPublishedRides((prev) =>
            prev.map((r) => (r.id === rideId ? { ...r, status: 'STARTED' } : r))
          );
          alert('🚀 Ride Started! Live GPS location active on Passenger Map.');
        },
        () => alert('කරුණාකර ඔබගේ GPS/Location On කරන්න.')
      );
    }
  };

  // Passenger "Come Here" Trigger
  const handleComeHere = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPassengerPickupRequest(coords);
          setMapCenter(coords);
          alert('📩 "Come to My Location" Request sent to Driver with Live Location!');
        },
        () => alert('කරුණාකර ඔබගේ Location On කරන්න.')
      );
    }
  };

  // Submit Passenger Rating
  const handleAddReview = () => {
    if (comment.trim()) {
      setReviews([...reviews, { passenger: 'Passenger', stars: rating, comment }]);
      setComment('');
      alert('⭐ Rating & Review Submitted Successfully!');
    }
  };

  if (!isMounted) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-white">
      
      {/* 1. Full Interactive Google-Maps Style Background Layer */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false} className="w-full h-full">
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Selected Destination Target Marker */}
          {selectedCoords && (
            <Marker position={selectedCoords}>
              <Popup>🏁 Target Destination: {destInput}</Popup>
            </Marker>
          )}

          {/* Live Driver GPS Position */}
          {driverLiveLocation && (
            <Marker position={driverLiveLocation}>
              <Popup>🚕 Driver Live Location (In Motion)</Popup>
            </Marker>
          )}

          {/* Passenger "Come Here" Location */}
          {passengerPickupRequest && (
            <Marker position={passengerPickupRequest}>
              <Popup>👤 Passenger Pickup Location ("Come Here")</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* 2. Top Header Bar & Mode / KYC Status */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap justify-between items-center gap-2 max-w-xl mx-auto">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60 shadow-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-sm shadow">
            🌌
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-sky-400">Galaxy Rides Pro</h1>
              {isKycVerified && (
                <span className="bg-green-500/20 text-green-400 border border-green-500/50 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                  Verified ✅
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-300">Live Navigation & Proximity System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'DRIVER' && !isKycVerified && (
            <button
              onClick={() => setIsKycModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow border border-sky-400 animate-pulse"
            >
              Verify KYC 🛡️
            </button>
          )}

          <button
            onClick={() => setUserRole(userRole === 'DRIVER' ? 'PASSENGER' : 'DRIVER')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl shadow-xl backdrop-blur-md border border-amber-300 transition"
          >
            {userRole === 'DRIVER' ? '👤 Passenger View' : '🚕 Driver View'}
          </button>
        </div>
      </div>

      {/* 3. Bottom Action Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 max-w-xl mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl max-h-[82vh] overflow-y-auto space-y-4">
          
          <div className="w-10 h-0.5 bg-slate-600 rounded-full mx-auto opacity-60"></div>

          {userRole === 'DRIVER' ? (
            /* DRIVER POST ROUTE PANEL */
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-sky-400">🚕 Post Driver Route with Auto-Suggestions</h2>

              {/* Start & Destination Fields with Auto-Suggestions */}
              <div className="space-y-2 relative">
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Start Location</label>
                  <input
                    type="text"
                    value={startInput}
                    onChange={(e) => handleInputChange(e.target.value, 'START')}
                    placeholder="Type Start (e.g. Colombo Fort)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">End Location Target</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={destInput}
                      onChange={(e) => handleInputChange(e.target.value, 'DEST')}
                      placeholder="Type Destination (e.g. Kandy, Dalada Maligawa)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500"
                    />
                    <button
                      onClick={handleDoneLocation}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow"
                    >
                      Done 🎯
                    </button>
                  </div>
                </div>

                {/* Auto Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-500/50 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                    {suggestions.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(place)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-sky-950/80 border-b border-slate-800/50 text-slate-200"
                      >
                        📍 {place.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Driver Actions & Active Live Ride Controller */}
              {publishedRides.map((ride) => (
                <div key={ride.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sky-300">
                      🚕 {ride.driverName} {isKycVerified && '✅'}
                    </p>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                      Status: {ride.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px]">📍 {ride.start} ➔ {ride.dest}</p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleStartRide(ride.id)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs"
                    >
                      Start Ride (GPS On) 🚀
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* PASSENGER NEARBY RIDE FILTER & LIVE ACTION PANEL */
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-amber-400">🔍 Nearby Drivers Within 10km - 15km Radius</h2>

              {/* Live Driver Feed */}
              <div className="space-y-2">
                {publishedRides.map((ride) => (
                  <div key={ride.id} className="bg-slate-950 p-3 rounded-2xl border border-sky-500/30 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sky-300 text-sm flex items-center gap-1">
                          🚕 {ride.driverName} {ride.isVerified && '✅'}
                        </p>
                        <p className="text-[10px] text-slate-400">📞 {ride.phone} | WhatsApp: {ride.whatsapp}</p>
                      </div>
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        Rs. {ride.price}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px]">📍 {ride.start} ➔ {ride.dest}</p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleComeHere}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs"
                      >
                        Come Here 📍 (Send Pickup Location)
                      </button>

                      <a
                        href={`https://wa.me/${ride.whatsapp.replace('+', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl text-xs text-center block"
                      >
                        WhatsApp Chat 💬
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating & Review Section */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-slate-300">⭐ Rate & Review Driver</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg text-xs p-1 text-white"
                  >
                    <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                    <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                    <option value={3}>3 Stars ⭐⭐⭐</option>
                  </select>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <button
                    onClick={handleAddReview}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1 rounded-lg text-xs"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. Driver KYC Verification Modal */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full space-y-4">
            <h2 className="text-base font-bold text-sky-400">🛡️ Driver KYC Identity Verification</h2>
            <p className="text-xs text-slate-300">
              Verified Driver Badge (✅) එක ලබාගැනීමට පහත විස්තර සම්පූර්ණ කරන්න:
            </p>

            <form onSubmit={handleKycSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">1. National ID (NIC) / Driving License Photo</label>
                <input type="file" required className="w-full text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">2. Live Face Scan Verification</label>
                <button
                  type="button"
                  onClick={() => {
                    setKycForm({ ...kycForm, faceScanDone: true });
                    alert('📸 Live Face Scan Captured Successfully!');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-sky-300 py-2 rounded-xl border border-sky-500/40"
                >
                  {kycForm.faceScanDone ? '✅ Face Scan Completed' : '📷 Take Live Face Scan'}
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">3. Job / Profession Document (Optional)</label>
                <input type="file" className="w-full text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800" />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKycModalOpen(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl"
                >
                  Submit & Verify ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
