'use client';
import { useState } from 'react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [slip, setSlip] = useState<File | null>(null);

  // AI Natural Language Search Simulation
  const handleAISearch = async () => {
    // Simple parser: "Colombo to Kandy" -> from: Colombo, to: Kandy
    const parts = query.toLowerCase().split('to');
    const from = parts[0]?.replace('from', '').trim() || '';
    const to = parts[1]?.trim() || '';

    const res = await fetch('/api/v1', {
      method: 'POST',
      body: JSON.stringify({
        action: 'AI_SEARCH_RIDES',
        payload: { from, to }
      })
    });
    const data = await res.json();
    if (data.success) setResults(data.data);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ color: '#0f172a' }}>🚀 Galaxy Rides AI</h1>
      <p>ඔබට යන්න ඕන තැන Type කරන්න (e.g., "Colombo to Kandy tomorrow morning")</p>

      {/* AI Assistant Input */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter route..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={handleAISearch} style={{ padding: '12px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px' }}>
          Search
        </button>
      </div>

      {/* Ride Results */}
      <div>
        {results.map((ride: any) => (
          <div key={ride.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
            <h3>🚗 {ride.fromLocation} ➡️ {ride.toLocation}</h3>
            <p>👤 Driver: {ride.driver.fullName} | 💺 Seats Available: {ride.availableSeats}</p>
            <p>💵 Price per seat: Rs. {ride.pricePerSeat}</p>
            <button 
              onClick={() => setSelectedRide(ride)}
              style={{ background: '#16a34a', color: '#fff', padding: '8px 15px', border: 'none', borderRadius: '6px' }}
            >
              Book Now (Rs. 200 Fee)
            </button>
          </div>
        ))}
      </div>

      {/* Modal / Booking Payment Slip Area */}
      {selectedRide && (
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginTop: '20px', border: '2px solid #2563eb' }}>
          <h3>Confirm Booking for {selectedRide.fromLocation} Route</h3>
          <p>අපගේ <b>LankaQR</b> හෝ Bank Account එකට රු. 200 Booking Fee එක තැන්පත් කර Slip එක මෙතැනට දැමීමට යොමු වන්න.</p>
          <p>💳 <b>Bank:</b> Commercial Bank | <b>Acc:</b> 8009XXXXXX</p>
          
          <input type="file" onChange={(e) => setSlip(e.target.files?.[0] || null)} style={{ marginBottom: '10px' }} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ background: '#2563eb', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '6px' }}>
              Submit Payment Slip
            </button>
            <button onClick={() => setSelectedRide(null)} style={{ background: '#dc2626', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '6px' }}>
              Cancel / Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
