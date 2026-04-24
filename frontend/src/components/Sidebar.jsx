import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Video, PlusSquare, Settings, Search } from 'lucide-react';

export default function Sidebar({ active }) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/profile/${searchQuery.trim().toLowerCase().replace('@', '')}`);
            setSearchQuery('');
        }
    };

    return (
        <aside className="left-sidebar">
            <div className="sidebar-sticky">
                {/* Advanced Search in Sidebar */}
                <div style={{ marginBottom: '24px', padding: '0 10px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '12px 16px', 
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        transition: 'all 0.3s'
                    }} className="search-box-sidebar">
                        <Search size={18} color="var(--text-muted)" />
                        <input 
                            type="text" 
                            placeholder="Cari @username..." 
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                outline: 'none', 
                                color: '#fff', 
                                fontSize: '0.9rem',
                                width: '100%' 
                            }} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>

                <ul style={{ listStyle: 'none' }}>
                    <Link to="/creators" className={`nav-item ${currentPath === '/creators' ? 'active' : ''}`}>
                        <Home size={24} />
                        <span className="nav-label">Beranda</span>
                    </Link>
                    <Link to="/trending" className={`nav-item ${currentPath === '/trending' ? 'active' : ''}`}>
                        <TrendingUp size={24} />
                        <span className="nav-label">Tren</span>
                    </Link>
                    <Link to="/live" className={`nav-item ${currentPath === '/live' ? 'active' : ''}`}>
                        <Video size={24} />
                        <span className="nav-label">Live</span>
                    </Link>
                    <Link to="/studio" className={`nav-item ${currentPath === '/studio' ? 'active' : ''}`}>
                        <PlusSquare size={24} />
                        <span className="nav-label">Studio</span>
                    </Link>
                    <Link to="/settings" className={`nav-item ${currentPath === '/settings' ? 'active' : ''}`}>
                        <Settings size={24} />
                        <span className="nav-label">Setelan</span>
                    </Link>
                </ul>
            </div>
        </aside>
    );
}
