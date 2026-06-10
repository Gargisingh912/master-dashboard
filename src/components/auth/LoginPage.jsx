import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BASE } from '../../config/themes';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(`Authentication Failed: ${error.message}`);
    
    setLoading(false);
  };

  return (
    <div style={{
      background: BASE.bg,
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        background: BASE.surface,
        border: `1px solid ${BASE.border}`,
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ color: BASE.text, margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>Sign In</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: BASE.textMid, fontSize: '12px', fontWeight: 600 }}>Email Address</label>
          <input 
            type="email" 
            required
            placeholder="name@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              background: BASE.card,
              border: `1px solid ${BASE.border}`,
              borderRadius: '8px',
              padding: '10px 12px',
              color: BASE.text,
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: BASE.textMid, fontSize: '12px', fontWeight: 600 }}>Password</label>
          <input 
            type="password" 
            required
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              background: BASE.card,
              border: `1px solid ${BASE.border}`,
              borderRadius: '8px',
              padding: '10px 12px',
              color: BASE.text,
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <button 
          disabled={loading}
          style={{
            background: BASE.green,
            color: BASE.bg,
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '8px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Authenticating...' : 'Enter Dashboard'}
        </button>
      </form>
    </div>
  );
}