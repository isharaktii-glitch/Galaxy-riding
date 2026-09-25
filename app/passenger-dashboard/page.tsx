'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

import 'leaflet/dist/leaflet.css';

export default function PassengerDashboard() {
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [passengerLoc, setPassengerLoc] = useState<{ lat: number; lng: number }>({ lat: 6.9271, lng: 79.8612 });

  // Get Passenger Live Location from Browser
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPassengerLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  // Poll Real-time Driver Location continuously (Like PickMe)
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getDriverLocation', driverId: 'YOUR_ASSIGNED_DRIVER_ID' }),
      });
      const data = await res.json();
      if (data.success && data.driver?.currentLat) {
        setDriverLoc({ lat: data.driver.currentLat, lng: data.driver.currentLng });
      }
    }, 3000); // Polls every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h2>📍 Live PickMe Ride Tracker</h2>
      
      <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ccc' }}>
        {/* @ts-ignore */}
        <MapContainer center={[passengerLoc.lat, passengerLoc.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          {/* @ts-ignore */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Passenger Marker */}
          {/* @ts-ignore */}
          <Marker position={[passengerLoc.lat, passengerLoc.lng]}>
            {/* @ts-ignore */}
            <Popup>🧍 Passenger Pickup Location</Popup>
          </Marker>

          {/* Driver Moving Vehicle Marker */}
          {driverLoc && (
            /* @ts-ignore */
            <Marker position={[driverLoc.lat, driverLoc.lng]}>
              {/* @ts-ignore */}
              <Popup>🚗 Live Vehicle Position</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
