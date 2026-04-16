const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
if (!supabaseServiceKey) {
    console.warn('[WARNING] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env. Menggunakan Anon Key. Operasi seperti subscribe mungkin diblokir oleh RLS.');
}
const supabase = createClient(supabaseUrl, supabaseKey, supabaseServiceKey ? {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
} : {});

// --- Helpers ---
async function ensureProfile(userId, userName) {
    if (!userId) return null;
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!data) {
        const { data: newProfile } = await supabase.from('profiles')
            .insert([{ id: userId, full_name: userName || 'User', balance: 2500000 }])
            .select().single();
        return newProfile;
    } else if (userName && data.full_name !== userName && (data.full_name === 'User' || !data.full_name)) {
        const { data: updated } = await supabase.from('profiles')
            .update({ full_name: userName })
            .eq('id', userId)
            .select().single();
        return updated;
    }
    return data;
}

// --- API Profiles ---
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const profile = await ensureProfile(req.params.id, req.query.name);
        res.json(profile);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- API Subscriptions ---
app.get('/api/subscriptions/:id', async (req, res) => {
    const { data, error } = await supabase.from('subscriptions').select('creator_id').eq('subscriber_id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data.map(d => d.creator_id));
});

// --- API Posts ---
app.get('/api/posts', async (req, res) => {
    const userId = req.query.user_id;

    let query = supabase.from('posts').select(`
        *,
        likes(user_id),
        comments(id)
    `).order('created_at', { ascending: false });

    const { data: posts, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const formatted = posts.map(p => ({
        ...p,
        likes_count: p.likes ? p.likes.length : 0,
        has_liked: p.likes ? p.likes.some(l => l.user_id === userId) : false,
        comments_count: p.comments ? p.comments.length : 0,
        likes: undefined
    }));
    res.json(formatted);
});

app.post('/api/posts', async (req, res) => {
    const { content, google_drive_link, user_id, user_name, is_premium } = req.body;
    if (!content && !google_drive_link) return res.status(400).json({ error: 'Post must have content or a link.' });

    const { data, error } = await supabase
        .from('posts')
        .insert([{ content, google_drive_link, user_id, user_name, is_premium: !!is_premium }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

app.put('/api/posts/:id', async (req, res) => {
    const { content, google_drive_link, is_premium, user_id } = req.body;
    
    const { data: check } = await supabase.from('posts').select('user_id').eq('id', req.params.id).single();
    if (!check || check.user_id !== user_id) return res.status(403).json({ error: 'Unauthorized to edit this post' });

    const { data, error } = await supabase.from('posts')
        .update({ content, google_drive_link, is_premium })
        .eq('id', req.params.id)
        .select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/posts/:id', async (req, res) => {
    const { user_id } = req.body;

    const { data: check } = await supabase.from('posts').select('user_id').eq('id', req.params.id).single();
    if (!check || check.user_id !== user_id) return res.status(403).json({ error: 'Unauthorized to delete this post' });

    const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ status: 'deleted' });
});

// --- API Suka (Likes) ---
app.post('/api/posts/:id/like', async (req, res) => {
    const { user_id } = req.body;
    const post_id = req.params.id;
    const { data: existing } = await supabase.from('likes').select('*').eq('post_id', post_id).eq('user_id', user_id).single();
    
    if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
        res.json({ status: 'unliked' });
    } else {
        await supabase.from('likes').insert([{ post_id, user_id }]);
        res.json({ status: 'liked' });
    }
});

// --- API Komentar ---
app.get('/api/posts/:id/comments', async (req, res) => {
    const { data, error } = await supabase.from('comments').select('*').eq('post_id', req.params.id).order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/posts/:id/comments', async (req, res) => {
    const { user_id, user_name, content } = req.body;
    const { data, error } = await supabase.from('comments').insert([{ post_id: req.params.id, user_id, user_name, content }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

// --- API Transaksi & Saldo ---
app.post('/api/topup', async (req, res) => {
    const { user_id, amount } = req.body;
    const profile = await ensureProfile(user_id);
    const newBalance = parseFloat(profile.balance) + parseFloat(amount);
    
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', user_id);
    await supabase.from('transactions').insert([{ sender_id: user_id, type: 'topup', amount }]);
    
    res.json({ balance: newBalance });
});

app.post('/api/subscribe', async (req, res) => {
    const { subscriber_id, creator_id } = req.body;
    const PRICE = 50000;

    const subscriber = await ensureProfile(subscriber_id);
    if (!subscriber || subscriber.balance < PRICE) return res.status(400).json({ error: "Saldo tidak mencukupi" });

    const { error: err1 } = await supabase.from('profiles').update({ balance: subscriber.balance - PRICE }).eq('id', subscriber_id);
    if (err1) return res.status(400).json({ error: "Gagal memotong saldo: " + err1.message });
    
    const creator = await ensureProfile(creator_id);
    if (creator) {
        const { error: err2 } = await supabase.from('profiles').update({ balance: creator.balance + PRICE }).eq('id', creator_id);
        if (err2) return res.status(400).json({ error: "Gagal menambah saldo kreator: " + err2.message });
    }

    const { error: errSub } = await supabase.from('subscriptions').insert([{ subscriber_id, creator_id }]);
    if (errSub) return res.status(400).json({ error: "Gagal mencatat langganan (Tabel mungkin belum dibuat): " + errSub.message });

    const { error: errTrans } = await supabase.from('transactions').insert([{ sender_id: subscriber_id, receiver_id: creator_id, type: 'subscription', amount: PRICE }]);
    if (errTrans) console.log("Gagal mencatat transaksi: ", errTrans.message); // non-fatal

    res.json({ status: 'success', balance: subscriber.balance - PRICE });
});

app.post('/api/tip', async (req, res) => {
    const { sender_id, receiver_id, amount } = req.body;
    const tipAmount = parseFloat(amount);

    const sender = await ensureProfile(sender_id);
    if (!sender || sender.balance < tipAmount) return res.status(400).json({ error: "Saldo tidak mencukupi" });

    await supabase.from('profiles').update({ balance: sender.balance - tipAmount }).eq('id', sender_id);
    const receiver = await ensureProfile(receiver_id);
    if (receiver) await supabase.from('profiles').update({ balance: receiver.balance + tipAmount }).eq('id', receiver_id);

    await supabase.from('transactions').insert([{ sender_id, receiver_id, type: 'tip', amount: tipAmount }]);

    res.json({ status: 'success', balance: sender.balance - tipAmount });
});

// VERCEL SERVERLESS EXPORT
module.exports = app;
