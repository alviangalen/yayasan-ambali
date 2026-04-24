import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import Sidebar from '../components/Sidebar';
import { TrendingUp, MessageCircle, Heart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrendingPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [trendingPosts, setTrendingPosts] = useState([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
        });
        fetchTrending();
    }, []);

    const fetchProfile = async (id) => {
        try {
            const res = await axios.get(`/api/profiles/${id}`);
            setProfile(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchTrending = async () => {
        try {
            const res = await axios.get('/api/posts');
            const sorted = res.data.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
            setTrendingPosts(sorted.slice(0, 10));
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
                    <header style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--accent-purple)', marginBottom: '10px' }}>
                            <TrendingUp size={32} />
                            <h1 style={{ fontSize: '2.5rem' }}>Sedang Tren</h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>Konten paling populer dan banyak dibicarakan hari ini.</p>
                    </header>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        {trendingPosts.map((post, idx) => (
                            <Link to="/creators" key={post.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="glass-panel" style={{ display: 'flex', gap: '24px', padding: '24px', borderRadius: '24px', transition: 'transform 0.3s' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--glass-border)', width: '40px' }}>#{idx + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '8px' }}>{post.user_name}</div>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                                        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={16} /> {post.likes_count}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={16} /> {post.comments_count}</span>
                                        </div>
                                    </div>
                                    {post.google_drive_link && (
                                        <div style={{ width: '120px', height: '80px', borderRadius: '12px', background: '#000', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={`https://img.youtube.com/vi/${post.google_drive_link.split('v=')[1]?.split('&')[0]}/0.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
