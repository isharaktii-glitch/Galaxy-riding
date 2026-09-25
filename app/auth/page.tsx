'use client';

import { useState } from 'react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = isLogin ? 'login' : 'register';

    const res = await fetch('/api/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...formData, role }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      alert(`${isLogin ? 'Login' : 'Registration'} Successful!`);
      window.location.href = data.user.role === 'DRIVER' ? '/driver-dashboard' : '/passenger-dashboard';
    } else {
      alert(data.message || 'Error occurred!');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', border: '1px solid #cbd5e1', borderRadius: '12px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>{isLogin ? '🔑 Login' : '📝 Register Profile'}</h2>
      
      {!isLogin && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button onClick={() => setRole('PASSENGER')} style={{ flex: 1, padding: '8px', backgroundColor: role === 'PASSENGER' ? '#2563eb' : '#f1f5f9', color: role === 'PASSENGER' ? '#fff' : '#000', border: 'none', borderRadius: '6px' }}>Passenger</button>
          <button onClick={() => setRole('DRIVER')} style={{ flex: 1, padding: '8px', backgroundColor: role === 'DRIVER' ? '#2563eb' : '#f1f5f9', color: role === 'DRIVER' ? '#fff' : '#000', border: 'none', borderRadius: '6px' }}>Driver</button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isLogin && (
          <>
            <input type="text" placeholder="First Name" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="Last Name" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </>
        )}
        <input type="email" placeholder="Email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        <input type="password" placeholder="Strong Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        
        <button type="submit" style={{ padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          {isLogin ? 'Login' : 'Create Account'}
        </button>
      </form>

      <p onClick={() => setIsLogin(!isLogin)} style={{ color: '#2563eb', cursor: 'pointer', marginTop: '14px', fontSize: '14px', textAlign: 'center' }}>
        {isLogin ? "Don't have an account? Register" : 'Already registered? Login'}
      </p>
    </div>
  );
}
