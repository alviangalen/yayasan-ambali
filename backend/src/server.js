const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/api/posts', async (req, res) => {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/posts', async (req, res) => {
    const { content, google_drive_link, user_id, user_name } = req.body;
    
    if (!content && !google_drive_link) {
        return res.status(400).json({ error: 'Post must have content or a link.' });
    }

    const { data, error } = await supabase
        .from('posts')
        .insert([{ content, google_drive_link, user_id, user_name }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
