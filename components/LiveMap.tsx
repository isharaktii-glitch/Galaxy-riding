'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet default marker fix for Next.js
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202092.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const passengerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

interface LiveMapProps {
  driverCoords?: { lat: number; lng: number } | null;
  passengerCoords?: { lat: number; lng: number } | null;
}

export default function LiveMap({ driverCoords, passengerCoords }: LiveMapProps) {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]); // Default: Colombo
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.log('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  if (!isClient) {
    return <div style={{ height: '350px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>Loading Map...</div>;
  }

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {/* @ts-ignore */}
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        {/* @ts-ignore */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Driver Location Marker */}
        {driverCoords && (
          /* @ts-ignore */
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={driverIcon}>
            <Popup>🚗 Driver Location</Popup>
          </Marker>
        )}

        {/* Passenger Location Marker */}
        {passengerCoords && (
          /* @ts-ignore */
          <Marker position={[passengerCoords.lat, passengerCoords.lng]} icon={passengerIcon}>
            <Popup>🧍 Passenger Pickup Point</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
