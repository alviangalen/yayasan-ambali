import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';

export default function StudioPage() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    
    // Modal State
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editLink, setEditLink] = useState('');
    const [editPremium, setEditPremium] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchMyPosts(session.user.id);
        });
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchMyPosts(session.user.id);
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    const fetchMyPosts = async (uid) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/posts?user_id=${uid}`);
            setPosts(res.data.filter(p => p.user_id === uid)); // Filter locally as safety measure
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm("Yakin ingin menghapus postingan ini selamanya? \nSeluruh rekam data (komentar/likes) akan hancur.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/posts/${postId}`, { data: { user_id: user.id } });
            setPosts(posts.filter(p => p.id !== postId));
            alert("Video/Postingan sukses dihapus!");
        } catch (e) {
            alert('Gagal menghapus: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleEditSave = async () => {
        try {
            const res = await axios.put(`http://localhost:5000/api/posts/${editingPost.id}`, {
                content: editContent,
                google_drive_link: editLink,
                is_premium: editPremium,
                user_id: user.id
            });
            setPosts(posts.map(p => p.id === editingPost.id ? { 
                ...p, 
                content: res.data.content, 
                google_drive_link: res.data.google_drive_link, 
                is_premium: res.data.is_premium 
            } : p));
            setEditingPost(null);
            alert("Konten berhasil diperbarui!");
        } catch (e) {
            alert('Gagal update: ' + (e.response?.data?.error || e.message));
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        if (url.includes('/view')) return url.replace('/view', '/preview');
        return url;
    };

    if (!user) return <AuthModal onLoginSuccess={(u) => {setUser(u); fetchMyPosts(u.id);}} />;

    return (
        <div className="platform-body">
            {editingPost && (
                <div className="modal-overlay" onClick={() => setEditingPost(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{textAlign: 'left'}}>
                        <h2>Edit Konten</h2>
                        <p style={{color: 'gray', marginBottom: '10px'}}>Perbarui judul / link Drive Anda</p>
                        
                        <input type="text" placeholder="Deskripsi materi..." value={editContent} onChange={e => setEditContent(e.target.value)} style={{width: '100%', marginBottom: '10px'}} />
                        <input type="text" placeholder="Link Google Drive Original" value={editLink} onChange={e => setEditLink(e.target.value)} style={{width: '100%', marginBottom: '10px'}} />
                        
                        <label style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'white'}}>
                            <input type="checkbox" checked={editPremium} onChange={e => setEditPremium(e.target.checked)} />
                            Paywall Eksklusif (Hanya untuk Subshribers)
                        </label>
                        
                        <button className="btn-primary" onClick={handleEditSave} style={{width: '100%'}}>Simpan Perubahan</button>
                    </div>
                </div>
            )}

            <nav className="navbar platform-nav">
                <div className="logo"><Link to="/creators" className="no-style">Ambali<span className="dot">.</span><span className="badge">Studio</span></Link></div>
                <div className="nav-right">
                    <Link to="/creators" className="btn-secondary">Kembali Beranda EduFans</Link>
                </div>
            </nav>

            <div className="platform-container">
                <main className="feed" style={{marginLeft: 'auto', marginRight: 'auto', flex: 1}}>
                    <h2 style={{color: 'white', marginBottom: '20px', fontFamily: 'Outfit'}}>Manajemen Konten Saya</h2>
                    {posts.length === 0 && <p style={{color: 'gray'}}>Anda belum mengunggah konten apapun di sini.</p>}

                    {posts.map((post) => (
                        <div key={post.id} className="post-card glass-panel fade-up visible">
                            <div className="post-header" style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px'}}>
                                <div>
                                    <p style={{color: 'gray', fontSize: '0.9rem'}}>{new Date(post.created_at).toLocaleDateString()}</p>
                                    {post.is_premium ? (
                                        <span className="badge" style={{background: 'var(--accent-gold)', color: '#000', padding: '3px 8px', borderRadius: '5px', fontSize: '0.7rem'}}>PREMIUM</span>
                                    ) : (
                                        <span className="badge" style={{background: '#888', color: '#fff', padding: '3px 8px', borderRadius: '5px', fontSize: '0.7rem'}}>GRATIS</span>
                                    )}
                                </div>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <button className="btn-secondary" style={{padding: '5px 15px', background: 'rgba(255,255,255,0.1)'}} onClick={() => {
                                        setEditingPost(post); setEditContent(post.content); setEditLink(post.google_drive_link); setEditPremium(post.is_premium);
                                    }}>Edit</button>
                                    
                                    <button className="btn-secondary" style={{padding: '5px 15px', background: 'rgba(255,50,50,0.1)', color: '#ff6666', border: '1px solid rgba(255,50,50,0.3)'}} onClick={() => handleDelete(post.id)}>Hapus</button>
                                </div>
                            </div>
                            
                            <div className="post-content" style={{marginTop: '15px'}}>
                                <p>{post.content}</p>
                                <div className="video-embed" style={{marginTop: '10px', height: '150px'}}>
                                    <iframe src={getEmbedUrl(post.google_drive_link)} allow="autoplay" allowFullScreen style={{height: '100%', width: '100%', objectFit: 'cover'}}></iframe>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
}
