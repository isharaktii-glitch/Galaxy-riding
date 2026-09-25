'use client';

import { useState, useEffect } from 'react';

export default function DriverDashboard() {
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLocSharing, setIsLocSharing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Submit KYC Details
  const handleKYC = async () => {
    const res = await fetch('/api/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verifyKYC', userId: user.id, phone, whatsapp }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('KYC Verification Completed!');
    }
  };

  // Turn ON Driver Live GPS Broadcast (Sends location continuously)
  useEffect(() => {
    let watchId: number;
    if (isLocSharing && user?.kycVerified) {
      watchId = navigator.geolocation.watchPosition(async (pos) => {
        await fetch('/api/v1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateLocation', userId: user.id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
      });
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isLocSharing, user]);

  if (!user) return <p style={{ padding: '20px' }}>Loading Dashboard...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🚗 Driver Portal: {user.firstName} {user.lastName}</h1>

      {/* KYC Block */}
      {!user.kycVerified ? (
        <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '1px solid #f59e0b' }}>
          <h3>⚠️ KYC Verification Required to Accept Rides</h3>
          <p style={{ fontSize: '14px' }}>Please provide your Mobile Number & WhatsApp Details below:</p>
          <input type="text" placeholder="Phone Number (Required)" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '8px' }} />
          <input type="text" placeholder="WhatsApp Number (Optional)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px' }} />
          <button onClick={handleKYC} style={{ width: '100%', padding: '10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px' }}>Submit KYC & Verify Account</button>
        </div>
      ) : (
        <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '10px' }}>
          <h3>✅ KYC Status: Verified Driver</h3>
          <button 
            onClick={() => setIsLocSharing(!isLocSharing)}
            style={{ width: '100%', padding: '14px', backgroundColor: isLocSharing ? '#dc2626' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            {isLocSharing ? '🛑 Turn OFF Live GPS Location' : '📡 Turn ON Live GPS Location'}
          </button>
          {isLocSharing && <p style={{ textAlign: 'center', fontSize: '13px', color: '#16a34a', marginTop: '8px' }}>Broadcasting live vehicle position to nearby passengers...</p>}
        </div>
      )}
    </div>
  );
}
