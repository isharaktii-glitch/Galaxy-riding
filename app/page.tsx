'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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

// Calculate distance in KM using Haversine Formula
function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface DriverPost {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  price: string;
  startLocationName: string;
  endLocationName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  currentLat: number;
  currentLng: number;
  createdAt: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  
  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');

  // Driver Creation State
  const [startLoc, setStartLoc] = useState('Colombo');
  const [destQuery, setDestQuery] = useState('');
  const [vehicle, setVehicle] = useState('Car / Sedan');
  const [price, setPrice] = useState('3500');
  const [postLat, setPostLat] = useState<number>(7.2906); // Default Kandy
  const [postLng, setPostLng] = useState<number>(80.6337);
  const [driverCurrentLat, setDriverCurrentLat] = useState<number>(6.9271); // Default Colombo

  // All Driver Posts
  const [driverPosts, setDriverPosts] = useState<DriverPost[]>([]);

  // Passenger Matching State
  const [passengerDestQuery, setPassengerDestQuery] = useState('');
  const [passengerDestLat, setPassengerDestLat] = useState<number | null>(null);
  const [passengerDestLng, setPassengerDestLng] = useState<number | null>(null);
  const [passengerLiveGPS, setPassengerLiveGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [activeBookedRide, setActiveBookedRide] = useState<DriverPost | null>(null);

  // Load Saved Storage
  useEffect(() => {
    const savedUser = localStorage.getItem('galaxy_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedPosts = localStorage.getItem('galaxy_driver_posts');
    if (savedPosts) {
      setDriverPosts(JSON.parse(savedPosts));
    } else {
      const initialPosts: DriverPost[] = [
        {
          id: 'POST-101',
          driverName: 'Kasun Fernando',
          driverPhone: '0778899000',
          vehicleType: 'Toyota Axio VIP',
          price: '4000',
          startLocationName: 'Colombo Fort',
          endLocationName: 'Kandy City Center',
          startLat: 6.9344,
          startLng: 79.8428,
          endLat: 7.2906,
          endLng: 80.6337,
          currentLat: 6.9271, // Colombo
          currentLng: 79.8612,
          createdAt: new Date().toISOString()
        },
        {
          id: 'POST-102',
          driverName: 'Nimal Siripala',
          driverPhone: '0712233445',
          vehicleType: 'Isuzu Elf Lorry (Cargo)',
          price: '8500',
          startLocationName: 'Kurunegala',
          endLocationName: 'Peradeniya Kandy',
          startLat: 7.4863,
          startLng: 80.3623,
          endLat: 7.2596,
          endLng: 80.5974,
          currentLat: 7.4863,
          currentLng: 80.3623,
          createdAt: new Date().toISOString()
        }
      ];
      setDriverPosts(initialPosts);
      localStorage.setItem('galaxy_driver_posts', JSON.stringify(initialPosts));
    }
  }, []);

  // Real-time Passenger GPS Tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPassengerLiveGPS({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.log('Location access pending'),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Driver Search Location Debounce Auto-Map Jump
  useEffect(() => {
    if (!destQuery || destQuery.length < 3) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setPostLat(parseFloat(data[0].lat));
          setPostLng(parseFloat(data[0].lon));
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [destQuery]);

  // Passenger Location Lookup
  const handlePassengerSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerDestQuery) return alert('කරුණාකර ගමනාන්තයක් ඇතුළත් කරන්න.');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(passengerDestQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPassengerDestLat(parseFloat(data[0].lat));
        setPassengerDestLng(parseFloat(data[0].lon));
      } else {
        alert('එම ස්ථානය සොයාගැනීමට නොහැකි විය.');
      }
    } catch (e) {
      alert('Search Error');
    }
  };

  // Draggable Marker Event Handler for Driver
  const eventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setPostLat(latLng.lat);
          setPostLng(latLng.lng);
        }
      },
    }),
    [],
  );

  // Authenticate
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { id: 'USR-' + Date.now(), firstName: firstName || 'User', email, role, phone: phone || '0771234567' };
    localStorage.setItem('galaxy_user', JSON.stringify(userData));
    setUser(userData);
  };

  // Driver Post Submission
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destQuery) return alert('ගමනාන්තය ඇතුළත් කරන්න!');

    const newPost: DriverPost = {
      id: 'POST-' + Date.now(),
      driverName: `${user.firstName}`,
      driverPhone: user.phone,
      vehicleType: vehicle,
      price: price,
      startLocationName: startLoc,
      endLocationName: destQuery,
      startLat: driverCurrentLat,
      startLng: 79.8612,
      endLat: postLat,
      endLng: postLng,
      currentLat: driverCurrentLat,
      currentLng: 79.8612,
      createdAt: new Date().toLocaleString()
    };

    const updated = [newPost, ...driverPosts];
    setDriverPosts(updated);
    localStorage.setItem('galaxy_driver_posts', JSON.stringify(updated));
    alert('🚀 Driver Trip Post එක සාර්ථකව පලකරන ලදී!');
    setDestQuery('');
  };

  // Filter Matching Drivers for Passenger
  const matchedDriverPosts = useMemo(() => {
    if (!passengerDestQuery) return driverPosts;

    const query = passengerDestQuery.toLowerCase().trim();

    return driverPosts.filter((post) => {
      // 1. Text Based Exact / Partial City Match
      const nameMatch = post.endLocationName.toLowerCase().includes(query) || query.includes(post.endLocationName.toLowerCase());

      // 2. Spatial Distance Match (Within 15 KM Radius)
      let radiusMatch = false;
      if (passengerDestLat && passengerDestLng) {
        const dist = calculateDistanceKM(passengerDestLat, passengerDestLng, post.endLat, post.endLng);
        if (dist <= 15) radiusMatch = true; // 15KM Nearby City Match
      }

      // 3. Expire Rule: If Driver Passed Passenger Location by > 2KM
      let isExpired = false;
      if (passengerLiveGPS) {
        const distFromDriverToPassenger = calculateDistanceKM(post.currentLat, post.currentLng, passengerLiveGPS.lat, passengerLiveGPS.lng);
        const distFromStartToPassenger = calculateDistanceKM(post.startLat, post.startLng, passengerLiveGPS.lat, passengerLiveGPS.lng);
        
        // If driver is further along the route past passenger by 2km
        if (distFromDriverToPassenger > distFromStartToPassenger && distFromDriverToPassenger > 2) {
          isExpired = true;
        }
      }

      return (nameMatch || radiusMatch) && !isExpired;
    });
  }, [passengerDestQuery, passengerDestLat, passengerDestLng, driverPosts, passengerLiveGPS]);

  // Logout
  const logout = () => {
    localStorage.removeItem('galaxy_user');
    setUser(null);
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle, #0f172a, #020617)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#38bdf8', margin: '0 0 10px 0' }}>🚀 Galaxy Rides 3D</h2>
          <p style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>AI-Powered Smart Ride & Cargo Matching</p>

          <div style={{ display: 'flex', gap: '8px', margin: '20px 0' }}>
            <button type="button" onClick={() => setRole('PASSENGER')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: role === 'PASSENGER' ? '#0284c7' : '#1e293b', color: '#fff', fontWeight: 'bold' }}>🧍 Passenger</button>
            <button type="button" onClick={() => setRole('DRIVER')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: role === 'DRIVER' ? '#0284c7' : '#1e293b', color: '#fff', fontWeight: 'bold' }}>🚗 Driver</button>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            <button type="submit" style={{ padding: '14px', borderRadius: '10px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              Continue as {role}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ padding: '14px 20px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>🚀 Galaxy Rides</span>
        <div>
          <span style={{ fontSize: '13px', marginRight: '10px' }}>👤 {user.firstName} ({user.role})</span>
          <button onClick={logout} style={{ padding: '5px 10px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 16px' }}>

        {/* DRIVER PANEL */}
        {user.role === 'DRIVER' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
            <h3 style={{ color: '#38bdf8', marginTop: 0 }}>📢 Driver: Create Route Post</h3>
            
            <form onSubmit={handlePublishPost} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Start City (e.g. Colombo)" value={startLoc} onChange={(e) => setStartLoc(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Destination City (Type to Auto-Locate on Map)" value={destQuery} onChange={(e) => setDestQuery(e.target.value)} style={inputStyle} />

              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Vehicle Model" value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="text" placeholder="Price (LKR)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0' }}>📍 **Tip:** Map Marker එක drag කර ඔබට අවශ්‍ය නිවැරදි ස්ථානය මත තබන්න.</p>

              {/* Dynamic Interactive Map with Draggable Marker */}
              <div style={{ height: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #38bdf8' }}>
                {/* @ts-ignore */}
                <DynamicMapContainer center={[postLat, postLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  {/* @ts-ignore */}
                  <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* @ts-ignore */}
                  <DynamicMarker position={[postLat, postLng]} draggable={true} eventHandlers={eventHandlers}>
                    {/* @ts-ignore */}
                    <DynamicPopup>📍 Target Destination Location</DynamicPopup>
                  </DynamicMarker>
                </DynamicMapContainer>
              </div>

              <button type="submit" style={{ padding: '12px', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
                Publish Trip Post
              </button>
            </form>
          </div>
        )}

        {/* PASSENGER PANEL */}
        {user.role === 'PASSENGER' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
            <h3 style={{ color: '#38bdf8', marginTop: 0 }}>🔍 Passenger: Find Destination Driver</h3>
            
            <form onSubmit={handlePassengerSearchLocation} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Where do you want to go? (e.g. Kandy / Galle)" 
                value={passengerDestQuery} 
                onChange={(e) => setPassengerDestQuery(e.target.value)} 
                style={{ ...inputStyle, flex: 1 }} 
              />
              <button type="submit" style={{ padding: '0 20px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                Search
              </button>
            </form>
          </div>
        )}

        {/* MATCHED DRIVER LISTING */}
        <h3>Available Matches ({matchedDriverPosts.length})</h3>

        {matchedDriverPosts.length === 0 ? (
          <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
            ඔබ සොයන ගමනාන්තයට හෝ ආසන්නයට යන Drivers ලා දැනට නොමැත.
          </div>
        ) : (
          matchedDriverPosts.map((post) => (
            <div key={post.id} style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8', fontSize: '17px' }}>🚘 {post.vehicleType} - {post.driverName}</h4>
                  <p style={{ margin: '2px 0', fontSize: '14px', color: '#cbd5e1' }}>🚩 Start: <strong>{post.startLocationName}</strong> ➔ 🏁 Destination: <strong>{post.endLocationName}</strong></p>
                  <p style={{ margin: '2px 0', fontSize: '13px', color: '#94a3b8' }}>📞 Contact: {post.driverPhone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>LKR {post.price}</span>
                  {user.role === 'PASSENGER' && (
                    <button 
                      onClick={() => setActiveBookedRide(post)} 
                      style={{ display: 'block', marginTop: '8px', padding: '8px 14px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Apply & Track Live Map
                    </button>
                  )}
                </div>
              </div>

              {/* REAL-TIME TWO-WAY GPS MAP VIEW */}
              {activeBookedRide?.id === post.id && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid #10b981' }}>
                  <p style={{ color: '#34d399', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>📍 Active Live GPS Map Tracking Enabled</p>
                  
                  <div style={{ height: '220px', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* @ts-ignore */}
                    <DynamicMapContainer center={[post.currentLat, post.currentLng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                      {/* @ts-ignore */}
                      <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      
                      {/* Driver Marker */}
                      {/* @ts-ignore */}
                      <DynamicMarker position={[post.currentLat, post.currentLng]}>
                        {/* @ts-ignore */}
                        <DynamicPopup>🚗 Driver Live Location ({post.driverName})</DynamicPopup>
                      </DynamicMarker>

                      {/* Passenger Marker */}
                      {passengerLiveGPS && (
                        /* @ts-ignore */
                        <DynamicMarker position={[passengerLiveGPS.lat, passengerLiveGPS.lng]}>
                          {/* @ts-ignore */}
                          <DynamicPopup>🧍 Your Live GPS Location</DynamicPopup>
                        </DynamicMarker>
                      )}

                      {/* Target Destination Marker */}
                      {/* @ts-ignore */}
                      <DynamicMarker position={[post.endLat, post.endLng]}>
                        {/* @ts-ignore */}
                        <DynamicPopup>🏁 Target Destination ({post.endLocationName})</DynamicPopup>
                      </DynamicMarker>
                    </DynamicMapContainer>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#fff',
  outline: 'none',
  fontSize: '14px'
};
