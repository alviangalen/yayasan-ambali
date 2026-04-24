import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Edit3, Trash2, Video, Lock, Unlock, ArrowLeft } from 'lucide-react';

export default function StudioPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editLink, setEditLink] = useState('');
    const [editPremium, setEditPremium] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchMyPosts(session.user.id);
            }
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchMyPosts(session.user.id);
            }
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    const fetchProfile = async (id) => {
        try {
            const res = await axios.get(`/api/profiles/${id}`);
            setProfile(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMyPosts = async (uid) => {
        try {
            const res = await axios.get(`/api/posts?user_id=${uid}`);
            setPosts(res.data.filter(p => p.user_id === uid));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm("Hapus konten ini selamanya?")) return;
        try {
            await axios.delete(`/api/posts/${postId}`, { data: { user_id: user.id } });
            setPosts(posts.filter(p => p.id !== postId));
            alert("Terhapus!");
        } catch (e) { alert('Gagal.'); }
    };

    const handleEditSave = async () => {
        try {
            const res = await axios.put(`/api/posts/${editingPost.id}`, {
                content: editContent,
                google_drive_link: editLink,
                is_premium: editPremium,
                user_id: user.id
            });
            setPosts(posts.map(p => p.id === editingPost.id ? { 
                ...p, content: res.data.content, google_drive_link: res.data.google_drive_link, is_premium: res.data.is_premium 
            } : p));
            setEditingPost(null);
            alert("Berhasil diperbarui!");
        } catch (e) { alert('Gagal.'); }
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('/view')) return url.replace('/view', '/preview');
        return url;
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (!user) return <AuthModal onLoginSuccess={(u) => {setUser(u); fetchMyPosts(u.id);}} />;

    return (
        <div className="platform-body" style={{ minHeight: '100vh' }}>
            <Navbar user={user} profile={profile} handleLogout={handleLogout} />

            {editingPost && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditingPost(null)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '10px' }}>Edit Konten</h2>
                        <textarea className="post-input" value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', height: '100px', marginBottom: '15px' }} />
                        <input type="text" className="post-input" value={editLink} onChange={e => setEditLink(e.target.value)} style={{ width: '100%', marginBottom: '15px' }} />
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={editPremium} onChange={e => setEditPremium(e.target.checked)} />
                            <span>Eksklusif (Premium)</span>
                        </label>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-premium" onClick={handleEditSave} style={{ flex: 1 }}>Simpan</button>
                            <button className="btn-secondary" onClick={() => setEditingPost(null)} style={{ flex: 1 }}>Batal</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="layout-wrapper">
                <Sidebar />
                
                <main className="main-feed">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px' }}>
                        <Link to="/creators" className="btn-secondary" style={{ padding: '10px' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 style={{ fontSize: '2rem' }}>Studio Manajemen</h1>
                    </div>

                    <div style={{ display: 'grid', gap: '20px' }}>
                        {posts.length === 0 && (
                          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', borderRadius: '24px' }}>
                            <Video size={48} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Belum ada konten.</p>
                          </div>
                        )}
                        
                        {posts.map((post) => (
                            <div key={post.id} className="glass-panel" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', borderRadius: '24px' }}>
                                <div style={{ width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                                    <iframe src={getEmbedUrl(post.google_drive_link)} style={{ width: '100%', height: '100%', border: 'none' }} scrolling="no"></iframe>
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {post.is_premium ? <Lock size={14} color="var(--accent-gold)" /> : <Unlock size={14} color="var(--text-muted)" />}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => {
                                                setEditingPost(post); setEditContent(post.content); setEditLink(post.google_drive_link); setEditPremium(post.is_premium);
                                            }}><Edit3 size={16} /></button>
                                            <button className="btn-secondary" style={{ padding: '8px', borderRadius: '10px', color: 'var(--accent-rose)' }} onClick={() => handleDelete(post.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <p style={{ fontWeight: 600 }}>{post.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
