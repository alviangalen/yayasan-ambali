import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) setErrorMsg(error.message);
      else {
        alert("Pendaftaran berhasil!");
        onLoginSuccess(data.user);
      }
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isLogin ? "Masuk ke EduFans" : "Daftar Akun Baru"}</h2>
        {errorMsg && <p style={{color: 'red'}}>{errorMsg}</p>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Nama Lengkap" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar")}
          </button>
        </form>
        <p onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
          {isLogin ? "Belum punya akun? Daftar sekarang" : "Sudah punya akun? Masuk di sini"}
        </p>
      </div>
    </div>
  );
}
