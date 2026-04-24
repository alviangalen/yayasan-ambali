const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers ---
async function ensureProfile(userId, data = {}) {
    if (!userId) return null;
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (!profile) {
        const { data: newProfile } = await supabase.from('profiles')
            .insert([{ 
                id: userId, 
                display_name: data.display_name || 'User', 
                username: data.username || `user_${userId.slice(0,5)}`,
                balance: 2500000 
            }])
            .select().single();
        return newProfile;
    }
    return profile;
}

// --- API Profiles ---
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const profile = await ensureProfile(req.params.id, { display_name: req.query.name });
        res.json(profile);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/profiles/search/:username', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', req.params.username)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(404).json({ error: 'User not found' });
    }
});

app.put('/api/profiles/:id', async (req, res) => {
    const { display_name, username } = req.body;
    try {
        if (username) {
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .ilike('username', username)
                .single();
            if (existing && existing.id !== req.params.id) {
                return res.status(400).json({ error: 'Username sudah digunakan orang lain.' });
            }
        }
        const { data, error } = await supabase
            .from('profiles')
            .update({ display_name, username })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/check-username/:username', async (req, res) => {
    const { data } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', req.params.username)
        .single();
    res.json({ available: !data });
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
    const targetUserId = req.query.target_user_id;
    let query = supabase.from('posts').select(`*, likes(user_id), comments(id)`).order('created_at', { ascending: false });
    if (targetUserId) query = query.eq('user_id', targetUserId);
    const { data: posts, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    const formatted = posts.map(p => ({
        ...p,
        likes_count: p.likes ? p.likes.length : 0,
        has_liked: p.likes ? p.likes.some(l => l.user_id === userId) : false,
        comments_count: p.comments ? p.comments.length : 0
    }));
    res.json(formatted);
});

app.post('/api/posts', async (req, res) => {
    const { content, google_drive_link, user_id, user_name, is_premium } = req.body;
    const { data, error } = await supabase.from('posts').insert([{ content, google_drive_link, user_id, user_name, is_premium: !!is_premium }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

// --- API Likes ---
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

// --- API Comments ---
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

// --- API Transactions ---
app.post('/api/topup', async (req, res) => {
    const { user_id, amount } = req.body;
    const profile = await ensureProfile(user_id);
    const newBalance = parseFloat(profile.balance) + parseFloat(amount);
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', user_id);
    res.json({ balance: newBalance });
});

app.post('/api/subscribe', async (req, res) => {
    const { subscriber_id, creator_id } = req.body;
    const PRICE = 50000;
    const subscriber = await ensureProfile(subscriber_id);
    if (!subscriber || subscriber.balance < PRICE) return res.status(400).json({ error: "Saldo tidak mencukupi" });
    await supabase.from('profiles').update({ balance: subscriber.balance - PRICE }).eq('id', subscriber_id);
    const creator = await ensureProfile(creator_id);
    if (creator) await supabase.from('profiles').update({ balance: creator.balance + PRICE }).eq('id', creator_id);
    await supabase.from('subscriptions').insert([{ subscriber_id, creator_id }]);
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
    res.json({ status: 'success', balance: sender.balance - tipAmount });
});

app.listen(port, () => console.log(`Backend server running on port ${port}`));
