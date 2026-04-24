import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { User, Mail, Lock, CheckCircle, AtSign, Shield } from 'lucide-react';

export default function SettingsPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user) { navigate('/creators'); return; }
            setUser(session.user);
            setEmail(session.user.email);
            fetchProfile(session.user.id);
        });
    }, []);

    const fetchProfile = async (id) => {
        try {
            const res = await axios.get(`/api/profiles/${id}`);
            setProfile(res.data);
            setDisplayName(res.data.display_name || '');
            setUsername(res.data.username || '');
        } catch (e) { console.error(e); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await axios.put(`/api/profiles/${user.id}`, {
                display_name: displayName,
                username: username
            });
            setProfile(res.data);
            setSuccessMsg('Profil berhasil diperbarui!');
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Gagal memperbarui profil.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAccount = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const updates = { email };
            if (password) updates.password = password;

            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;
            setSuccessMsg('Akun berhasil diperbarui!');
            setPassword('');
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => await supabase.auth.signOut();

    return (
        <div className="platform-body" style={{ minHeight: '100vh' }}>
            <Navbar user={user} profile={profile} handleLogout={handleLogout} />

            <div className="layout-wrapper">
                <Sidebar />
                
                <main className="main-feed">
                    <header style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Setelan Akun</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Kelola identitas, keamanan, dan preferensi Ambali Anda.</p>
                    </header>

                    {(successMsg || errorMsg) && (
                        <div style={{ 
                            padding: '16px 20px', 
                            borderRadius: '16px', 
                            marginBottom: '32px',
                            background: successMsg ? 'rgba(52, 211, 153, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            color: successMsg ? '#34d399' : 'var(--accent-rose)',
                            border: `1px solid ${successMsg ? 'rgba(52, 211, 153, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {successMsg ? <CheckCircle size={20} /> : <Shield size={20} />}
                            {successMsg || errorMsg}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '32px' }}>
                        {/* Identitas Section */}
                        <section className="glass-panel" style={{ borderRadius: '28px', padding: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px', color: 'var(--accent-purple)' }}>
                                <User size={24} />
                                <h2 style={{ fontSize: '1.5rem' }}>Identitas Kreator</h2>
                            </div>
                            
                            <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                <div style={{ display: 'flex', gap: '32px', marginBottom: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--gradient-premium)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                        {profile?.display_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile?.display_name}</div>
                                        <div style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>@{profile?.username}</div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Nama Tampilan</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="text" className="post-input" style={{ paddingLeft: '48px' }} value={displayName} onChange={e => setDisplayName(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Username Unik (@)</label>
                                    <div style={{ position: 'relative' }}>
                                        <AtSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="text" className="post-input" style={{ paddingLeft: '48px' }} value={username} onChange={e => setUsername(e.target.value.toLowerCase().trim())} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Username ini digunakan orang lain untuk mencari profil Anda.</p>
                                </div>

                                <button type="submit" className="btn-premium" style={{ width: 'fit-content', padding: '12px 32px' }} disabled={loading}>
                                    {loading ? 'Menyimpan...' : 'Update Profil'}
                                </button>
                            </form>
                        </section>

                        {/* Akun & Keamanan Section */}
                        <section className="glass-panel" style={{ borderRadius: '28px', padding: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px', color: 'var(--accent-rose)' }}>
                                <Lock size={24} />
                                <h2 style={{ fontSize: '1.5rem' }}>Akun & Keamanan</h2>
                            </div>
                            
                            <form onSubmit={handleUpdateAccount} style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Alamat Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="email" className="post-input" style={{ paddingLeft: '48px' }} value={email} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Password Baru (Kosongkan jika tidak ingin ganti)</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="password" placeholder="••••••••" className="post-input" style={{ paddingLeft: '48px' }} value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                </div>

                                <button type="submit" className="btn-secondary" style={{ width: 'fit-content', padding: '12px 32px' }} disabled={loading}>
                                    {loading ? 'Memproses...' : 'Simpan Perubahan Akun'}
                                </button>
                            </form>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
