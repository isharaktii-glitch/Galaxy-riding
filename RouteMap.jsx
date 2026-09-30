import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Start (කොළ පාට) සහ End (රතු පාට) Marker Icons සකස් කිරීම
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function RouteMap() {
  // Start Location එක (Default: කොළඹ)
  const [startPos, setStartPos] = useState<[number, number]>([6.9271, 79.8612]);
  // Ending Location එක
  const [endPos, setEndPos] = useState<[number, number] | null>(null);
  // Text Input එකේ තියෙන අගය
  const [endInput, setEndInput] = useState('');
  
  const [map, setMap] = useState<L.Map | null>(null);
  const [routingControl, setRoutingControl] = useState<any>(null);

  // Ending location එක Input එකෙන් type කරලා Set කරද්දී
  const handleSetEndingLocation = async () => {
    if (!endInput) return;

    // OpenStreetMap Geocoding API හරහා නම coordinate (Lat, Lng) වලට හරවා ගැනීම
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endInput)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const newEnd: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setEndPos(newEnd);
      } else {
        alert('ස්ථානය සොයාගැනීමට නොහැකි විය. කරුණාකර වෙනත් නමක් ලබාදෙන්න.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Locations දෙකම ඇති විට Google Maps ආකාරයට පාර (Route Line) ඇඳීම
  useEffect(() => {
    if (!map || !startPos || !endPos) return;

    // කලින් තිබූ Route එක Clear කිරීම
    if (routingControl) {
      map.removeControl(routingControl);
    }

    // අලුත් Route එක ඇඳීම
    const newRoutingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(startPos[0], startPos[1]),
        L.latLng(endPos[0], endPos[1])
      ],
      lineOptions: {
        styles: [{ color: '#2563EB', weight: 6, opacity: 0.8 }] // Google Map Blue Style
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false // Text Instructions Hide කිරීම
    }).addTo(map);

    setRoutingControl(newRoutingControl);
  }, [map, startPos, endPos]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Ending Location එක ඇතුලත් කරන ස්ථානය */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ending Location එක මෙතන ටයිප් කරන්න (උදා: Kandy, Galle)..."
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          className="p-3 border rounded-lg flex-1 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSetEndingLocation}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Route එක හදන්න
        </button>
      </div>

      {/* Map View එක */}
      <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-md border">
        <MapContainer
          center={startPos}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={setMap}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Start Location Marker (Drag කළ හැක) */}
          <Marker
            position={startPos}
            icon={startIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                setStartPos([pos.lat, pos.lng]); // Drag කළ පසු අලුත් පිහිටීම සටහන් වේ
              }
            }}
          >
            <Popup>Start Location (මෙතනින් ඇදලා වෙනස් කරන්න පුළුවන්)</Popup>
          </Marker>

          {/* Ending Location Marker (Drag කළ හැක) */}
          {endPos && (
            <Marker
              position={endPos}
              icon={endIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  setEndPos([pos.lat, pos.lng]); // Drag කළ පසු අලුත් පිහිටීම සටහන් වේ
                }
              }}
            >
              <Popup>Ending Location (මෙතනින් ඇදලා වෙනස් කරන්න පුළුවන්)</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
