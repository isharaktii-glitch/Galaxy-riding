'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Leaflet Dynamic Import to prevent SSR crashes
const DynamicMapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const DynamicTileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const DynamicMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const DynamicPopup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

import 'leaflet/dist/leaflet.css';

interface RideOption {
  type: string;
  price: string;
  time: string;
  driverName: string;
  rating: string;
  icon: string;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('Colombo to Kandy tomorrow morning');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rideOptions, setRideOptions] = useState<RideOption[]>([]);
  const [selectedRide, setSelectedRide] = useState<RideOption | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(false);
    setSelectedRide(null);

    setTimeout(() => {
      setRideOptions([
        { type: 'Galaxy Economy', price: 'LKR 4,500', time: '2 hrs 45 mins', driverName: 'Saman Perera', rating: '★ 4.9', icon: '🚗' },
        { type: 'Galaxy Comfort', price: 'LKR 6,200', time: '2 hrs 30 mins', driverName: 'Kamal Silva', rating: '★ 4.8', icon: '🚘' },
        { type: 'Galaxy Premium VIP', price: 'LKR 9,500', time: '2 hrs 15 mins', driverName: 'Nimal Fernando', rating: '★ 5.0', icon: '🚖' },
      ]);
      setLoading(false);
      setHasSearched(true);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: '#0f172a', fontWeight: 'bold' }}>
          🚀 Galaxy Rides AI
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
          ඔබට යන්න ඕන තැන Type කරන්න (e.g., "Colombo to Kandy tomorrow morning")
        </p>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Where do you want to go?"
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            fontSize: '15px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px 28px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '15px',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Embedded Live Map */}
      <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
        {isClient ? (
          /* @ts-ignore */
          <DynamicMapContainer center={[6.9271, 79.8612]} zoom={11} style={{ height: '100%', width: '100%' }}>
            {/* @ts-ignore */}
            <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* @ts-ignore */}
            <DynamicMarker position={[6.9271, 79.8612]}>
              {/* @ts-ignore */}
              <DynamicPopup>🚗 Colombo Pickup</DynamicPopup>
            </DynamicMarker>
          </DynamicMapContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f1f5f9' }}>
            🗺️ Loading Map...
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px' }}>
            Available Rides Found:
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rideOptions.map((ride, index) => (
              <div
                key={index}
                onClick={() => setSelectedRide(ride)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: '12px',
                  border: selectedRide?.type === ride.type ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: selectedRide?.type === ride.type ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '28px' }}>{ride.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{ride.type}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                      Driver: {ride.driverName} • {ride.rating}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{ride.price}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{ride.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Book Now Card */}
          {selectedRide && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: '#334155', marginBottom: '12px' }}>
                Selected: <strong>{selectedRide.type}</strong> ({selectedRide.price})
              </p>
              <button
                onClick={() => alert(`Booking confirmed for ${selectedRide.type}! Driver ${selectedRide.driverName} is assigned.`)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Confirm & Book Ride Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
