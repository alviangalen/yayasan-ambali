import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import { Wallet, ArrowLeft, CreditCard, History } from 'lucide-react';

export default function TopUpPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id, session.user.user_metadata?.full_name);
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id, session.user.user_metadata?.full_name);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    const fetchProfile = async (id, name) => {
        try {
            const res = await axios.get(`/api/profiles/${id}?name=${name || ''}`);
            setProfile(res.data);
        } catch (e) { console.error(e); }
    };

    const handleTopUp = async (predefinedAmount = null) => {
        const topupAmount = predefinedAmount || amount;
        if (!topupAmount || topupAmount <= 0) return alert('Masukkan nominal valid');
        try {
            const res = await axios.post(`/api/topup`, {
                user_id: user.id,
                amount: parseFloat(topupAmount)
            });
            alert('Top Up Berhasil!');
            setProfile({ ...profile, balance: res.data.balance });
            setAmount('');
        } catch (e) { alert('Gagal.'); }
    };

    const handleLogout = async () => await supabase.auth.signOut();

    if (!user) return <AuthModal onLoginSuccess={u => {setUser(u); fetchProfile(u.id, u.user_metadata?.full_name);}} />;

    return (
        <div className="platform-body" style={{ minHeight: '100vh' }}>
            <Navbar user={user} profile={profile} handleLogout={handleLogout} />
            
            <div className="layout-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '120px' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px' }}>
                        <Link to="/creators" className="btn-secondary" style={{ padding: '10px' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 style={{ fontSize: '1.75rem' }}>Dompet Saya</h1>
                    </div>

                    <div style={{ background: 'var(--gradient-premium)', padding: '32px', borderRadius: '24px', color: '#fff', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.2 }}>
                            <Wallet size={120} />
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '8px' }}>Saldo Tersedia</p>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Rp {profile?.balance ? parseFloat(profile.balance).toLocaleString('id-ID') : 0}</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        <div>
                            <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>Pilih Nominal Cepat</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                {[50000, 100000, 250000].map(amt => (
                                    <button key={amt} className="btn-secondary" style={{ padding: '12px 8px', fontSize: '0.85rem' }} onClick={() => handleTopUp(amt)}>
                                        Rp {amt / 1000}k
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                            <p style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.9rem' }}>Nominal Kustom</p>
                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>Rp</div>
                                <input type="number" placeholder="0" className="post-input" style={{ width: '100%', paddingLeft: '45px' }} value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <button className="btn-premium" style={{ width: '100%', padding: '16px' }} onClick={() => handleTopUp()}>
                                <CreditCard size={20} style={{ marginRight: '8px' }} />
                                Isi Saldo Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
