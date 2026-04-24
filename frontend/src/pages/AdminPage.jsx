import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const ADMIN_EMAIL = 'admin@gmail.com';

export default function AdminPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({ totalPosts: 0, totalUsers: 0, totalComments: 0, totalLikes: 0 });
    const [activeTab, setActiveTab] = useState('posts');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPremium, setFilterPremium] = useState('all');

    // Edit Modal State
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editLink, setEditLink] = useState('');
    const [editPremium, setEditPremium] = useState(false);

    // Comment Panel State
    const [viewingComments, setViewingComments] = useState(null);
    const [postComments, setPostComments] = useState([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            if (!u || u.email !== ADMIN_EMAIL) {
                navigate('/creators');
                return;
            }
            fetchAll(u.email);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            if (!u || u.email !== ADMIN_EMAIL) navigate('/creators');
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const fetchAll = async (email) => {
        setLoading(true);
        try {
            const [postsRes, statsRes] = await Promise.all([
                axios.get(`/api/admin/posts?email=${email}`),
                axios.get(`/api/admin/stats?email=${email}`)
            ]);
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
            setStats(statsRes.data || {});
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('⚠️ Hapus postingan ini? Semua komentar & likes terkait juga akan dihapus.')) return;
        try {
            await axios.delete(`/api/posts/${postId}`, { data: { email: ADMIN_EMAIL, user_id: user.id } });
            setPosts(prev => prev.filter(p => p.id !== postId));
            setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
        } catch (err) {
            alert('Gagal menghapus: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditSave = async () => {
        try {
            const res = await axios.put(`/api/posts/${editingPost.id}`, {
                content: editContent,
                google_drive_link: editLink,
                is_premium: editPremium,
                email: ADMIN_EMAIL,
                user_id: user.id
            });
            setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: res.data.content, google_drive_link: res.data.google_drive_link, is_premium: res.data.is_premium } : p));
            setEditingPost(null);
        } catch (err) {
            alert('Gagal update: ' + (err.response?.data?.error || err.message));
        }
    };

    const openComments = async (post) => {
        if (viewingComments?.id === post.id) { setViewingComments(null); return; }
        setViewingComments(post);
        const res = await axios.get(`/api/posts/${post.id}/comments`);
        setPostComments(res.data);
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Hapus komentar ini?')) return;
        try {
            await axios.delete(`/api/admin/comments/${commentId}`, { data: { email: ADMIN_EMAIL } });
            setPostComments(prev => prev.filter(c => c.id !== commentId));
            setPosts(prev => prev.map(p => p.id === viewingComments.id ? { ...p, comments_count: p.comments_count - 1 } : p));
        } catch (err) {
            alert('Gagal hapus komentar');
        }
    };

    const filteredPosts = posts.filter(p => {
        const matchSearch = searchQuery === '' ||
            p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = filterPremium === 'all' ||
            (filterPremium === 'premium' && p.is_premium) ||
            (filterPremium === 'free' && !p.is_premium);
        return matchSearch && matchFilter;
    });

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 100%)' }}>
            <div style={{ textAlign: 'center', color: '#e0c97b' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px', animation: 'spin 1s linear infinite' }}>⚙️</div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem' }}>Memuat Admin Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 100%)', fontFamily: 'Outfit, sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                
                .admin-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid rgba(224,201,123,0.15);
                    border-radius: 16px;
                    padding: 24px;
                    transition: border-color 0.3s ease, transform 0.2s ease;
                }
                .admin-card:hover { border-color: rgba(224,201,123,0.35); transform: translateY(-2px); }
                
                .stat-card {
                    background: linear-gradient(135deg, rgba(224,201,123,0.08) 0%, rgba(224,201,123,0.02) 100%);
                    border: 1px solid rgba(224,201,123,0.2);
                    border-radius: 16px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    cursor: default;
                }
                .stat-card:hover { background: linear-gradient(135deg, rgba(224,201,123,0.15) 0%, rgba(224,201,123,0.05) 100%); transform: translateY(-3px); box-shadow: 0 10px 40px rgba(224,201,123,0.15); }
                
                .admin-table { width: 100%; border-collapse: collapse; }
                .admin-table th { padding: 12px 16px; text-align: left; background: rgba(224,201,123,0.08); color: #e0c97b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
                .admin-table th:first-child { border-radius: 10px 0 0 10px; }
                .admin-table th:last-child { border-radius: 0 10px 10px 0; }
                .admin-table td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #e0e0e0; vertical-align: middle; }
                .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
                .admin-table tr:last-child td { border-bottom: none; }
                
                .btn-admin-edit { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 0.8rem; font-family: Outfit, sans-serif; transition: all 0.2s; }
                .btn-admin-edit:hover { background: rgba(59,130,246,0.3); border-color: #60a5fa; }
                
                .btn-admin-delete { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 0.8rem; font-family: Outfit, sans-serif; transition: all 0.2s; }
                .btn-admin-delete:hover { background: rgba(239,68,68,0.25); border-color: #f87171; }
                
                .btn-admin-view { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.25); border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 0.8rem; font-family: Outfit, sans-serif; transition: all 0.2s; }
                .btn-admin-view:hover { background: rgba(16,185,129,0.25); border-color: #34d399; }
                
                .admin-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(224,201,123,0.2); border-radius: 10px; padding: 10px 15px; color: #fff; font-size: 0.9rem; font-family: Outfit, sans-serif; outline: none; transition: border-color 0.3s; }
                .admin-input:focus { border-color: rgba(224,201,123,0.6); }
                
                .tab-btn { padding: 10px 24px; border-radius: 10px; border: none; cursor: pointer; font-family: Outfit, sans-serif; font-size: 0.9rem; font-weight: 500; transition: all 0.3s; }
                .tab-active { background: linear-gradient(135deg, #e0c97b, #f0d98b); color: #000; box-shadow: 0 4px 20px rgba(224,201,123,0.4); }
                .tab-inactive { background: rgba(255,255,255,0.05); color: #888; }
                .tab-inactive:hover { background: rgba(255,255,255,0.09); color: #ccc; }
                
                .badge-premium { background: linear-gradient(135deg, #e0c97b, #f0c040); color: #000; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
                .badge-free { background: rgba(107,114,128,0.3); color: #9ca3af; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
                .badge-admin { background: linear-gradient(135deg, #dc2626, #991b1b); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; animation: pulse-red 2s ease-in-out infinite; }
                
                @keyframes pulse-red { 0%,100%{ box-shadow: 0 0 0 0 rgba(220,38,38,0.4); } 50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                .admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(10px); }
                .admin-modal { background: linear-gradient(135deg, #0f1117 0%, #0a0d14 100%); border: 1px solid rgba(224,201,123,0.25); border-radius: 20px; padding: 36px; width: 520px; max-width: 95vw; }
                
                .comment-row { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
                
                .admin-search-bar { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 16px; color: #fff; font-family: Outfit, sans-serif; font-size: 0.9rem; outline: none; width: 280px; transition: border-color 0.3s; }
                .admin-search-bar:focus { border-color: rgba(224,201,123,0.5); }
                .admin-search-bar::placeholder { color: #555; }
                
                .filter-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #ccc; font-family: Outfit, sans-serif; font-size: 0.85rem; outline: none; cursor: pointer; }
                .filter-select option { background: #111; }

                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(224,201,123,0.3); border-radius: 3px; }
            `}</style>

            {/* Edit Post Modal */}
            {editingPost && (
                <div className="admin-modal-overlay" onClick={() => setEditingPost(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <span style={{ fontSize: '1.5rem' }}>✏️</span>
                            <div>
                                <h2 style={{ color: '#fff', fontSize: '1.3rem', margin: 0 }}>Edit Konten</h2>
                                <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>Oleh: {editingPost.user_name}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Deskripsi</label>
                                <textarea
                                    className="admin-input"
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                                    placeholder="Deskripsi konten..."
                                />
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Link Video / Media</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={editLink}
                                    onChange={e => setEditLink(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                    placeholder="https://..."
                                />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', cursor: 'pointer', background: 'rgba(224,201,123,0.05)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(224,201,123,0.1)' }}>
                                <input type="checkbox" checked={editPremium} onChange={e => setEditPremium(e.target.checked)} />
                                <span>Konten Eksklusif (Premium/Berbayar)</span>
                                <span className="badge-premium" style={{ marginLeft: 'auto' }}>PREMIUM</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={handleEditSave}
                                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #e0c97b, #f0d98b)', color: '#000', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                            >
                                💾 Simpan Perubahan
                            </button>
                            <button
                                onClick={() => setEditingPost(null)}
                                style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav style={{ background: 'rgba(10,10,26,0.95)', borderBottom: '1px solid rgba(224,201,123,0.15)', padding: '0 32px', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.3rem', color: '#fff', letterSpacing: '-0.5px' }}>
                        Ambali<span style={{ color: '#e0c97b' }}>.</span><span style={{ color: '#e0c97b', fontSize: '0.9rem' }}>Admin</span>
                    </span>
                    <span className="badge-admin">SUPER ADMIN</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>👤 {user?.email}</span>
                    <Link to="/creators" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                        onMouseOut={e => { e.target.style.color = '#888'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        ← Kembali ke User View
                    </Link>
                    <button
                        onClick={async () => { await supabase.auth.signOut(); navigate('/creators'); }}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>
                        🛡️ Admin Control Center
                    </h1>
                    <p style={{ color: '#666', marginTop: '6px', fontSize: '0.95rem' }}>
                        Kelola seluruh konten platform Ambali secara penuh. CRUD access untuk semua user content.
                    </p>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Postingan', value: stats.totalPosts ?? 0, icon: '📄', color: '#60a5fa' },
                        { label: 'Total Pengguna', value: stats.totalUsers ?? 0, icon: '👥', color: '#34d399' },
                        { label: 'Total Komentar', value: stats.totalComments ?? 0, icon: '💬', color: '#a78bfa' },
                        { label: 'Total Likes', value: stats.totalLikes ?? 0, icon: '❤️', color: '#f87171' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card">
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{s.icon}</div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value?.toLocaleString()}</div>
                            <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '6px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <button className={`tab-btn ${activeTab === 'posts' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setActiveTab('posts')}>
                        📄 Manajemen Postingan ({posts.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'overview' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setActiveTab('overview')}>
                        📊 Overview
                    </button>
                </div>

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div className="admin-card">
                        {/* Filter Bar */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                className="admin-search-bar"
                                placeholder="🔍 Cari konten atau nama kreator..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <select className="filter-select" value={filterPremium} onChange={e => setFilterPremium(e.target.value)}>
                                <option value="all">Semua Tipe</option>
                                <option value="premium">Premium Saja</option>
                                <option value="free">Gratis Saja</option>
                            </select>
                            <div style={{ marginLeft: 'auto', color: '#555', fontSize: '0.85rem' }}>
                                {filteredPosts.length} dari {posts.length} postingan
                            </div>
                            <button
                                onClick={() => fetchAll(user.email)}
                                style={{ padding: '10px 18px', background: 'rgba(224,201,123,0.1)', color: '#e0c97b', border: '1px solid rgba(224,201,123,0.2)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem', transition: 'all 0.2s' }}
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '50px' }}>#</th>
                                        <th style={{ minWidth: '180px' }}>Kreator</th>
                                        <th style={{ minWidth: '250px' }}>Konten</th>
                                        <th style={{ minWidth: '100px' }}>Tipe</th>
                                        <th style={{ minWidth: '80px' }}>❤️ Likes</th>
                                        <th style={{ minWidth: '80px' }}>💬 Komentar</th>
                                        <th style={{ minWidth: '120px' }}>Tanggal</th>
                                        <th style={{ minWidth: '200px' }}>Aksi Admin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPosts.map((post, idx) => (
                                        <>
                                            <tr key={post.id}>
                                                <td style={{ color: '#555', fontSize: '0.85rem' }}>{idx + 1}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `hsl(${(post.user_name?.charCodeAt(0) || 0) * 15}, 60%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                                                            {(post.user_name || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#ddd', fontWeight: '500', fontSize: '0.9rem' }}>{post.user_name}</div>
                                                            <div style={{ color: '#555', fontSize: '0.75rem' }}>@{(post.user_name || '').toLowerCase().replace(/\s/g, '')}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                                        {post.content || <span style={{ color: '#444', fontStyle: 'italic' }}>Tidak ada deskripsi</span>}
                                                    </p>
                                                    {post.google_drive_link && (
                                                        <a href={post.google_drive_link} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.75rem', display: 'block', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                                            🔗 {post.google_drive_link.substring(0, 45)}...
                                                        </a>
                                                    )}
                                                </td>
                                                <td>
                                                    {post.is_premium
                                                        ? <span className="badge-premium">PREMIUM</span>
                                                        : <span className="badge-free">GRATIS</span>
                                                    }
                                                </td>
                                                <td style={{ color: '#f87171', fontWeight: '600' }}>{post.likes_count}</td>
                                                <td style={{ color: '#a78bfa', fontWeight: '600' }}>{post.comments_count}</td>
                                                <td style={{ color: '#666', fontSize: '0.82rem' }}>
                                                    {new Date(post.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        <button
                                                            className="btn-admin-edit"
                                                            onClick={() => { setEditingPost(post); setEditContent(post.content); setEditLink(post.google_drive_link); setEditPremium(post.is_premium); }}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            className="btn-admin-view"
                                                            onClick={() => openComments(post)}
                                                        >
                                                            💬 Komentar
                                                        </button>
                                                        <button
                                                            className="btn-admin-delete"
                                                            onClick={() => handleDelete(post.id)}
                                                        >
                                                            🗑️ Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Comment Panel (inline expand) */}
                                            {viewingComments?.id === post.id && (
                                                <tr key={`comments-${post.id}`}>
                                                    <td colSpan={8} style={{ padding: '0 16px 20px' }}>
                                                        <div style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.1)', borderRadius: '12px', padding: '20px', marginTop: '4px' }}>
                                                            <h4 style={{ color: '#a78bfa', fontSize: '0.9rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                                💬 Komentar pada postingan ini ({postComments.length})
                                                            </h4>
                                                            {postComments.length === 0
                                                                ? <p style={{ color: '#555', fontSize: '0.85rem' }}>Belum ada komentar.</p>
                                                                : postComments.map(c => (
                                                                    <div key={c.id} className="comment-row">
                                                                        <div>
                                                                            <span style={{ color: '#ddd', fontWeight: '600', fontSize: '0.85rem' }}>{c.user_name}</span>
                                                                            <p style={{ color: '#888', fontSize: '0.85rem', margin: '3px 0 0' }}>{c.content}</p>
                                                                            <span style={{ color: '#444', fontSize: '0.75rem' }}>{new Date(c.created_at).toLocaleString('id-ID')}</span>
                                                                        </div>
                                                                        <button className="btn-admin-delete" onClick={() => handleDeleteComment(c.id)} style={{ flexShrink: 0 }}>
                                                                            🗑️ Hapus
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                            {filteredPosts.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                                    <p>Tidak ada postingan yang cocok.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="admin-card">
                            <h3 style={{ color: '#e0c97b', marginBottom: '16px', fontSize: '1rem' }}>📊 Ringkasan Platform</h3>
                            {[
                                { label: 'Total Konten Diunggah', val: stats.totalPosts ?? 0 },
                                { label: 'Pengguna Terdaftar', val: stats.totalUsers ?? 0 },
                                { label: 'Engagement (Komentar)', val: stats.totalComments ?? 0 },
                                { label: 'Total Apresiasi (Like)', val: stats.totalLikes ?? 0 },
                                { label: 'Konten Premium', val: posts.filter(p => p.is_premium).length },
                                { label: 'Konten Gratis', val: posts.filter(p => !p.is_premium).length },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <span style={{ color: '#888', fontSize: '0.9rem' }}>{item.label}</span>
                                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{item.val.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="admin-card">
                            <h3 style={{ color: '#e0c97b', marginBottom: '16px', fontSize: '1rem' }}>🛡️ Akses Admin</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { icon: '✏️', title: 'Edit Semua Konten', desc: 'Ubah deskripsi, link media, dan status premium konten manapun.' },
                                    { icon: '🗑️', title: 'Hapus Konten', desc: 'Hapus postingan beserta semua komentar dan likes terkait.' },
                                    { icon: '💬', title: 'Moderasi Komentar', desc: 'Hapus komentar tidak layak dari postingan manapun.' },
                                    { icon: '📊', title: 'Statistik Real-time', desc: 'Monitor statistik platform secara langsung.' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <span>{item.icon}</span>
                                            <span style={{ color: '#ddd', fontWeight: '600', fontSize: '0.9rem' }}>{item.title}</span>
                                        </div>
                                        <p style={{ color: '#555', fontSize: '0.82rem', margin: 0, paddingLeft: '26px' }}>{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
