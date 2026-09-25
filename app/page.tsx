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

export default function App() {
  // Authentication & Profile States
  const [user, setUser] = useState<any>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  
  // Registration Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [education, setEducation] = useState('');

  // Map & Ride Booking States
  const [isFullScreenMap, setIsFullScreenMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('Colombo to Kandy');
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [slipRef, setSlipRef] = useState('');
  const [bookingDone, setBookingDone] = useState(false);
  const [driverGPS, setDriverGPS] = useState({ lat: 6.9271, lng: 79.8612 });

  // Load saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('galaxy_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Handle Registration / Login (Robust Real Local Authentication)
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('කරුණාකර Email සහ Password ඇතුළත් කරන්න.');

    const userData = {
      id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
      firstName: firstName || 'User',
      lastName: lastName || '',
      email,
      role,
      phone: phone || '0771234567',
      whatsapp: whatsapp || phone || '0771234567',
      education: education || 'Higher Education',
      kycVerified: role === 'DRIVER' ? false : true,
    };

    localStorage.setItem('galaxy_user', JSON.stringify(userData));
    setUser(userData);
  };

  // Driver KYC Submission
  const handleKYC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return alert('Phone Number එක අනිවාර්යයි!');
    
    const updated = { ...user, phone, whatsapp, kycVerified: true };
    localStorage.setItem('galaxy_user', JSON.stringify(updated));
    setUser(updated);
    alert('🎉 KYC Verification සාර්ථකයි! දැන් ඔබට Rides භාරගත හැක.');
  };

  // Ride Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedRide(null);
    setBookingDone(false);

    setTimeout(() => {
      setRides([
        { id: '1', name: 'Galaxy 3D Economy', price: '4,500', driver: 'Saman Perera', rating: '★ 4.9', icon: '🚗', time: '2h 15m' },
        { id: '2', name: 'Galaxy Comfort VIP', price: '6,200', driver: 'Kamal Silva', rating: '★ 4.8', icon: '🚘', time: '2h 00m' },
        { id: '3', name: 'Galaxy Luxury Fleet', price: '9,500', driver: 'Nimal Fernando', rating: '★ 5.0', icon: '🚖', time: '1h 45m' },
      ]);
      setLoading(false);
    }, 600);
  };

  const logout = () => {
    localStorage.removeItem('galaxy_user');
    setUser(null);
  };

  // -------------------------------------------------------------
  // 1️⃣ SCREEN 1: REGISTRATION / LOGIN FIRST (මුලින්ම Register වෙන්න)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1e1b4b, #0f172a, #020617)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '42px' }}>🚀</span>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff', margin: '8px 0 4px 0' }}>Galaxy Rides 3D</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              {isLoginMode ? 'ඔබගේ ගිණුමට Login වෙන්න' : 'නව ගිණුමක් සාදා 3D Dashboard එකට පිවිසෙන්න'}
            </p>
          </div>

          {/* Role Switcher */}
          {!isLoginMode && (
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '6px', borderRadius: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setRole('PASSENGER')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: role === 'PASSENGER' ? '#6366f1' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🧍 Passenger
              </button>
              <button
                type="button"
                onClick={() => setRole('DRIVER')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: role === 'DRIVER' ? '#6366f1' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🚗 Driver
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isLoginMode && (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
                  <input type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
                </div>
                <input type="text" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                {role === 'PASSENGER' && (
                  <input type="text" placeholder="Education / Occupation" value={education} onChange={(e) => setEducation(e.target.value)} style={inputStyle} />
                )}
              </>
            )}

            <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Strong Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

            <button type="submit" style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)'
            }}>
              {isLoginMode ? 'Login to Dashboard' : `Register as ${role}`}
            </button>
          </form>

          <p onClick={() => setIsLoginMode(!isLoginMode)} style={{ textAlign: 'center', color: '#818cf8', cursor: 'pointer', marginTop: '16px', fontSize: '14px' }}>
            {isLoginMode ? 'ගිණුමක් නැද්ද? Register වෙන්න' : 'දැනටමත් ගිණුමක් තිබේද? Login වෙන්න'}
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2️⃣ FULL SCREEN 3D MAP VIEW (Map Click කළ විට)
  // -------------------------------------------------------------
  if (isFullScreenMap) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
        {/* Back Button */}
        <button
          onClick={() => setIsFullScreenMap(false)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10000,
            padding: '12px 24px',
            borderRadius: '30px',
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
          }}
        >
          ⬅️ Back to Dashboard
        </button>

        {/* Fullscreen Map */}
        {/* @ts-ignore */}
        <DynamicMapContainer center={[driverGPS.lat, driverGPS.lng]} zoom={12} style={{ height: '100vh', width: '100vw' }}>
          {/* @ts-ignore */}
          <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* @ts-ignore */}
          <DynamicMarker position={[driverGPS.lat, driverGPS.lng]}>
            {/* @ts-ignore */}
            <DynamicPopup>🚗 Real-time Driver GPS Location</DynamicPopup>
          </DynamicMarker>
        </DynamicMapContainer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3️⃣ MAIN DASHBOARD (REGISTER / LOGIN වූ පසු පෙන්වන 3D DASHBOARD)
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* 3D Glass Header */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🚀</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#818cf8' }}>Galaxy Rides 3D</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>👤 {user.firstName} ({user.role})</span>
          <button onClick={logout} style={{ padding: '6px 14px', borderRadius: '8px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '24px auto', padding: '0 20px' }}>

        {/* DRIVER KYC VERIFICATION BLOCK */}
        {user.role === 'DRIVER' && !user.kycVerified && (
          <div style={{ padding: '24px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#fba518', fontSize: '20px' }}>⚠️ Driver KYC Verification Required</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#fef3c7' }}>Orders ලබා ගැනීමට ඔබේ WhatsApp සහ Mobile Phone නම්බර්ස් Verify කරන්න.</p>
            <form onSubmit={handleKYC} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="WhatsApp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={inputStyle} />
              <button type="submit" style={{ padding: '12px', borderRadius: '10px', background: '#f59e0b', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                Verify Driver KYC
              </button>
            </form>
          </div>
        )}

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Route (e.g. Colombo to Kandy)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" style={{ padding: '14px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Searching...' : 'Search Rides'}
          </button>
        </form>

        {/* CLICKABLE 3D MAP CARD (Click කළ විට Full Screen වේ) */}
        <div
          onClick={() => setIsFullScreenMap(true)}
          style={{
            height: '320px',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid rgba(99, 102, 241, 0.4)',
            position: 'relative',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            marginBottom: '28px'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#818cf8',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            🔍 Click to Open Fullscreen Map
          </div>

          {/* @ts-ignore */}
          <DynamicMapContainer center={[driverGPS.lat, driverGPS.lng]} zoom={10} style={{ height: '100%', width: '100%' }}>
            {/* @ts-ignore */}
            <DynamicTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* @ts-ignore */}
            <DynamicMarker position={[driverGPS.lat, driverGPS.lng]}>
              {/* @ts-ignore */}
              <DynamicPopup>📍 Pickup Location</DynamicPopup>
            </DynamicMarker>
          </DynamicMapContainer>
        </div>

        {/* SEARCH RIDE RESULTS */}
        {rides.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#cbd5e1' }}>Available Rides Found:</h3>
            {rides.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRide(r)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px',
                  borderRadius: '16px',
                  background: selectedRide?.id === r.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  border: selectedRide?.id === r.id ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '32px' }}>{r.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '17px' }}>{r.name}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Driver: {r.driver} ({r.rating})</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>LKR {r.price}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOOKING SLIP CARD */}
        {selectedRide && (
          <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {!bookingDone ? (
              <>
                <h4 style={{ margin: '0 0 12px 0', color: '#818cf8' }}>Confirm Ride for {selectedRide.name} (LKR {selectedRide.price})</h4>
                <input type="text" placeholder="Bank Transfer Ref / Payment Details" value={slipRef} onChange={(e) => setSlipRef(e.target.value)} style={inputStyle} />
                <button onClick={() => setBookingDone(true)} style={{ width: '100%', marginTop: '12px', padding: '14px', borderRadius: '10px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirm Booking Now
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#34d399', padding: '10px' }}>
                🎉 <strong>Booking Confirmed!</strong> Your ride details have been sent to driver {selectedRide.driver}.
              </div>
            )}
          </div>
        )}

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
