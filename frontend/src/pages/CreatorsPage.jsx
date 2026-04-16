import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';

export default function CreatorsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  
  const [content, setContent] = useState('');
  const [gdriveLink, setGdriveLink] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsData, setCommentsData] = useState([]);
  
  const [tipPost, setTipPost] = useState(null);
  const [tipAmount, setTipAmount] = useState('');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchProfile(session.user.id, session.user.user_metadata?.full_name);
          fetchSubscriptions(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            fetchProfile(session.user.id, session.user.user_metadata?.full_name);
            fetchSubscriptions(session.user.id);
        } else {
            setSubscriptions([]);
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
          fetchPosts(id);
      } catch (err) { console.error(err); }
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
    if (!gdriveLink) return alert("Tautan Google Drive diwajibkan!");
    try {
      await axios.post(`/api/posts`, {
        content,
        google_drive_link: gdriveLink,
        user_id: user.id,
        user_name: user?.user_metadata?.full_name || user.email.split('@')[0],
        is_premium: isPremium
      });
      setContent(''); setGdriveLink(''); setIsPremium(false);
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
      if (!user) return alert("Anda harus login untuk memanajemen langganan!");
      if (creatorId === user.id) return alert("Anda tidak dapat berlangganan ke diri sendiri.");
      if (window.confirm("Berlangganan Akses Kreator ini seharga Rp 50.000?")) {
          try {
              await axios.post(`/api/subscribe`, {
                  subscriber_id: user.id,
                  creator_id: creatorId
              });
              alert("Langganan Berhasil! Akses eksklusif telah terbuka.");
              
              // Optimistic UI lock-release
              setSubscriptions(prev => {
                  if (!prev.includes(creatorId)) return [...prev, creatorId];
                  return prev;
              });
              
              fetchProfile(user.id);
              fetchSubscriptions(user.id);
          } catch (err) {
              alert(err.response?.data?.error || "Gagal berlangganan. Pastikan saldo Anda mencukupi.");
          }
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
          alert(`Berhasil memberi Tip Apresiasi Rp ${parseFloat(tipAmount).toLocaleString('id-ID')} !`);
          setTipPost(null);
          setTipAmount('');
          fetchProfile(user.id);
      } catch(err) {
          alert(err.response?.data?.error || "Gagal mengirim tip.");
      }
  };

  const openComments = async (postId) => {
      if(activeCommentPost === postId) {
          setActiveCommentPost(null);
          return;
      }
      setActiveCommentPost(postId);
      const res = await axios.get(`/api/posts/${postId}/comments`);
      setCommentsData(res.data);
  };

  const submitComment = async (postId) => {
      if (!user) return alert("Silahkan login untuk komentar!");
      if (!commentText) return;
      try {
          const res = await axios.post(`/api/posts/${postId}/comments`, {
              user_id: user.id,
              user_name: user?.user_metadata?.full_name || user.email.split('@')[0],
              content: commentText
          });
          setCommentsData([...commentsData, res.data]);
          setCommentText('');
          setPosts(posts.map(p => p.id === postId ? {...p, comments_count: p.comments_count + 1} : p));
      } catch (err) { alert("Gagal mengirim komentar!"); }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('/view')) return url.replace('/view', '/preview');
    return url;
  };

  const handleLogout = async () => await supabase.auth.signOut();

  return (
    <div className="platform-body">
      {!user && <AuthModal onLoginSuccess={(u) => {setUser(u); fetchProfile(u.id, u.user_metadata?.full_name); fetchSubscriptions(u.id);}} />}

      {tipPost && (
          <div className="modal-overlay" onClick={()=>setTipPost(null)}>
              <div className="modal-content" onClick={e=>e.stopPropagation()}>
                  <h2>Tip untuk Kreator</h2>
                  <p>Berikan dukungan apresiasi kepada kreator.</p>
                  <input type="number" placeholder="Nominal Rp (Misal: 25000)" value={tipAmount} onChange={e=>setTipAmount(e.target.value)} />
                  <button className="btn-premium" onClick={handleSendTip}>Kirim Tip</button>
              </div>
          </div>
      )}

      <nav className="navbar platform-nav">
        <div className="logo"><Link to="/" className="no-style">Ambali<span className="dot">.</span><span className="badge">EduFans</span></Link></div>
        <div className="nav-right">
          <Link to="/topup" className="balance" style={{textDecoration: 'none'}}>
              Saldo: Rp {profile?.balance ? parseFloat(profile.balance).toLocaleString('id-ID') : 0} ➕
          </Link>
          {user ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
               <span style={{color: '#fff'}}>{profile?.full_name || user.email.split('@')[0]}</span>
               <button onClick={handleLogout} className="btn-secondary" style={{padding: '5px 15px', fontSize: '0.8rem'}}>Keluar</button>
            </div>
          ) : <div className="avatar"></div>}
        </div>
      </nav>

      <div className="platform-container">
        <aside className="sidebar">
          <ul className="side-menu">
            <li className="active">🏠 Beranda</li>
            <li>🔥 Sedang Tren</li>
            <li>📚 Edukasi Bisnis</li>
            <li>🎨 Seni & Budaya</li>
            <li style={{cursor: 'pointer'}} onClick={() => window.location.href = '/studio'}>⚙️ Kelola Konten Saya (Studio)</li>
          </ul>
        </aside>

        <main className="feed">
          <div className="create-post glass-panel" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', gap: '15px', width: '100%', marginBottom: '10px'}}>
              <div className="avatar-small" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <input type="text" placeholder="Deskripsi post..." className="post-input" value={content} onChange={e => setContent(e.target.value)} />
            </div>
            <div style={{display: 'flex', gap: '15px', width: '100%', alignItems: 'center'}}>
              <input type="text" placeholder="Link Google Drive Video (Wajib)" className="post-input" style={{flex: 1}} value={gdriveLink} onChange={e => setGdriveLink(e.target.value)} />
              
              <label style={{color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
                  Eksklusif (Premium)
              </label>

              <button className="btn-primary btn-post" onClick={handlePostSubmit}>Unggah</button>
            </div>
          </div>

          {loadingPosts && <p style={{color: 'white', textAlign: 'center'}}>Memuat post...</p>}

          {posts.map((post, index) => (
            <div key={post.id} className="post-card glass-panel fade-up visible">
              <div className="post-header">
                <div className={`post-avatar profile-${(index % 4) + 1}`}></div>
                <div className="post-info">
                  <h4>{post.user_name} <span className="verified">✓</span> {post.is_premium && <span className="badge" style={{background: 'var(--accent-gold)', color: '#000'}}>EKSKLUSIF</span>}</h4>
                  <p>@{(post.user_name || '').toLowerCase().replace(/\s/g, '')} • {new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="post-content">
                <p>{post.content}</p>
                
                {(!post.is_premium || (user && post.user_id === user.id) || subscriptions.includes(post.user_id)) ? (
                  <div className="video-embed">
                     <iframe src={getEmbedUrl(post.google_drive_link)} allow="autoplay" allowFullScreen></iframe>
                  </div>
                ) : (
                  <div className="locked-content">
                    <div className="lock-icon">🔒</div>
                    <p>Konten Eksklusif Khusus Pelanggan</p>
                    <button className="btn-premium" onClick={() => handleSubscribe(post.user_id)}>
                        Berlangganan Rp 50.000 / Permanen
                    </button>
                  </div>
                )}
              </div>

              <div className="post-actions" style={{borderBottom: activeCommentPost === post.id ? '1px solid var(--glass-border)' : 'none', paddingBottom: activeCommentPost === post.id ? '20px' : '0'}}>
                <span onClick={() => handleLike(post)} style={{color: post.has_liked ? 'var(--accent-gold)' : 'inherit'}}>
                    {post.has_liked ? '❤️' : '🤍'} {post.likes_count} Suka
                </span>
                <span onClick={() => openComments(post.id)}>💬 {post.comments_count} Komentar</span>
                <span onClick={() => { if(!user){alert("Login dulu!");return;} setTipPost(post);}}>💸 Beri Tip</span>
              </div>

              {activeCommentPost === post.id && (
                  <div className="comments-section" style={{marginTop: '20px'}}>
                      {commentsData.map(c => (
                          <div key={c.id} style={{marginBottom: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px'}}>
                              <strong style={{color: '#fff', fontSize: '0.9rem'}}>{c.user_name}</strong>
                              <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px'}}>{c.content}</p>
                          </div>
                      ))}
                      <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                          <input type="text" className="post-input" placeholder="Tulis balasan..." style={{padding: '10px 15px'}} value={commentText} onChange={e=>setCommentText(e.target.value)} />
                          <button className="btn-secondary" style={{padding: '0 20px'}} onClick={() => submitComment(post.id)}>Kirim</button>
                      </div>
                  </div>
              )}
            </div>
          ))}
        </main>
        
        <aside className="suggestions">
          <div className="glass-panel">
            <h3>Kreator Disarankan</h3>
            <div className="suggestion-item">
              <div className="post-avatar profile-3"></div>
              <div className="sugg-info">
                <h4>Jamal Tech</h4>
                <p>@jamal_it</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
