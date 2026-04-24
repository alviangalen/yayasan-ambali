import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Shield, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

function LandingPage() {
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
        } catch (err) { console.error(err); }
    };

    const handleLogout = async () => await supabase.auth.signOut();

    return (
        <div className="landing-wrapper">
            <Navbar user={user} profile={profile} handleLogout={handleLogout} />
            
            {/* Hero Section */}
            <header style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                padding: '0 20px'
            }}>
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 204, 0, 0.1) 0%, transparent 50%)',
                    zIndex: -1 
                }}></div>
                
                <div style={{ maxWidth: '1000px', textAlign: 'center' }} className="fade-up">
                    <h1 style={{ 
                        fontSize: 'clamp(3rem, 8vw, 5.5rem)', 
                        lineHeight: 1, 
                        letterSpacing: '-0.02em',
                        marginBottom: '24px'
                    }}>
                        Kesetaraan. <br />
                        <span style={{ background: 'var(--gradient-premium)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pemberdayaan.</span> Harapan.
                    </h1>
                    
                    <p style={{ 
                        fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', 
                        color: 'var(--text-secondary)', 
                        maxWidth: '700px', 
                        margin: '0 auto 48px',
                        lineHeight: 1.6
                    }}>
                        Yayasan Ambali hadir untuk memberikan perlindungan dan dukungan tanpa batas bagi kaum tunawisma serta komunitas yang berjuang melawan diskriminasi.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/creators" className="btn-premium" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                            Mulai Menjelajah <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </Link>
                        <a href="#about" className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                            Misi Kami
                        </a>
                    </div>
                </div>
            </header>

            {/* Stats / Proof Section */}
            <section id="about" style={{ padding: '100px 20px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '3rem', marginBottom: '24px', lineHeight: 1.1 }}>
                                Berdiri Bersama, <span style={{ color: 'var(--accent-gold)' }}>Melawan Diskriminasi</span>
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '32px' }}>
                                Diskriminasi telah meminggirkan banyak saudara kita. Kami menyediakan tempat berlindung, bantuan kebutuhan dasar, hingga pelatihan vokasi bagi mereka yang paling membutuhkan.
                            </p>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px' }}>
                                        <Users size={24} color="var(--accent-purple)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>5000+</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Terbantu</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '12px', background: 'rgba(255, 204, 0, 0.1)', borderRadius: '16px' }}>
                                        <Heart size={24} color="var(--accent-gold)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>1200+</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kreator</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px', transform: 'translateY(20px)' }}>
                                <Shield size={32} color="var(--accent-purple)" style={{ marginBottom: '16px' }} />
                                <h3>Perlindungan</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tempat aman bagi mereka yang kehilangan harapan.</p>
                            </div>
                            <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px' }}>
                                <Sparkles size={32} color="var(--accent-gold)" style={{ marginBottom: '16px' }} />
                                <h3>Vokasi</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Pelatihan keahlian untuk masa depan mandiri.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer style={{ padding: '60px 20px', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
                <div className="logo" style={{ fontSize: '2rem', marginBottom: '16px' }}>Ambali<span style={{ color: 'var(--accent-purple)' }}>.</span></div>
                <p style={{ color: 'var(--text-muted)' }}>&copy; 2026 Yayasan Ambali. Hak Cipta Dilindungi.</p>
            </footer>
        </div>
    );
}

export default LandingPage;
