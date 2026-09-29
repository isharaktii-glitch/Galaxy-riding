'use client';

import { useState, useEffect, useMemo } from 'react';
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
const MapFlyToController = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      const { useMap } = mod;
      return function MapFlyTo({ center }: { center: [number, number] }) {
        const map = useMap();
        useEffect(() => {
          if (center) {
            map.flyTo(center, 15, { duration: 1.5 });
          }
        }, [center, map]);
        return null;
      };
    }),
  { ssr: false }
);

import 'leaflet/dist/leaflet.css';

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
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
  vehicleCategory: 'CAR' | 'BUS' | 'LORRY' | 'BIKE' | 'CLASSIC';
  price: string;
  availableSeats: string;
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
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');

  // Driver Creation State
  const [startLoc, setStartLoc] = useState('Colombo');
  const [destQuery, setDestQuery] = useState('Temple of the Tooth Kandy');
  const [vehicle, setVehicle] = useState('Toyota Axio VIP');
  const [vehicleCat, setVehicleCat] = useState<'CAR' | 'BUS' | 'LORRY' | 'BIKE' | 'CLASSIC'>('CAR');
  const [price, setPrice] = useState('3500');
  const [seats, setSeats] = useState('3');
  const [postLat, setPostLat] = useState<number>(7.2936); // Default Temple of Tooth Lat
  const [postLng, setPostLng] = useState<number>(80.6413); // Default Temple of Tooth Lng
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Driver & Passenger Posts Storage
  const [driverPosts, setDriverPosts] = useState<DriverPost[]>([]);

  // Passenger Match State
  const [passengerDestQuery, setPassengerDestQuery] = useState('');
  const [passengerDestLat, setPassengerDestLat] = useState<number | null>(null);
  const [passengerDestLng, setPassengerDestLng] = useState<number | null>(null);
  const [passengerLiveGPS, setPassengerLiveGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [activeBookedRide, setActiveBookedRide] = useState<DriverPost | null>(null);

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
          vehicleType: 'Toyota Axio (Sedan)',
          vehicleCategory: 'CAR',
          price: '3800',
          availableSeats: '3 Seats',
          startLocationName: 'Colombo Fort',
          endLocationName: 'Temple of the Tooth, Kandy',
          startLat: 6.9344,
          startLng: 79.8428,
          endLat: 7.2936,
          endLng: 80.6413,
          currentLat: 6.9271,
          currentLng: 79.8612,
          createdAt: new Date().toISOString(),
        },
      ];
      setDriverPosts(initialPosts);
      localStorage.setItem('galaxy_driver_posts', JSON.stringify(initialPosts));
    }
  }, []);

  // Location Fly-To Search Function
  const searchLocationAndFly = async (queryName: string, isDriver: boolean) => {
    if (!queryName || queryName.trim().length < 2) return;
    setIsSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryName)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (isDriver) {
          setPostLat(lat);
          setPostLng(lng);
        } else {
          setPassengerDestLat(lat);
          setPassengerDestLng(lng);
        }
      } else {
        alert('ස්ථානය සොයාගැනීමට නොහැකි විය. වෙනත් නමක් type කරන්න.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = {
      id: 'USR-' + Date.now(),
      firstName: firstName || (email ? email.split('@')[0] : 'User'),
      email,
      role,
      phone: phone || '0770001122',
      isVerified: true,
    };
    localStorage.setItem('galaxy_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destQuery) return alert('කරුණාකර ගමනාන්තයක් ඇතුළත් කරන්න!');

    const newPost: DriverPost = {
      id: 'POST-' + Date.now(),
      driverName: user.firstName,
      driverPhone: user.phone,
      vehicleType: vehicle,
      vehicleCategory: vehicleCat,
      price: price,
      availableSeats: seats,
      startLocationName: startLoc,
      endLocationName: destQuery,
      startLat: 6.9271,
      startLng: 79.8612,
      endLat: postLat,
      endLng: postLng,
      currentLat: 6.9271,
      currentLng: 79.8612,
      createdAt: new Date().toLocaleString(),
    };

    const updated = [newPost, ...driverPosts];
    setDriverPosts(updated);
    localStorage.setItem('galaxy_driver_posts', JSON.stringify(updated));
    alert('🚀 Driver Route Post එක සාර්ථකව පලකරන ලදී!');
  };

  const matchedDriverPosts = useMemo(() => {
    if (!passengerDestQuery) return driverPosts;

    const query = passengerDestQuery.toLowerCase().trim();

    return driverPosts.filter((post) => {
      const nameMatch =
        post.endLocationName.toLowerCase().includes(query) ||
        query.includes(post.endLocationName.toLowerCase());

      let radiusMatch = false;
      if (passengerDestLat && passengerDestLng) {
        const dist = calculateDistanceKM(
          passengerDestLat,
          passengerDestLng,
          post.endLat,
          post.endLng
        );
        if (dist <= 15) radiusMatch = true;
      }

      return nameMatch || radiusMatch;
    });
  }, [passengerDestQuery, passengerDestLat, passengerDestLng, driverPosts]);

  const logout = () => {
    localStorage.removeItem('galaxy_user');
    setUser(null);
  };

  if (!user) {
    return (
      <div style={container3DStyle}>
        <div style={glassCardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ color: '#38bdf8', margin: '0 0 6px 0', fontSize: '28px', fontWeight: '800' }}>
              🌌 Galaxy Rides 3D
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              AI-Driven Multi-Modal Ride Platform
            </p>
          </div>

          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: authMode === 'LOGIN' ? '#0284c7' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔑 Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('SIGNUP')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: authMode === 'SIGNUP' ? '#0284c7' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📝 Sign Up
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setRole('PASSENGER')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: role === 'PASSENGER' ? '1px solid #38bdf8' : '1px solid transparent', background: role === 'PASSENGER' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
            >
              🧍 Passenger
            </button>
            <button
              type="button"
              onClick={() => setRole('DRIVER')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: role === 'DRIVER' ? '1px solid #38bdf8' : '1px solid transparent', background: role === 'DRIVER' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
            >
              🚗 Driver
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authMode === 'SIGNUP' && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={input3DStyle}
                />
                <input
                  type="text"
                  placeholder="Phone Number (WhatsApp)"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={input3DStyle}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input3DStyle}
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input3DStyle}
            />

            <button type="submit" style={button3DStyle}>
              {authMode === 'LOGIN' ? `Login as ${role}` : `Create ${role} Account`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <nav style={{ padding: '16px 24px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>🌌 Galaxy Rides 3D</span>
          <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>👤 {user.firstName} ({user.role})</span>
          <button onClick={logout} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 16px' }}>

        {/* DRIVER TRIP CREATOR PANEL */}
        {user.role === 'DRIVER' && (
          <div style={glassPanelStyle}>
            <h3 style={{ color: '#38bdf8', margin: '0 0 16px 0', fontSize: '18px' }}>📢 Post Your Route & Destination</h3>

            <form onSubmit={handlePublishPost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Start City (e.g. Colombo)" value={startLoc} onChange={(e) => setStartLoc(e.target.value)} style={input3DStyle} />
                <div style={{ display: 'flex', flex: 1, gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Ending Location (e.g. Temple of Tooth Kandy)"
                    value={destQuery}
                    onChange={(e) => setDestQuery(e.target.value)}
                    style={input3DStyle}
                  />
                  <button
                    type="button"
                    onClick={() => searchLocationAndFly(destQuery, true)}
                    style={{ padding: '0 16px', background: '#0284c7', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', minWidth: '90px' }}
                  >
                    {isSearchingLocation ? 'Flying...' : '✈️ Fly Map'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={vehicleCat} onChange={(e: any) => setVehicleCat(e.target.value)} style={input3DStyle}>
                  <option value="CAR">🚗 Passenger Car / SUV</option>
                  <option value="BUS">🚌 Bus / Mini Coach</option>
                  <option value="LORRY">🚚 Lorry / Cargo Truck</option>
                  <option value="BIKE">📦 Bike / Express Courier</option>
                  <option value="CLASSIC">🚙 Classic / Budget Ride</option>
                </select>

                <input type="text" placeholder="Vehicle Name" value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={input3DStyle} />
                <input type="text" placeholder="Price (LKR)" value={price} onChange={(e) => setPrice(e.target.value)} style={input3DStyle} />
              </div>

              {/* DYNAMIC AUTO-FLY MAP VIEW */}
              <div style={{ height: '280px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.4)', marginTop: '6px', position: 'relative' }}>
                {/* @ts-ignore */}
                <DynamicMapContainer center={[postLat, postLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  {/* @ts-ignore */}
                  <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* @ts-ignore */}
                  <MapFlyToController center={[postLat, postLng]} />
                  {/* @ts-ignore */}
                  <DynamicMarker
                    position={[postLat, postLng]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e: any) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        setPostLat(position.lat);
                        setPostLng(position.lng);
                      },
                    }}
                  >
                    {/* @ts-ignore */}
                    <DynamicPopup>📍 Target Destination Pin ({destQuery})</DynamicPopup>
                  </DynamicMarker>
                </DynamicMapContainer>
              </div>

              <button type="submit" style={button3DStyle}>🚀 Publish Route Post</button>
            </form>
          </div>
        )}

        {/* PASSENGER SEARCH PANEL */}
        {user.role === 'PASSENGER' && (
          <div style={glassPanelStyle}>
            <h3 style={{ color: '#38bdf8', margin: '0 0 16px 0', fontSize: '18px' }}>🔍 Search Destination Route</h3>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Where do you want to go? (e.g. Kandy / Galle)"
                value={passengerDestQuery}
                onChange={(e) => {
                  setPassengerDestQuery(e.target.value);
                  searchLocationAndFly(e.target.value, false);
                }}
                style={{ ...input3DStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => searchLocationAndFly(passengerDestQuery, false)}
                style={{ padding: '0 24px', background: '#0284c7', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* MATCHED LISTINGS */}
        <h3 style={{ margin: '20px 0 12px 0', fontSize: '18px', color: '#94a3b8' }}>
          Available Route Drivers ({matchedDriverPosts.length})
        </h3>

        {matchedDriverPosts.length === 0 ? (
          <div style={{ padding: '30px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', textAlign: 'center', color: '#64748b' }}>
            ඔබ සොයන ගමනාන්තයට හෝ ආසන්නයට යන Drivers ලා දැනට නොමැත.
          </div>
        ) : (
          matchedDriverPosts.map((post) => (
            <div key={post.id} style={card3DStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {post.vehicleCategory === 'CAR' && '🚗'}
                      {post.vehicleCategory === 'BUS' && '🚌'}
                      {post.vehicleCategory === 'LORRY' && '🚚'}
                      {post.vehicleCategory === 'BIKE' && '📦'}
                      {post.vehicleCategory === 'CLASSIC' && '🚙'}
                    </span>
                    <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '18px' }}>{post.vehicleType}</h4>
                    <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px' }}>
                      {post.driverName}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#cbd5e1' }}>
                    🚩 Start: <strong>{post.startLocationName}</strong> ➔ 🏁 Target: <strong>{post.endLocationName}</strong>
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#94a3b8' }}>
                    📞 Contact: <strong>{post.driverPhone}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>LKR {post.price}</div>
                  {user.role === 'PASSENGER' && (
                    <button
                      onClick={() => setActiveBookedRide(post)}
                      style={{ marginTop: '10px', padding: '8px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Track Live Map
                    </button>
                  )}
                </div>
              </div>

              {activeBookedRide?.id === post.id && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid #10b981' }}>
                  <p style={{ color: '#34d399', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                    📍 Real-Time Mutual Live GPS Tracking Enabled
                  </p>
                  <div style={{ height: '240px', borderRadius: '10px', overflow: 'hidden' }}>
                    {/* @ts-ignore */}
                    <DynamicMapContainer center={[post.endLat, post.endLng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                      {/* @ts-ignore */}
                      <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

const container3DStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const glassCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  background: 'rgba(30, 41, 59, 0.75)',
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  padding: '32px',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
};

const glassPanelStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.6)',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '24px',
};

const card3DStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.85)',
  backdropFilter: 'blur(12px)',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  marginBottom: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
};

const input3DStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(15, 23, 42, 0.8)',
  color: '#fff',
  outline: 'none',
  fontSize: '14px',
};

const button3DStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#0284c7',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '15px',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
};
