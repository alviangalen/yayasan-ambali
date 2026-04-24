import { Link, useLocation } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Wallet, 
  ShieldCheck, 
  Home, 
  TrendingUp, 
  Video, 
  Settings,
  PlusSquare
} from 'lucide-react';

const Navbar = ({ user, profile, handleLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      <nav className="nav-floating">
        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 900 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Ambali<span style={{ color: 'var(--accent-purple)' }}>.</span>
          </Link>
        </div>

        {/* Desktop Nav Items (Hidden on Mobile) */}
        <div className="nav-desktop-content" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {user && (
            <Link to="/topup" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={16} color="var(--accent-gold)" />
              <span className="nav-label">Rp {profile?.balance ? parseFloat(profile.balance).toLocaleString('id-ID') : 0}</span>
            </Link>
          )}

          {user?.email === 'admin@gmail.com' && (
            <Link to="/admin" className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #ef4444, #991b1b)' }}>
              <ShieldCheck size={16} />
              <span className="nav-label">Admin</span>
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="nav-label" style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profile?.full_name || user.email.split('@')[0]}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Member</div>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px', borderRadius: '12px' }}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="avatar skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }}></div>
          )}
        </div>

        {/* Mobile Specific Icons (Shown on Mobile) */}
        <div className="nav-mobile-icons" style={{ display: 'none', alignItems: 'center', gap: '12px' }}>
          {user && (
             <Link to="/topup" style={{ color: 'var(--accent-gold)' }}><Wallet size={20} /></Link>
          )}
          {user?.email === 'admin@gmail.com' && (
             <Link to="/admin" style={{ color: '#ef4444' }}><ShieldCheck size={20} /></Link>
          )}
          {user && (
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
              <LogOut size={20} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar (Premium Style) */}
      <div className="mobile-bottom-nav">
          <Link to="/creators" className={`mobile-nav-item ${currentPath === '/creators' ? 'active' : ''}`}>
            <Home size={22} />
            <span>Beranda</span>
          </Link>
          <Link to="/trending" className={`mobile-nav-item ${currentPath === '/trending' ? 'active' : ''}`}>
            <TrendingUp size={22} />
            <span>Tren</span>
          </Link>
          <Link to="/studio" className={`mobile-nav-item ${currentPath === '/studio' ? 'active' : ''}`}>
            <div className="mobile-nav-center">
              <PlusSquare size={26} color="#fff" />
            </div>
          </Link>
          <Link to="/live" className={`mobile-nav-item ${currentPath === '/live' ? 'active' : ''}`}>
            <Video size={22} />
            <span>Live</span>
          </Link>
          <Link to="/settings" className={`mobile-nav-item ${currentPath === '/settings' ? 'active' : ''}`}>
            <Settings size={22} />
            <span>Setelan</span>
          </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-content { display: none !important; }
          .nav-mobile-icons { display: flex !important; }
          .nav-floating { 
            width: calc(100% - 24px) !important;
            padding: 0 20px !important;
            height: 60px !important;
          }
          .mobile-bottom-nav {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100% - 32px);
            height: 70px;
            background: rgba(13, 13, 18, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 2000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.65rem;
            font-weight: 600;
            transition: all 0.3s;
          }
          .mobile-nav-item.active {
            color: var(--accent-purple);
          }
          .mobile-nav-center {
            background: var(--gradient-premium);
            width: 50px;
            height: 50px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: -30px;
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
            border: 3px solid var(--bg-dark);
          }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
