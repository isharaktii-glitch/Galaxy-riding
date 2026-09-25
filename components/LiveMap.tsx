'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Map Icons
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202092.png',
  iconSize: [35, 35]
});

const passengerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35]
});

export default function LiveMap({ driverCoords, passengerCoords }: any) {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]); // Default Colombo

  useEffect(() => {
    // Get Live Device Location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Driver Location Marker */}
        {driverCoords && (
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={driverIcon}>
            <Popup>🚗 Driver Location</Popup>
          </Marker>
        )}

        {/* Passenger Location Marker */}
        {passengerCoords && (
          <Marker position={[passengerCoords.lat, passengerCoords.lng]} icon={passengerIcon}>
            <Popup>🧍 Passenger Pickup Point</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
