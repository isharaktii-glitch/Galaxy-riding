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

interface DriverPost {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  price: string;
  startLocationName: string;
  endLocationName: string;
  endLat: number;
  endLng: number;
  createdAt: string;
}

export default function App() {
  // User Authentication
  const [user, setUser] = useState<any>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  
  // Registration Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Driver Post State
  const [startLoc, setStartLoc] = useState('Colombo');
  const [destQuery, setDestQuery] = useState('');
  const [vehicle, setVehicle] = useState('Car / Sedan');
  const [price, setPrice] = useState('3500');
  const [postLat, setPostLat] = useState<number>(7.2906); // Default Kandy
  const [postLng, setPostLng] = useState<number>(80.6337);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);

  // Posts State
  const [driverPosts, setDriverPosts] = useState<DriverPost[]>([]);

  // Passenger Search State
  const [passengerDest, setPassengerDest] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [matchedPosts, setMatchedPosts] = useState<DriverPost[]>([]);
  const [passengerGPS, setPassengerGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [bookedRide, setBookedRide] = useState<DriverPost | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('galaxy_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedPosts = localStorage.getItem('galaxy_driver_posts');
    if (savedPosts) {
      setDriverPosts(JSON.parse(savedPosts));
    } else {
      const samplePosts: DriverPost[] = [
        {
          id: 'POST-1',
          driverName: 'Saman Perera',
          driverPhone: '0771234567',
          vehicleType: 'Galaxy Comfort VIP',
          price: '4500',
          startLocationName: 'Colombo',
          endLocationName: 'Kandy Dalada Maligawa',
          endLat: 7.2936,
          endLng: 80.6413,
          createdAt: new Date().toISOString()
        },
        {
          id: 'POST-2',
          driverName: 'Kamal Silva',
          driverPhone: '0719876543',
          vehicleType: 'Galaxy Luxury Fleet',
          price: '6000',
          startLocationName: 'Gampaha',
          endLocationName: 'Galle Fort',
          endLat: 6.0329,
          endLng: 80.2168,
          createdAt: new Date().toISOString()
        }
      ];
      setDriverPosts(samplePosts);
      localStorage.setItem('galaxy_driver_posts', JSON.stringify(samplePosts));
    }
  }, []);

  // Auth Action
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('කරුණාකර Email සහ Password ඇතුළත් කරන්න.');

    const userData = {
      id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
      firstName: firstName || 'User',
      lastName: lastName || '',
      email,
      role,
      phone: phone || '0771234567'
    };

    localStorage.setItem('galaxy_user', JSON.stringify(userData));
    setUser(userData);
  };

  // Driver Auto Geocoding (Lookup Location)
  const handleLocationSearch = async () => {
    if (!destQuery) return alert('කරුණාකර ගමනාන්තයේ නම සටහන් කරන්න (e.g. Kandy Dalada Maligawa)');
    setIsSearchingLoc(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destQuery)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const topResult = data[0];
        setPostLat(parseFloat(topResult.lat));
        setPostLng(parseFloat(topResult.lon));
        alert(`📍 Location සොයාගන්නා ලදී: ${topResult.display_name}`);
      } else {
        alert('ස්ථානය සිතියමෙන් සොයාගැනීමට නොහැකි විය. වෙනත් නමක් ලබාදී උත්සාහ කරන්න.');
      }
    } catch (err) {
      alert('Location සෙවීමේදී දෝෂයක් සිදු විය.');
    } finally {
      setIsSearchingLoc(false);
    }
  };

  // Driver Publish Post
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destQuery) return alert('ගමනාන්තය ඇතුළත් කරන්න!');

    const newPost: DriverPost = {
      id: 'POST-' + Date.now(),
      driverName: `${user.firstName} ${user.lastName}`.trim(),
      driverPhone: user.phone,
      vehicleType: vehicle,
      price: price,
      startLocationName: startLoc,
      endLocationName: destQuery,
      endLat: postLat,
      endLng: postLng,
      createdAt: new Date().toLocaleString()
    };

    const updated = [newPost, ...driverPosts];
    setDriverPosts(updated);
    localStorage.setItem('galaxy_driver_posts', JSON.stringify(updated));
    alert('🎉 ඔබේ Post එක සාර්ථකව Publish විය!');
    setDestQuery('');
  };

  // Passenger Exact / Flexible Destination Match Search
  const handlePassengerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerDest) return alert('ඔබට යන්න ඕන ගමනාන්තය සටහන් කරන්න!');

    setHasSearched(true);
    const query = passengerDest.toLowerCase().trim();

    // Destination Match Filtering
    const filtered = driverPosts.filter(p => 
      p.endLocationName.toLowerCase().includes(query) ||
      query.includes(p.endLocationName.toLowerCase())
    );

    setMatchedPosts(filtered);
  };

  // Require GPS and Share Location
  const requestGPSLocation = (ride: DriverPost) => {
    if (!navigator.geolocation) {
      setGpsError('ඔබගේ Device එකෙහි Geolocation නොමැත.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPassengerGPS({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setBookedRide(ride);
        alert('📍 ඔබේ Location එක සක්‍රිය විය! Driver ට සහ ඔබට සජීවීව Map එකේ ස්ථාන පෙන්නුම් කරයි.');
      },
      () => {
        setGpsError('Ride එක Apply කිරීමට කරුණාකර Phone එකේ Location Permission (ON) ලබා දෙන්න.');
      }
    );
  };

  const logout = () => {
    localStorage.removeItem('galaxy_user');
    setUser(null);
  };

  // SCREEN 1: LOGIN & REGISTRATION
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle, #1e1b4b, #0f172a, #020617)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#fff' }}>🚀 Galaxy Rides 3D</h2>
          
          <div style={{ display: 'flex', gap: '8px', margin: '20px 0' }}>
            <button type="button" onClick={() => setRole('PASSENGER')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: role === 'PASSENGER' ? '#6366f1' : '#1e293b', color: '#fff', cursor: 'pointer' }}>🧍 Passenger</button>
            <button type="button" onClick={() => setRole('DRIVER')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: role === 'DRIVER' ? '#6366f1' : '#1e293b', color: '#fff', cursor: 'pointer' }}>🚗 Driver</button>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isLoginMode && (
              <>
                <input type="text" placeholder="First Name" required value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="Phone Number" required value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              </>
            )}
            <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            <button type="submit" style={{ padding: '14px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {isLoginMode ? 'Login' : `Register as ${role}`}
            </button>
          </form>
          <p onClick={() => setIsLoginMode(!isLoginMode)} style={{ color: '#818cf8', textAlign: 'center', cursor: 'pointer', marginTop: '16px' }}>
            {isLoginMode ? 'Register වෙන්න' : 'Login වෙන්න'}
          </p>
        </div>
      </div>
    );
  }

  const postsToDisplay = hasSearched ? matchedPosts : driverPosts;

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ padding: '16px 24px', background: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#818cf8' }}>🚀 Galaxy Rides 3D</span>
        <div>
          <span style={{ marginRight: '12px' }}>👤 {user.firstName} ({user.role})</span>
          <button onClick={logout} style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '850px', margin: '20px auto', padding: '0 20px' }}>
        
        {/* DRIVER: CREATE POST */}
        {user.role === 'DRIVER' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px' }}>
            <h2 style={{ color: '#818cf8', marginTop: 0 }}>📢 Create Driver Trip Post</h2>
            
            <form onSubmit={handlePublishPost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Starting Location (e.g. Colombo)" value={startLoc} onChange={e => setStartLoc(e.target.value)} style={inputStyle} />
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Destination (e.g. Kandy Dalada Maligawa)" 
                  value={destQuery} 
                  onChange={e => setDestQuery(e.target.value)} 
                  style={{ ...inputStyle, flex: 1 }} 
                />
                <button type="button" onClick={handleLocationSearch} style={{ padding: '0 16px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSearchingLoc ? 'Searching...' : '🔍 Find Location'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Vehicle Model" value={vehicle} onChange={e => setVehicle(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="text" placeholder="Price (LKR)" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>

              {/* Dynamic Location Map */}
              <div style={{ height: '260px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #6366f1', margin: '10px 0' }}>
                {/* @ts-ignore */}
                <DynamicMapContainer center={[postLat, postLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  {/* @ts-ignore */}
                  <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* @ts-ignore */}
                  <DynamicMarker position={[postLat, postLng]}>
                    {/* @ts-ignore */}
                    <DynamicPopup>📍 Destination: {destQuery || 'Selected Location'}</DynamicPopup>
                  </DynamicMarker>
                </DynamicMapContainer>
              </div>

              <button type="submit" style={{ padding: '14px', background: '#10b981', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                🚀 Confirm & Publish Trip Post
              </button>
            </form>
          </div>
        )}

        {/* PASSENGER: DESTINATION MATCHING SEARCH */}
        {user.role === 'PASSENGER' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px' }}>
            <h2 style={{ color: '#818cf8', marginTop: 0 }}>🔍 Search Destination Drivers</h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>ඔබ යන ගමනාන්තය සඳහන් කළ පසු ඒ වෙත යන සියලුම Drivers ලා පහතින් පෙන්නුම් කෙරේ.</p>
            
            <form onSubmit={handlePassengerSearch} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Enter Destination (e.g. Kandy / Galle)" 
                value={passengerDest} 
                onChange={e => setPassengerDest(e.target.value)} 
                style={{ ...inputStyle, flex: 1 }} 
              />
              <button type="submit" style={{ padding: '12px 24px', background: '#6366f1', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                Find Drivers
              </button>
            </form>
          </div>
        )}

        {/* DISPLAY DRIVERS */}
        <h3>
          {hasSearched ? `Drivers Heading To "${passengerDest}" (${postsToDisplay.length})` : `All Available Drivers (${postsToDisplay.length})`}
        </h3>

        {postsToDisplay.length === 0 ? (
          <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
            මෙම ගමනාන්තයට යන Drivers ලා කිසිවෙකු දැනට පෝස්ට් කර නොමැත.
          </div>
        ) : (
          postsToDisplay.map((post) => (
            <div key={post.id} style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '18px' }}>🚘 {post.vehicleType} - {post.driverName}</h4>
                  <p style={{ margin: '6px 0', color: '#cbd5e1' }}>📍 Start: <strong>{post.startLocationName}</strong> ➔ Destination: <strong>{post.endLocationName}</strong></p>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>📞 Driver Contact: {post.driverPhone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>LKR {post.price}</div>
                  
                  {user.role === 'PASSENGER' && (
                    <button 
                      onClick={() => requestGPSLocation(post)} 
                      style={{ marginTop: '10px', padding: '10px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      📍 Apply & Share GPS Location
                    </button>
                  )}
                </div>
              </div>

              {/* LIVE MAP TRACKING WHEN RIDE APPLIED */}
              {bookedRide?.id === post.id && passengerGPS && (
                <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid #10b981' }}>
                  <p style={{ color: '#34d399', fontWeight: 'bold', margin: '0 0 10px 0' }}>✅ Ride Booking Applied! Real-time GPS Map View Active.</p>
                  <div style={{ height: '220px', borderRadius: '10px', overflow: 'hidden' }}>
                    {/* @ts-ignore */}
                    <DynamicMapContainer center={[passengerGPS.lat, passengerGPS.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                      {/* @ts-ignore */}
                      <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {/* @ts-ignore */}
                      <DynamicMarker position={[passengerGPS.lat, passengerGPS.lng]}>
                        {/* @ts-ignore */}
                        <DynamicPopup>🧍 Passenger GPS Location</DynamicPopup>
                      </DynamicMarker>
                      {/* @ts-ignore */}
                      <DynamicMarker position={[post.endLat, post.endLng]}>
                        {/* @ts-ignore */}
                        <DynamicPopup>🚗 Driver Destination Location</DynamicPopup>
                      </DynamicMarker>
                    </DynamicMapContainer>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {gpsError && <p style={{ color: '#ef4444', textAlign: 'center' }}>{gpsError}</p>}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(15, 23, 42, 0.7)',
  color: '#fff',
  outline: 'none',
  fontSize: '14px'
};
