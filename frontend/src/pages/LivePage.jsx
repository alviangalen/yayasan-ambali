import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import Sidebar from '../components/Sidebar';
import { Users, Radio } from 'lucide-react';

export default function LivePage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
        });
    }, []);

    const fetchProfile = async (id) => {
        try {
            const res = await axios.get(`/api/profiles/${id}`);
            setProfile(res.data);
        } catch (e) { console.error(e); }
    };

    const handleLogout = async () => await supabase.auth.signOut();

    return (
        <div className="platform-body" style={{ minHeight: '100vh' }}>
            <Navbar user={user} profile={profile} handleLogout={handleLogout} />
            {!user && <AuthModal onLoginSuccess={u => setUser(u)} />}

            <div className="layout-wrapper">
                <Sidebar />
                
                <main className="main-feed">
                    <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-rose)', marginBottom: '8px' }}>
                                <Radio size={20} className="pulse" />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Now</span>
                            </div>
                            <h1 style={{ fontSize: '2.5rem' }}>Eksplorasi Live</h1>
                        </div>
                        <button className="btn-premium">Mulai Streaming</button>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-panel" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                                    <img src={`https://picsum.photos/seed/${i + 10}/800/450`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="live" />
                                    <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'var(--accent-rose)', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>LIVE</div>
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Users size={14} /> {Math.floor(Math.random() * 1000) + 100}
                                    </div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--gradient-premium)' }}></div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Belajar Coding Premium #{i}</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Kreator Edukasi Ambali</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <style>{`
                .pulse { animation: pulse-red 2s infinite; }
                @keyframes pulse-red {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
