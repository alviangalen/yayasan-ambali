import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';

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
            const res = await axios.get(`http://localhost:5000/api/profiles/${id}?name=${name || ''}`);
            setProfile(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTopUp = async () => {
        if (!amount || amount <= 0) return alert('Masukkan nominal valid');
        try {
            const res = await axios.post('http://localhost:5000/api/topup', {
                user_id: user.id,
                amount: parseFloat(amount)
            });
            alert('Top Up Berhasil! Saldo terkini: Rp ' + parseFloat(res.data.balance).toLocaleString('id-ID'));
            setProfile({ ...profile, balance: res.data.balance });
            setAmount('');
        } catch (e) {
            alert('Gagal Top Up');
        }
    };

    if (!user) return <AuthModal onLoginSuccess={u => {setUser(u); fetchProfile(u.id, u.user_metadata?.full_name);}} />;

    return (
        <div className="platform-body" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
                <h2 style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>Isi Saldo Dompet</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                    Saldo Anda saat ini:<br/>
                    <strong style={{color: 'var(--accent-gold)', fontSize: '2rem'}}>Rp {profile?.balance ? parseFloat(profile.balance).toLocaleString('id-ID') : 0}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="number" 
                        placeholder="Contoh Nominal, misal: 100000" 
                        className="post-input"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                    <button className="btn-premium" onClick={handleTopUp}>Top Up Sekarang</button>
                    <Link to="/creators" className="btn-secondary" style={{marginTop: '10px'}}>Kembali ke EduFans</Link>
                </div>
            </div>
        </div>
    );
}
