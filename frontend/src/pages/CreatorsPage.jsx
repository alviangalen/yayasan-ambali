import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { 
  Heart, 
  MessageCircle, 
  DollarSign, 
  Lock, 
  CheckCircle2, 
  Link as LinkIcon,
  MoreHorizontal,
  Video,
  Globe,
  AtSign,
  Sparkles,
  Share2
} from 'lucide-react';

export default function CreatorsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [mediaLink, setMediaLink] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsData, setCommentsData] = useState([]);
  const [tipPost, setTipPost] = useState(null);
  const [tipAmount, setTipAmount] = useState('');
  
  // Migration States
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const [migrationLoading, setMigrationLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchProfile(session.user.id, session.user.user_metadata?.display_name);
          fetchSubscriptions(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            fetchProfile(session.user.id, session.user.user_metadata?.display_name);
            fetchSubscriptions(session.user.id);
        } else {
            setSubscriptions([]);
            setProfile(null);
            setShowMigrationModal(false);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchSubscriptions = async (uid) => {
      try {
          const res = await axios.get(`/api/subscriptions/${uid}`);
          setSubscriptions(res.data || []);
      } catch (err) { console.error(err); }
  };

  const fetchProfile = async (id, name) => {
      try {
          const res = await axios.get(`/api/profiles/${id}?name=${name || ''}`);
          setProfile(res.data);
          
          // Legacy User Check: If username is missing or default, show migration modal
          if (!res.data.username || res.data.username.startsWith('user_')) {
              setShowMigrationModal(true);
          }
          
          fetchPosts(id);
      } catch (err) { console.error(err); }
  };

  const handleMigrationSubmit = async (e) => {
      e.preventDefault();
      setMigrationLoading(true);
      setMigrationError('');
      
      try {
          const res = await axios.put(`/api/profiles/${user.id}`, {
              username: newUsername.toLowerCase().trim()
          });
          setProfile(res.data);
          setShowMigrationModal(false);
          alert("Username berhasil didaftarkan! Selamat datang di Ambali.");
      } catch (err) {
          setMigrationError(err.response?.data?.error || "Gagal mengupdate username.");
      } finally {
          setMigrationLoading(false);
      }
  };

  const fetchPosts = async (currentUserId = null) => {
    const uid = currentUserId || user?.id;
    setLoadingPosts(true);
    try {
      const url = `/api/posts${uid ? '?user_id='+uid : ''}`;
      const res = await axios.get(url);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setPosts([]);
    }
    setLoadingPosts(false);
  };

  useEffect(() => {
    if (!user) fetchPosts(); 
  }, [user]);

  const handlePostSubmit = async () => {
    if (!mediaLink) return alert("Tautan Video diwajibkan!");
    try {
      await axios.post(`/api/posts`, {
        content,
        google_drive_link: mediaLink,
        user_id: user.id,
        user_name: profile?.display_name || user?.user_metadata?.display_name || user.email.split('@')[0],
        is_premium: isPremium
      });
      setContent(''); setMediaLink(''); setIsPremium(false);
      fetchPosts();
    } catch (err) {
      alert("Gagal mem-posting: " + (err.response?.data?.error || err.message));
    }
  };

  const handleLike = async (post) => {
      if (!user) return alert("Anda harus login untuk memberi Like!");
      try {
          const res = await axios.post(`/api/posts/${post.id}/like`, { user_id: user.id });
          setPosts(posts.map(p => {
              if (p.id === post.id) {
                  return {
                      ...p, 
                      has_liked: res.data.status === 'liked',
                      likes_count: p.likes_count + (res.data.status === 'liked' ? 1 : -1)
                  };
              }
              return p;
          }));
      } catch (err) { alert("Gagal Like"); }
  };

  const handleSubscribe = async (creatorId) => {
      if (!user) return alert("Anda harus login!");
      if (creatorId === user.id) return alert("Diri sendiri.");
      if (window.confirm("Berlangganan seharga Rp 50.000?")) {
          try {
              await axios.post(`/api/subscribe`, { subscriber_id: user.id, creator_id: creatorId });
              alert("Berhasil!");
              setSubscriptions(prev => !prev.includes(creatorId) ? [...prev, creatorId] : prev);
              fetchProfile(user.id);
              fetchSubscriptions(user.id);
          } catch (err) { alert(err.response?.data?.error || "Gagal."); }
      }
  };

  const handleSendTip = async () => {
      if (!tipAmount || tipAmount <= 0) return alert("Nominal tip tidak valid");
      try {
          await axios.post(`/api/tip`, {
              sender_id: user.id,
              receiver_id: tipPost.user_id,
              amount: parseFloat(tipAmount)
          });
          alert(`Berhasil mengirim Tip!`);
          setTipPost(null); setTipAmount(''); fetchProfile(user.id);
      } catch(err) { alert(err.response?.data?.error || "Gagal."); }
  };

  const openComments = async (postId) => {
      if(activeCommentPost === postId) { setActiveCommentPost(null); return; }
      setActiveCommentPost(postId);
      const res = await axios.get(`/api/posts/${postId}/comments`);
      setCommentsData(res.data);
  };

  const submitComment = async (postId) => {
      if (!user) return alert("Login dulu!");
      if (!commentText) return;
      try {
          const res = await axios.post(`/api/posts/${postId}/comments`, {
              user_id: user.id,
              user_name: profile?.display_name || user?.user_metadata?.display_name || user.email.split('@')[0],
              content: commentText
          });
          setCommentsData([...commentsData, res.data]);
          setCommentText('');
          setPosts(posts.map(p => p.id === postId ? {...p, comments_count: p.comments_count + 1} : p));
      } catch (err) { alert("Gagal!"); }
  };

  const handleShare = async (post) => {
      const shareUrl = `${window.location.origin}/profile/${post.user_name.toLowerCase().replace(/\s/g, '')}#${post.id}`;
      const shareData = {
          title: `Postingan dari ${post.user_name} di Ambali`,
          text: post.content.substring(0, 50) + "...",
          url: shareUrl
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              await navigator.clipboard.writeText(shareUrl);
              alert("Link profil kreator berhasil disalin!");
          }
      } catch (err) {
          console.error("Gagal share:", err);
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

  return (
    <div className="platform-body" style={{ minHeight: '100vh', paddingBottom: '50px' }}>
      <Navbar user={user} profile={profile} handleLogout={handleLogout} />
      {!user && <AuthModal onLoginSuccess={(u) => {setUser(u); fetchProfile(u.id, u.user_metadata?.display_name); fetchSubscriptions(u.id);}} />}

      {/* Mandatory Username Migration Modal */}
      {showMigrationModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '32px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '24px', marginBottom: '24px' }}>
                      <Sparkles size={32} color="var(--accent-purple)" />
                  </div>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Pilih Username Anda</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>Selamat datang kembali! Ambali kini menggunakan sistem username unik agar profil Anda lebih mudah dicari.</p>
                  
                  {migrationError && (
                      <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                          {migrationError}
                      </div>
                  )}

                  <form onSubmit={handleMigrationSubmit}>
                      <div style={{ position: 'relative', marginBottom: '24px' }}>
                          <AtSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                            type="text" 
                            placeholder="username_baru" 
                            className="post-input" 
                            required 
                            style={{ paddingLeft: '48px' }}
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          />
                      </div>
                      <button className="btn-premium" style={{ width: '100%', padding: '16px' }} disabled={migrationLoading}>
                          {migrationLoading ? "Menyimpan..." : "Mulai Gunakan Ambali"}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {tipPost && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={()=>setTipPost(null)}>
              <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }} onClick={e=>e.stopPropagation()}>
                  <h2 style={{ marginBottom: '10px' }}>Tip untuk Kreator</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Berikan apresiasi untuk {tipPost.user_name}</p>
                  <input type="number" placeholder="Nominal Rp" className="post-input" style={{ width: '100%', marginBottom: '20px' }} value={tipAmount} onChange={e=>setTipAmount(e.target.value)} />
                  <button className="btn-premium" style={{ width: '100%' }} onClick={handleSendTip}>Kirim Tip</button>
              </div>
          </div>
      )}

      <div className="layout-wrapper">
        <Sidebar />

        {/* Main Feed */}
        <main className="main-feed">
          {/* Post Composer Upgrade */}
          <div className="glass-panel composer-card" style={{ marginBottom: '32px', borderRadius: '28px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '18px', marginBottom: '24px' }}>
              <div className="avatar-small" style={{ background: 'var(--gradient-premium)', width: '52px', height: '52px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, flexShrink: 0 }}>
                {profile?.display_name ? profile.display_name.charAt(0) : 'U'}
              </div>
              <textarea 
                placeholder="Ceritakan apa yang sedang terjadi..." 
                className="post-input composer-textarea" 
                style={{ background: 'transparent', padding: '10px 0', border: 'none', resize: 'none', height: '90px', flex: 1, fontSize: '1.1rem' }} 
                value={content} 
                onChange={e => setContent(e.target.value)} 
              />
            </div>
            
            <div className="composer-actions" style={{ display: 'grid', gap: '16px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '16px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center' }}>
                    <LinkIcon size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Tempel tautan video (YT, TikTok, IG)..." 
                    className="post-input" 
                    style={{ padding: '14px 16px 14px 48px', fontSize: '0.95rem', borderRadius: '18px', background: 'rgba(0,0,0,0.2)' }} 
                    value={mediaLink} 
                    onChange={e => setMediaLink(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label className="composer-option">
                      <input type="checkbox" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                      <Lock size={16} />
                      <span>Konten Premium</span>
                    </label>
                    <div className="composer-option" style={{ cursor: 'default' }}>
                      <Globe size={16} />
                      <span>Publik</span>
                    </div>
                  </div>
                  <button className="btn-premium composer-submit" style={{ padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }} onClick={handlePostSubmit}>
                    Posting
                  </button>
                </div>
            </div>
          </div>

          {loadingPosts && <div className="skeleton" style={{ height: '400px', borderRadius: '24px', marginBottom: '32px' }}></div>}

          {posts.map((post, idx) => (
            <article key={post.id} className="post-card" style={{ transition: 'all 0.3s' }}>
              <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`post-avatar profile-${(idx % 4) + 1}`}></div>
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {post.user_name} <CheckCircle2 size={14} color="#1d9bf0" fill="#1d9bf0" />
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{post.user_name.toLowerCase().replace(/\s/g, '')} • {new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><MoreHorizontal size={20} /></button>
              </header>

              <div style={{ padding: '0 20px 16px', wordBreak: 'break-word' }}>{post.content}</div>

              {(!post.is_premium || (user && post.user_id === user.id) || subscriptions.includes(post.user_id)) ? (
                renderMedia(post.google_drive_link)
              ) : (
                <div className="post-media aspect-landscape">
                  <div className="post-locked-overlay">
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                      <Lock size={48} color="var(--accent-gold)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Konten Eksklusif</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', maxWidth: '280px' }}>Berlangganan untuk melihat konten spesial dari {post.user_name}</p>
                    <button className="btn-premium" style={{ width: '100%', maxWidth: '240px' }} onClick={() => handleSubscribe(post.user_id)}>
                      Berlangganan Rp 50.000
                    </button>
                  </div>
                </div>
              )}

              <footer className="post-actions-row">
                <div className="action-item" onClick={() => handleLike(post)} style={{ color: post.has_liked ? 'var(--accent-rose)' : 'inherit' }}>
                  <Heart size={22} fill={post.has_liked ? "currentColor" : "none"} />
                  <span>{post.likes_count}</span>
                </div>
                <div className="action-item" onClick={() => openComments(post.id)}>
                  <MessageCircle size={22} />
                  <span>{post.comments_count}</span>
                </div>
                <div className="action-item" onClick={() => { if(!user)return alert("Login!"); setTipPost(post); }}>
                  <DollarSign size={22} />
                  <span>Tip</span>
                </div>
                <div className="action-item" onClick={() => handleShare(post)}>
                  <Share2 size={20} />
                  <span>Bagikan</span>
                </div>
              </footer>

              {activeCommentPost === post.id && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                  {commentsData.map(c => (
                    <div key={c.id} style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass-border)' }}></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.user_name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.content}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <input type="text" className="post-input" placeholder="Tulis komentar..." style={{ padding: '8px 16px', fontSize: '0.9rem' }} value={commentText} onChange={e=>setCommentText(e.target.value)} />
                    <button className="btn-secondary" style={{ padding: '0 16px' }} onClick={() => submitComment(post.id)}>Kirim</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </main>

        {/* Right Panel */}
        <aside className="right-panel">
          <div style={{ position: 'sticky', top: '100px' }}>
            <div className="glass-panel" style={{ borderRadius: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Saran Kreator</h3>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={`post-avatar profile-${i}`} style={{ width: '40px', height: '40px' }}></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Kreator {i}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@kreator_{i}</div>
                    </div>
                  </div>
                  <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>Ikuti</button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .composer-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .composer-card:focus-within { border-color: var(--accent-purple) !important; box-shadow: 0 10px 40px rgba(124, 58, 237, 0.1); }
        .composer-option {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 12px;
            transition: all 0.2s;
        }
        .composer-option:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .composer-option input { display: none; }
        .composer-option:has(input:checked) { color: var(--accent-gold); background: rgba(197, 160, 89, 0.1); }
        
        @media (max-width: 768px) {
            .composer-card { padding: 20px !important; margin-bottom: 24px !important; border-radius: 20px !important; }
            .composer-textarea { height: 70px !important; font-size: 1rem !important; }
            .composer-submit { width: 100%; margin-top: 10px; }
        }
      `}</style>
    </div>
  );
}
