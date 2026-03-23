const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

// Claude API キー（環境変数から取得、なければデフォルト値を使用）
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const client = new Anthropic({ apiKey: API_KEY });

// Claude API エンドポイント
app.post('/ai-chat-proxy.php', async (req, res) => {
  const { question, context = 'NEXELIA', prompt } = req.body;

  // 入力値の検証
  if (!question || !question.trim()) {
    return res.status(400).json({ error: '質問が必要です' });
  }

  // APIキーの確認
  if (!API_KEY) {
    return res.status(500).json({
      error: 'APIキーが設定されていません',
      detail: '環境変数 ANTHROPIC_API_KEY を設定してください'
    });
  }

  // デフォルトプロンプトの構築
  let finalPrompt = prompt;
  if (!finalPrompt) {
    finalPrompt = `中学生向け英語学習サイト NEXELIA を使っています。
現在の画面: ${context}

質問:
${question}

日本語でやさしく解説して、最後に確認クイズを1問出してください。`;
  }

  try {
    // Claude API を呼び出し
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: 'あなたは中学生向け英語学習の先生です。短く、わかりやすく、丁寧に日本語で説明してください。',
      messages: [
        {
          role: 'user',
          content: finalPrompt
        }
      ]
    });

    // Claude からのレスポンスを取得
    const answer = message.content?.[0]?.text?.trim() || '';

    return res.json({
      answer: answer || '回答を生成できませんでした。もう一度試してください。'
    });
  } catch (error) {
    console.error('Claude API エラー:', error);
    return res.status(502).json({
      error: 'Claude API に接続できません',
      detail: error.message
    });
  }
});

// /api/ai-chat エンドポイントも対応（代替エンドポイント）
app.post('/api/ai-chat', async (req, res) => {
  // /ai-chat-proxy.php ハンドラーに転送
  const handler = app._router.stack.find(r => r.route?.path === '/ai-chat-proxy.php');
  if (handler) {
    handler.handle(req, res);
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'AI Chat Proxy running' });
});

// Serve static files from the current directory (MUST be after API routes)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AI Chat Proxy server running on http://localhost:${PORT}`);
});
