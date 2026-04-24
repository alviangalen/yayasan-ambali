import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Sparkles, ArrowRight, AtSign } from 'lucide-react';
import axios from 'axios';

export default function AuthModal({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErrorMsg(error.message);
      else onLoginSuccess(data.user);
    } else {
      // Validate username first
      try {
        const checkRes = await axios.get(`/api/check-username/${username}`);
        if (!checkRes.data.available) {
          setErrorMsg('Username sudah digunakan orang lain.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              display_name: displayName,
              username: username.toLowerCase().replace(/[^a-z0-9_]/g, '')
            }
          }
        });
        
        if (error) {
          setErrorMsg(error.message);
        } else {
          // Profile is created on first fetch in CreatorsPage, or we can manually trigger it here
          alert("Pendaftaran berhasil!");
          onLoginSuccess(data.user);
        }
      } catch (err) {
        setErrorMsg('Gagal memverifikasi username.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel fade-up" style={{ width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-purple)', filter: 'blur(100px)', opacity: 0.2 }}></div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255, 204, 0, 0.1)', borderRadius: '16px', marginBottom: '20px' }}>
            <Sparkles size={28} color="var(--accent-gold)" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{isLogin ? "Selamat Datang" : "Gabung Bersama"}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{isLogin ? "Masuk untuk melanjutkan ke Ambali" : "Pilih identitas unik Anda di Ambali"}</p>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '24px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Nama Tampilan (Contoh: Budi Santoso)" 
                  className="post-input"
                  required 
                  style={{ width: '100%', paddingLeft: '48px' }}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <AtSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Username Unik (Tanpa spasi)" 
                  className="post-input"
                  required 
                  style={{ width: '100%', paddingLeft: '48px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                />
              </div>
            </>
          )}
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Email" 
              className="post-input"
              required 
              style={{ width: '100%', paddingLeft: '48px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              className="post-input"
              required 
              style={{ width: '100%', paddingLeft: '48px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-premium" style={{ width: '100%', padding: '16px', marginTop: '12px' }} disabled={loading}>
            {loading ? "Memproses..." : (isLogin ? "Masuk Sekarang" : "Buat Akun Ambali")}
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"} {' '}
          <span 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
            style={{ color: 'var(--accent-gold)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </span>
        </p>
      </div>
    </div>
  );
}
