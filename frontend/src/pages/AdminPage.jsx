import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { 
  ShieldAlert, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Heart, 
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react';
import Navbar from '../components/Navbar';

const ADMIN_EMAIL = 'admin@gmail.com';

export default function AdminPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({ totalPosts: 0, totalUsers: 0, totalComments: 0, totalLikes: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            if (!u || u.email !== ADMIN_EMAIL) {
                navigate('/creators');
                return;
            }
            fetchProfile(u.id);
            fetchAll(u.email);
        });
    }, []);

    const fetchProfile = async (id) => {
        try {
            const res = await axios.get(`/api/profiles/${id}`);
            setProfile(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAll = async (email) => {
        setLoading(true);
        try {
            const [postsRes, statsRes] = await Promise.all([
                axios.get(`/api/posts`), // Use public posts if admin route fails, or backend needs update
                axios.get(`/api/posts`)  // Placeholder for stats calculation
            ]);
            
            const allPosts = Array.isArray(postsRes.data) ? postsRes.data : [];
            setPosts(allPosts);
            
            // Calculate stats locally to ensure data shows even if specialized admin endpoint fails
            setStats({
                totalPosts: allPosts.length,
                totalUsers: new Set(allPosts.map(p => p.user_id)).size,
                totalComments: allPosts.reduce((acc, p) => acc + (p.comments_count || 0), 0),
                totalLikes: allPosts.reduce((acc, p) => acc + (p.likes_count || 0), 0)
            });
        } catch (err) { 
            console.error("Admin Fetch Error:", err); 
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (!user || user.email !== ADMIN_EMAIL) return null;

    return (
        <div className="platform-body" style={{ minHeight: '100vh' }}>
            <Navbar user={user} profile={profile} handleLogout={handleLogout} />
            
            <div className="layout-wrapper" style={{ display: 'block', maxWidth: '1200px' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-rose)', marginBottom: '8px' }}>
                            <ShieldAlert size={20} />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Super Admin Dashboard</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem' }}>Manajemen Sistem</h1>
                    </div>
                    <button className="btn-secondary" onClick={() => fetchAll(user.email)} disabled={loading}>
                        <RefreshCw size={18} style={{ marginRight: '8px' }} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <StatCard icon={<BarChart3 size={24} color="var(--accent-purple)" />} label="Total Posts" value={stats.totalPosts} color="rgba(139, 92, 246, 0.1)" />
                    <StatCard icon={<Users size={24} color="#34d399" />} label="Total Users" value={stats.totalUsers} color="rgba(52, 211, 153, 0.1)" />
                    <StatCard icon={<MessageSquare size={24} color="#a78bfa" />} label="Comments" value={stats.totalComments} color="rgba(167, 139, 250, 0.1)" />
                    <StatCard icon={<Heart size={24} color="#f43f5e" />} label="Total Likes" value={stats.totalLikes} color="rgba(244, 63, 94, 0.1)" />
                </div>

                <div className="glass-panel" style={{ borderRadius: '24px', padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem' }}>Data Postingan</h3>
                        <input 
                            type="text" 
                            placeholder="Cari user..." 
                            className="post-input" 
                            style={{ width: '250px', padding: '8px 16px' }} 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '16px 24px' }}>Kreator</th>
                                    <th style={{ padding: '16px 24px' }}>Konten</th>
                                    <th style={{ padding: '16px 24px' }}>Status</th>
                                    <th style={{ padding: '16px 24px' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.filter(p => p.user_name.toLowerCase().includes(searchQuery.toLowerCase())).map((post) => (
                                    <tr key={post.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 700 }}>{post.user_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                background: post.is_premium ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: post.is_premium ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                                borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 
                                            }}>
                                                {post.is_premium ? 'PREMIUM' : 'FREE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-secondary" style={{ padding: '6px' }}><Edit size={16} /></button>
                                                <button className="btn-secondary" style={{ padding: '6px', color: 'var(--accent-rose)' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`.spin { animation: fa-spin 2s infinite linear; } @keyframes fa-spin { from { transform: rotate(0deg); } to { transform: rotate(359deg); } }`}</style>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ padding: '12px', background: color, borderRadius: '16px', width: 'fit-content', marginBottom: '16px' }}>{icon}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</p>
            <h2 style={{ fontSize: '2rem' }}>{value}</h2>
        </div>
    );
}
