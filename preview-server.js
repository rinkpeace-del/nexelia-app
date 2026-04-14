require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── AI チャット ──
app.post('/.netlify/functions/ai-chat', async (req, res) => {
  const { question, context } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question is required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '.env に OPENAI_API_KEY を設定してください' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'あなたは中学生向け英語学習の先生です。短く、わかりやすく、丁寧に日本語で説明してください。' },
          { role: 'user', content: `中学生向け英語学習サイト NEXELIA を使っています。\n現在の画面: ${context || 'NEXELIA'}\n\n質問:\n${question}\n\n日本語でやさしく解説してください。` }
        ]
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'OpenAI APIエラー', details: err });
    }
    const data = await response.json();
    res.json({ answer: data.choices?.[0]?.message?.content?.trim() || '回答を生成できませんでした。' });
  } catch (err) {
    res.status(500).json({ error: 'サーバーエラー', message: err.message });
  }
});

// ── 管理者認証 ──
app.post('/admin/verify', (req, res) => {
  const { password } = req.body || {};
  if (password && password === process.env.ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

// ── ブログ保存 ──
app.post('/admin/blog-save', (req, res) => {
  const { password, posts } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!Array.isArray(posts)) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const blogPath = path.join(__dirname, 'blog-data.json');
    fs.writeFileSync(blogPath, JSON.stringify({ posts }, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '保存に失敗しました', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`開発サーバー起動中: http://localhost:${PORT}`);
  console.log(`管理画面: http://localhost:${PORT}/admin-blog.html`);
  console.log(`ブログ:   http://localhost:${PORT}/blog.html`);
});
