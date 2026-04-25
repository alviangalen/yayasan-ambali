import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  CheckCircle2, 
  Users, 
  Calendar, 
  AtSign, 
  Heart, 
  MessageCircle,
  Lock,
  DollarSign
} from 'lucide-react';

export default function ProfilePage() {
    const { username } = useParams();
    const [viewer, setViewer] = useState(null);
    const [viewerProfile, setViewerProfile] = useState(null);
    const [creator, setCreator] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setViewer(session?.user ?? null);
            if (session?.user) {
                fetchViewerProfile(session.user.id);
                fetchSubscriptions(session.user.id);
            }
        });
        fetchCreatorProfile();
    }, [username]);

    const fetchViewerProfile = async (id) => {
        try {
            const res = await axios.get(`/api/profiles/${id}`);
            setViewerProfile(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchSubscriptions = async (uid) => {
        try {
            const res = await axios.get(`/api/subscriptions/${uid}`);
            setSubscriptions(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchCreatorProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const cleanUsername = decodeURIComponent(username).trim();
            console.log("Mencari kreator:", cleanUsername);
            const res = await axios.get(`/api/profiles/search/${cleanUsername}`);
            setCreator(res.data);
            fetchCreatorPosts(res.data.id);
        } catch (err) {
            console.error("Error mencari profil:", err.response?.data || err.message);
            setError("Kreator tidak ditemukan.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCreatorPosts = async (uid) => {
        try {
            const res = await axios.get(`/api/posts?target_user_id=${uid}&user_id=${viewer?.id || ''}`);
            setPosts(res.data);
            
            // Auto-scroll to post if ID is in hash
            const postId = window.location.hash.replace('#', '');
            if (postId) {
                setTimeout(() => {
                    const el = document.getElementById(`post-${postId}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        } catch (e) { console.error(e); }
    };

    const handleSubscribe = async () => {
        if (!viewer) return alert("Anda harus login!");
        if (creator.id === viewer.id) return alert("Diri sendiri.");
        if (window.confirm(`Berlangganan ke ${creator.display_name} seharga Rp 50.000?`)) {
            try {
                await axios.post(`/api/subscribe`, { subscriber_id: viewer.id, creator_id: creator.id });
                alert("Berhasil Berlangganan!");
                setSubscriptions([...subscriptions, creator.id]);
                fetchViewerProfile(viewer.id);
            } catch (err) { alert(err.response?.data?.error || "Gagal."); }
        }
    };

    const renderMedia = (url) => {
        if (!url) return null;
        let finalUrl = url;
        let isPortrait = false;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^&?\s]+)/);
            if (match) { finalUrl = `https://www.youtube.com/embed/${match[1]}`; if(url.includes('shorts')) isPortrait=true; }
        } else if (url.includes('tiktok.com')) {
            const match = url.match(/video\/(\d+)/);
            if (match) { finalUrl = `https://www.tiktok.com/embed/v2/${match[1]}`; isPortrait=true; }
        } else if (url.includes('instagram.com')) {
            finalUrl = url.split('?')[0] + 'embed/'; isPortrait=true;
        } else if (finalUrl.includes('/view')) {
            finalUrl = finalUrl.replace('/view', '/preview');
        }
        return (
            <div className={`post-media ${isPortrait ? 'aspect-portrait' : 'aspect-landscape'}`}>
                <iframe src={finalUrl} allowFullScreen></iframe>
            </div>
        );
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (loading) return <div className="platform-body"><Navbar /><div className="layout-wrapper" style={{display:'flex',justifyContent:'center'}}><div className="skeleton" style={{width:'100%',height:'400px',borderRadius:'24px'}}></div></div></div>;
    
    if (error) return (
        <div className="platform-body">
            <Navbar user={viewer} profile={viewerProfile} handleLogout={handleLogout} />
            <div className="layout-wrapper" style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'150px'}}>
                <AtSign size={64} color="var(--text-muted)" style={{marginBottom:'24px'}} />
                <h1 style={{fontSize:'2rem'}}>{error}</h1>
                <Link to="/creators" className="btn-premium" style={{marginTop:'24px'}}>Kembali ke Beranda</Link>
            </div>
        </div>
    );

    const isSubscribed = subscriptions.includes(creator.id);

    return (
        <div className="platform-body" style={{ minHeight: '100vh' }}>
            <Navbar user={viewer} profile={viewerProfile} handleLogout={handleLogout} />

            <div className="layout-wrapper">
                <Sidebar />
                
                <main className="main-feed">
                    {/* Profile Header */}
                    <header className="glass-panel" style={{ borderRadius: '32px', padding: '48px', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '120px', background: 'var(--gradient-premium)', opacity: 0.1 }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '40px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ width: '150px', height: '150px', borderRadius: '40px', background: 'var(--gradient-premium)', fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '6px solid var(--bg-surface)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                                {creator.display_name?.charAt(0)}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h1 style={{ fontSize: '2.5rem' }}>{creator.display_name}</h1>
                                    <CheckCircle2 size={28} color="#1d9bf0" fill="#1d9bf0" />
                                </div>
                                <div style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>@{creator.username}</div>
                                
                                <div style={{ display: 'flex', gap: '32px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} /> <strong>1.2K</strong> Pengikut</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> Bergabung {new Date(creator.id ? parseInt(creator.id.slice(0,8), 16) * 1000 : Date.now()).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {viewer?.id !== creator.id && (
                                    <button 
                                        className={isSubscribed ? "btn-secondary" : "btn-premium"} 
                                        style={{ padding: '12px 32px' }}
                                        onClick={handleSubscribe}
                                    >
                                        {isSubscribed ? 'Berlangganan' : 'Ikuti Kreator'}
                                    </button>
                                )}
                                {viewer?.id === creator.id && (
                                    <Link to="/settings" className="btn-secondary" style={{ padding: '12px 32px' }}>Edit Profil</Link>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Creator's Feed */}
                    <div style={{ display: 'grid', gap: '32px' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Postingan Kreator</h2>
                        {posts.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', borderRadius: '24px' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>Belum ada postingan publik.</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <article key={post.id} id={`post-${post.id}`} className="post-card">
                                    <div style={{ padding: '20px 24px 16px', fontWeight: 500 }}>{post.content}</div>
                                    
                                    {(!post.is_premium || isSubscribed || viewer?.id === creator.id) ? (
                                        renderMedia(post.google_drive_link)
                                    ) : (
                                        <div className="post-media aspect-landscape">
                                            <div className="post-locked-overlay">
                                                <Lock size={40} color="var(--accent-gold)" style={{ marginBottom: '16px' }} />
                                                <p>Konten Eksklusif untuk Pelanggan</p>
                                                <button className="btn-premium" style={{ marginTop: '16px' }} onClick={handleSubscribe}>Buka Sekarang</button>
                                            </div>
                                        </div>
                                    )}

                                    <footer className="post-actions-row">
                                        <div className="action-item"><Heart size={20} /> <span>{post.likes_count}</span></div>
                                        <div className="action-item"><MessageCircle size={20} /> <span>{post.comments_count}</span></div>
                                        <div className="action-item"><DollarSign size={20} /> <span>Tip</span></div>
                                    </footer>
                                </article>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
