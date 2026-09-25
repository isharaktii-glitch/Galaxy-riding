'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('Colombo to Kandy');
  const [loading, setLoading] = useState(false);
  const [rideOptions, setRideOptions] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [slipText, setSlipText] = useState('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedRide(null);
    setBookingStatus(null);

    try {
      const res = await fetch('/api/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'searchRides', query: searchQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setRideOptions(data.rides);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookWithSlip = async () => {
    if (!selectedRide || !slipText) return alert('Please attach payment slip details or receipt reference!');

    setLoading(true);
    try {
      const res = await fetch('/api/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createBooking',
          rideId: selectedRide.id,
          slipData: slipText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingStatus('PENDING_APPROVAL');
      }
    } catch (e) {
      alert('Booking Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: '#0f172a', fontWeight: 'bold' }}>🚀 Galaxy Rides AI</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>AI-Powered Natural Route Booking & Live GPS</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Where do you want to go?"
          style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '14px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Live Map */}
      <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
        {isClient ? (
          /* @ts-ignore */
          <DynamicMapContainer center={[6.9271, 79.8612]} zoom={10} style={{ height: '100%', width: '100%' }}>
            {/* @ts-ignore */}
            <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* @ts-ignore */}
            <DynamicMarker position={[6.9271, 79.8612]}>
              {/* @ts-ignore */}
              <DynamicPopup>🚗 Driver Location</DynamicPopup>
            </DynamicMarker>
          </DynamicMapContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f1f5f9' }}>🗺️ Loading Map...</div>
        )}
      </div>

      {/* Available Options */}
      {rideOptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rideOptions.map((ride) => (
            <div
              key={ride.id}
              onClick={() => setSelectedRide(ride)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '12px',
                border: selectedRide?.id === ride.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: selectedRide?.id === ride.id ? '#eff6ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{ride.title || ride.type}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Driver: {ride.driverName}</p>
              </div>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>LKR {ride.price}</p>
            </div>
          ))}
        </div>
      )}

      {/* Slip Upload & Booking Approval */}
      {selectedRide && (
        <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          {!bookingStatus ? (
            <>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Upload Payment Slip / Reference:</h3>
              <input
                type="text"
                placeholder="Enter Slip Ref / Bank Transfer Details"
                value={slipText}
                onChange={(e) => setSlipText(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px' }}
              />
              <button
                onClick={handleBookWithSlip}
                disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Submit Slip & Confirm Booking
              </button>
            </>
          ) : (
            <div style={{ padding: '12px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', textAlign: 'center' }}>
              ⏳ <strong>Booking Submitted!</strong> Waiting for Admin Approval. You can check status on Admin Panel or wait for confirmation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
