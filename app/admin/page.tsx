'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAdminBookings' }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatus = async (bookingId: string, status: string) => {
    await fetch('/api/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateBookingStatus', bookingId, status }),
    });
    fetchBookings();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>
        🛡️ Galaxy Rides Admin Dashboard
      </h1>
      
      {loading ? (
        <p>Loading Bookings & Payment Slips...</p>
      ) : bookings.length === 0 ? (
        <p>No booking requests found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((b) => (
            <div key={b.id} style={{ padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>
                  Booking ID: {b.id.substring(0, 8)}...
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Status: <strong style={{ color: b.status === 'APPROVED' ? '#16a34a' : b.status === 'REJECTED' ? '#dc2626' : '#d97706' }}>{b.status}</strong>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  Slip: {b.paymentSlip || 'Uploaded Slip'}
                </p>
              </div>

              {b.status === 'PENDING_APPROVAL' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleStatus(b.id, 'APPROVED')}
                    style={{ padding: '10px 18px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatus(b.id, 'REJECTED')}
                    style={{ padding: '10px 18px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
