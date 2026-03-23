require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

// CORS対応
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ユーザーデータファイルのパス
const usersFilePath = path.join(__dirname, 'users.json');

// ============================================
// ユーティリティ関数
// ============================================

// ユーザーデータをロード
function loadUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('ユーザーファイルの読み込みエラー:', err);
  }
  return { users: [] };
}

// ユーザーデータを保存
function saveUsers(data) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('ユーザーファイルの保存エラー:', err);
    return false;
  }
}

// シンプルなパスワードハッシュ化（実運用ではbcryptなどを使用）
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'nexelia_salt_2024')
    .digest('hex');
}

// パスワード検証
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// ユーザーID生成
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// APIエンドポイント
// ============================================

// ユーザー登録エンドポイント
app.post('/api/auth/register', (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // 入力検証
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({
      error: 'ユーザー名、パスワード、確認用パスワードを入力してください'
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      error: 'ユーザー名は3文字以上である必要があります'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'パスワードは6文字以上である必要があります'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      error: 'パスワードが一致していません'
    });
  }

  // ユーザー情報の読み込み
  const usersData = loadUsers();

  // ユーザー名の重複チェック
  if (usersData.users.find(u => u.username === username)) {
    return res.status(409).json({
      error: 'このユーザー名は既に使用されています'
    });
  }

  // 新しいユーザーを作成
  const newUser = {
    id: generateUserId(),
    username: username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  usersData.users.push(newUser);

  // 保存
  if (!saveUsers(usersData)) {
    return res.status(500).json({
      error: 'ユーザー情報の保存に失敗しました'
    });
  }

  res.status(201).json({
    success: true,
    message: 'ユーザーを登録しました',
    userId: newUser.id,
    username: newUser.username
  });
});

// ユーザーログイン
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // 入力検証
  if (!username || !password) {
    return res.status(400).json({
      error: 'ユーザー名とパスワードを入力してください'
    });
  }

  // ユーザー情報の読み込み
  const usersData = loadUsers();

  // ユーザーを検索
  const user = usersData.users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({
      error: 'ユーザー名またはパスワードが正しくありません'
    });
  }

  // パスワード検証
  if (!verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      error: 'ユーザー名またはパスワードが正しくありません'
    });
  }

  // ログイン成功
  const sessionId = crypto.randomBytes(16).toString('hex');
  const sessionData = {
    userId: user.id,
    username: user.username,
    loginTime: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'ログインしました',
    sessionId: sessionId,
    user: {
      id: user.id,
      username: user.username
    }
  });
});

// ユーザー情報取得
app.get('/api/auth/user/:userId', (req, res) => {
  const { userId } = req.params;

  const usersData = loadUsers();
  const user = usersData.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: 'ユーザーが見つかりません'
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    }
  });
});

// すべてのユーザーを取得（管理用）
app.get('/api/auth/users', (req, res) => {
  const usersData = loadUsers();
  res.json({
    success: true,
    totalUsers: usersData.users.length,
    users: usersData.users.map(u => ({
      id: u.id,
      username: u.username,
      createdAt: u.createdAt
    }))
  });
});

// ============================================
// AI チャット エンドポイント（OpenAI）
// ============================================

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/ai-chat', async (req, res) => {
  const { question, context, prompt } = req.body;
  if (!question) {
    return res.status(400).json({ error: '質問が空です' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '中学生向け英語学習サイト NEXELIA のAIアシスタントです。中学生にわかりやすい日本語で英語を説明してください。'
        },
        {
          role: 'user',
          content: prompt || question
        }
      ],
      max_tokens: 1000
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error('OpenAI APIエラー:', err.message);
    res.status(500).json({ error: 'AI回答に失敗しました', detail: err.message });
  }
});

// ヘルスチェック
app.get('/', (req, res) => {
  res.json({ status: 'Auth server running' });
});

// 静的ファイルを提供（NEXELIA ファイル）
app.use(express.static(__dirname));

// ============================================
// サーバー起動
// ============================================

const PORT = process.env.AUTH_PORT || 5001;
app.listen(PORT, () => {
  console.log(`認証サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`ユーザーデータファイル: ${usersFilePath}`);
});
