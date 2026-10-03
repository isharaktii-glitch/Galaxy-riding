'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Leaflet components SSR-safe ලෙස dynamically import කිරීම
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

// Map එක Resize වූ විට Tiles කැඩීම වැළැක්වීමේ Component එක
function MapResizeHandler({ isFullscreen }: { isFullscreen: boolean }) {
  // Client-side හිදී පමණක් react-leaflet hook එක load කිරීම
  const { useMap } = require('react-leaflet');
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [map, isFullscreen]);

  return null;
}

export default function LiveRouteMap() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    startLocation: 'Colombo Fort',
    destination: 'Kandy Clock Tower',
    seats: 3,
    price: 1500,
  });

  useEffect(() => {
    setIsMounted(true);

    // TypeScript Build Errors වැළැක්වීමට L.Icon.Default safe ලෙස import කර Fix කිරීම
    import('leaflet').then((L) => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });

    // Mobile Back Button එක එබූ විට Fullscreen Exit වන Handler එක
    const handlePopState = () => {
      setIsFullscreen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      window.history.pushState({ mapFullscreen: true }, '');
      setIsFullscreen(true);
    } else {
      window.history.back();
    }
  };

  if (!isMounted) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-3 md:p-6 text-white font-sans">
      
      {/* Top Header Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow">
          🚗 Route Sharing (Carpool Live Map)
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          🛺 ග්‍රාමීය Taxi & බඩු ප්‍රවාහනය
        </button>
      </div>

      {/* Main Flex Layout: Mobile -> flex-col | Desktop -> flex-row */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl">
        
        {/* Left Form Panel */}
        <div className="w-full md:w-5/12 bg-slate-800/60 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
          <div>
            <h2 className="text-sky-400 font-bold text-lg mb-4 leading-tight">
              🚗 Post Live Route <br className="hidden md:block" /> (OSRM Distance)
            </h2>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Start Location
                </label>
                <input
                  type="text"
                  value={formData.startLocation}
                  onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                  className="w-full bg-slate-950 border border-sky-500/50 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full bg-slate-950 border border-sky-500/50 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Seats Available:
                  </label>
                  <input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Price per Seat (Rs.):
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-md transition duration-200 mt-2"
              >
                Publish Route Live
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              📋 My Posted Long Distance Rides
            </h3>
          </div>
        </div>

        {/* Right Map Container */}
        <div
          className={
            isFullscreen
              ? 'fixed inset-0 z-[9999] bg-slate-950 p-2 flex flex-col'
              : 'w-full md:w-7/12 h-[380px] md:h-[480px] rounded-lg overflow-hidden relative border border-slate-700 shadow-inner'
          }
        >
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-[1000] bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium shadow-md transition"
          >
            {isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>

          <MapContainer
            center={[6.9271, 79.8612]}
            zoom={7}
            scrollWheelZoom={true}
            className="w-full h-full rounded-lg"
          >
            {/* Google Maps වලට සමාන Clean Map Tile Layer (CartoDB Voyager) */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            <MapResizeHandler isFullscreen={isFullscreen} />

            <Marker position={[6.9271, 79.8612]}>
              <Popup>Colombo Fort (Start Point)</Popup>
            </Marker>
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
