import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';

export default function CreatorsPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [gdriveLink, setGdriveLink] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axios.get('http://localhost:5000/api/posts');
      if (res.data && Array.isArray(res.data)) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error(err);
      setPosts([]);
    }
    setLoadingPosts(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostSubmit = async () => {
    if (!gdriveLink) {
      alert("Tautan Google Drive diwajibkan!");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/posts', {
        content: content,
        google_drive_link: gdriveLink,
        user_id: user.id,
        user_name: user?.user_metadata?.full_name || user.email.split('@')[0]
      });
      setContent('');
      setGdriveLink('');
      fetchPosts();
    } catch (err) {
      alert("Gagal mem-posting: " + (err.response?.data?.error || err.message));
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };



  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="platform-body">
      {!user && <AuthModal onLoginSuccess={(u) => setUser(u)} />}

      <nav className="navbar platform-nav">
        <div className="logo"><Link to="/" className="no-style">Ambali<span className="dot">.</span><span className="badge">EduFans</span></Link></div>
        <div className="nav-right">
          <span className="balance">Saldo: Rp 2.500.000</span>
          {user ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
               <span style={{color: '#fff'}}>{user.user_metadata?.full_name || user.email}</span>
               <button onClick={handleLogout} className="btn-secondary" style={{padding: '5px 15px', fontSize: '0.8rem'}}>Keluar</button>
            </div>
          ) : (
             <div className="avatar"></div>
          )}
        </div>
      </nav>

      <div className="platform-container">
        <aside className="sidebar">
          <ul className="side-menu">
            <li className="active">🏠 Beranda</li>
            <li>🔥 Sedang Tren</li>
            <li>📚 Edukasi Bisnis</li>
            <li>🎨 Seni & Budaya</li>
            <li>⚙️ Pengaturan</li>
          </ul>
        </aside>

        <main className="feed">
          <div className="create-post glass-panel" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', gap: '15px', width: '100%', marginBottom: '10px'}}>
              <div className="avatar-small"></div>
              <input 
                type="text" 
                placeholder="Deskripsi post..." 
                className="post-input"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
            <div style={{display: 'flex', gap: '15px', width: '100%'}}>
              <input 
                type="text" 
                placeholder="Link Google Drive Video (Wajib)" 
                className="post-input"
                style={{flex: 1}}
                value={gdriveLink}
                onChange={e => setGdriveLink(e.target.value)}
              />
              <button className="btn-primary btn-post" onClick={handlePostSubmit}>Unggah</button>
            </div>
          </div>

          {loadingPosts && <p style={{color: 'white', textAlign: 'center'}}>Memuat post...</p>}

          {posts.map((post, index) => (
            <div key={post.id || index} className="post-card glass-panel fade-up visible">
              <div className="post-header">
                <div className={`post-avatar profile-${(index % 4) + 1}`}></div>
                <div className="post-info">
                  <h4>{post.user_name} <span className="verified">✓</span></h4>
                  <p>@{(post.user_name || '').toLowerCase().replace(/\s/g, '')} • Baru Saja</p>
                </div>
              </div>
              
              <div className="post-content">
                <p>{post.content}</p>
                
                {post.google_drive_link ? (
                  <div className="video-embed">
                     <iframe 
                        src={getEmbedUrl(post.google_drive_link)} 
                        allow="autoplay" 
                        allowFullScreen>
                     </iframe>
                  </div>
                ) : (
                  <div className="locked-content">
                    <div className="lock-icon">🔒</div>
                    <p>Konten Eksklusif Khusus Pelanggan</p>
                    <button className="btn-premium">Berlangganan Rp 50.000 / Bulan</button>
                  </div>
                )}
              </div>

              <div className="post-actions">
                <span>❤️ {Math.floor(Math.random() * 5) + 1}k Suka</span>
                <span>💬 {Math.floor(Math.random() * 500)} Komentar</span>
                <span>💸 Beri Tip</span>
              </div>
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
            <div className="suggestion-item">
              <div className="post-avatar profile-4"></div>
              <div className="sugg-info">
                <h4>Kofi Invest</h4>
                <p>@kofi_stocks</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
