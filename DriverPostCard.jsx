import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

interface DriverPostProps {
  driverName: string;
  isLocationOn: boolean; // Driver ගේ Location ON ද කියන එක (true/false)
  startCoords: [number, number]; // Driver ගමන පටන්ගන්න තැන
  endCoords: [number, number];   // Driver ගමන ඉවර කරන තැන
  liveCoords?: [number, number];  // Driver ඉන්න Live Location එක
}

export function DriverPostCard({
  driverName,
  isLocationOn,
  startCoords,
  endCoords,
  liveCoords
}: DriverPostProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Post එක ඇතුලේ කුඩා Map එකක් නිර්මාණය කිරීම
    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: true
    }).setView(startCoords, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Driver ගේ Location ON නම් Live Location එකේ සිට, නැතහොත් Start Position එකේ සිට Route එක ඇඳීම
    const currentStart = isLocationOn && liveCoords ? liveCoords : startCoords;

    (L as any).Routing.control({
      waypoints: [
        L.latLng(currentStart[0], currentStart[1]),
        L.latLng(endCoords[0], endCoords[1])
      ],
      lineOptions: {
        styles: [{ color: isLocationOn ? '#10B981' : '#6B7280', weight: 5 }] // Live නම් කොළ පාට, නැත්නම් අළු පාට පාරක්
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false
    }).addTo(map);

    // Driver ගේ Location ON නම් Live Marker එකක් තැබීම
    if (isLocationOn && liveCoords) {
      L.circleMarker(liveCoords, {
        radius: 7,
        fillColor: '#10B981',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 1
      }).addTo(map).bindPopup(`${driverName} (දැන් මෙතන ඉන්නවා)`);
    }

    return () => {
      map.remove();
    };
  }, [isLocationOn, liveCoords, startCoords, endCoords, driverName]);

  return (
    <div className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white max-w-md my-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800 text-lg">{driverName}</h3>
        {isLocationOn ? (
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            Location ON (Live Route)
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
            Location OFF
          </span>
        )}
      </div>

      {/* Driver ගේ Route Map Preview එක */}
      <div ref={mapRef} className="h-44 w-full rounded-xl overflow-hidden border"></div>
    </div>
  );
}
