# NEXELIA 認証システム - 実装詳細

## 📍 実装ファイル一覧

### 1. **auth-server.js** - 認証APIサーバー
**パス:** `C:\Users\rinkp\OneDrive\デスクトップ\NEXELIA\auth-server.js`

**実装内容：**

| 機能 | 行番号 | 説明 |
|------|-------|------|
| **ユーザー登録API** | 75-131 | `POST /api/auth/register` エンドポイント |
| **ログインAPI** | 133-196 | `POST /api/auth/login` エンドポイント |
| **ユーザー情報取得** | 198-211 | `GET /api/auth/user/:userId` エンドポイント |
| **全ユーザー取得** | 213-223 | `GET /api/auth/users` エンドポイント（管理用） |
| **パスワードハッシュ化** | 47-51 | SHA256 でパスワードをハッシュ化 |
| **ユーザーID生成** | 65-68 | ユニークなユーザーID生成 |
| **CORS設定** | 14-26 | クロスオリジン対応 |
| **サーバー起動** | 236-240 | ポート5001で起動 |

**重要な設定：**
```javascript
// ポート設定（行236）
const PORT = process.env.PORT || process.env.AUTH_PORT || 5001;

// ユーザーデータファイル（行23）
const usersFilePath = path.join(__dirname, 'users.json');

// パスワードハッシュ化方式（行49）
return crypto.createHash('sha256').update(password + 'nexelia_salt_2024').digest('hex');
```

---

### 2. **login.html** - ログインページ
**パス:** `C:\Users\rinkp\OneDrive\デスクトップ\NEXELIA\login.html`

**実装内容：**

| 機能 | 行番号 | 説明 |
|------|-------|------|
| **ログインフォーム** | 100-114 | ユーザー名・パスワード入力フィールド |
| **ログイン処理** | 195-253 | フォーム送信時の処理 |
| **API呼び出し** | 218 | `http://localhost:5001/api/auth/login` にPOST |
| **localStorage保存** | 243-244 | ログイン情報をブラウザに保存 |
| **リダイレクト** | 245 | ログイン成功時に lessons.html へ |
| **既ログイン確認** | 255-259 | 既にログイン済みなら lessons.html へ |
| **エラーメッセージ** | 233, 248, 254 | ユーザーフレンドリーなエラー表示 |

**API呼び出し例：**
```javascript
// 行218
const response = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username, password})
});
```

**localStorage保存内容：**
```javascript
// 行243-244
localStorage.setItem('nexeliaUser', JSON.stringify(userData));
localStorage.setItem('nexeliaLoggedIn', 'true');
```

---

### 3. **register.html** - ユーザー登録ページ
**パス:** `C:\Users\rinkp\OneDrive\デスクトップ\NEXELIA\register.html`

**実装内容：**

| 機能 | 行番号 | 説明 |
|------|-------|------|
| **登録フォーム** | 188-227 | ユーザー名・パスワード・確認入力フィールド |
| **登録処理** | 235-278 | フォーム送信時の処理 |
| **API呼び出し** | 252 | `http://localhost:5001/api/auth/register` にPOST |
| **パスワード確認** | 240 | 2つのパスワードが一致するか確認 |
| **成功メッセージ** | 267 | 登録成功時のメッセージ表示 |
| **リダイレクト** | 270 | 2秒後に login.html へ |
| **既ログイン確認** | 280-284 | 既にログイン済みなら lessons.html へ |

**API呼び出し例：**
```javascript
// 行252
const response = await fetch('http://localhost:5001/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username, password, confirmPassword})
});
```

---

### 4. **index.html** - トップページ（ログイン確認機能）
**パス:** `C:\Users\rinkp\OneDrive\デスクトップ\NEXELIA\index.html`

**実装内容：**

| 機能 | 行番号 | 説明 |
|------|-------|------|
| **ログイン確認** | 219-225 | ページ読み込み時にログイン状態をチェック |

**実装コード：**
```javascript
// 行219-225
(function() {
  const isLoggedIn = localStorage.getItem('nexeliaLoggedIn') === 'true';
  if (!isLoggedIn) {
    window.location.href = 'login.html';  // ログインしていなければlogin.htmlへリダイレクト
  }
})();
```

**動作フロー：**
- index.html にアクセス
  ↓
- localStorage の `nexeliaLoggedIn` をチェック
  ↓
- `true` でない場合、login.html へリダイレクト

---

### 5. **lessons.html** - レッスン一覧ページ（ユーザー情報・ログアウト機能）
**パス:** `C:\Users\rinkp\OneDrive\デスクトップ\NEXELIA\lessons.html`

**実装内容：**

| 機能 | 行番号 | 説明 |
|------|-------|------|
| **ログイン確認関数** | 729-759 | `checkLoginStatus()` - ログイン状態をチェック |
| **ユーザー名表示** | 368 | HTML要素 `id="username-display"` |
| **ログアウトボタン** | 369 | HTML要素 `id="logoutBtn"` |
| **ユーザー名の描画** | 737-742 | localStorage からユーザー情報を取得して表示 |
| **ログアウト処理** | 748-754 | ログアウトボタンのクリックイベント処理 |
| **CSSスタイル** | 66-91 | ユーザー名表示・ログアウトボタンのスタイル |

**HTML要素：**
```html
<!-- 行368-369 -->
<span id="username-display" class="username-display"></span>
<button id="logoutBtn" class="logout-button">ログアウト</button>
```

**ユーザー名表示コード：**
```javascript
// 行740-742
const userData = JSON.parse(localStorage.getItem('nexeliaUser') || '{}');
const usernameDisplay = document.getElementById('username-display');
if (usernameDisplay && userData.username) {
  usernameDisplay.textContent = `ユーザー: ${userData.username}`;
}
```

**ログアウト処理コード：**
```javascript
// 行748-754
document.getElementById('logoutBtn').addEventListener('click', function() {
  if (confirm('ログアウトしますか？')) {
    localStorage.removeItem('nexeliaLoggedIn');
    localStorage.removeItem('nexeliaUser');
    window.location.href = 'login.html';
  }
});
```

**ログイン確認コード：**
```javascript
// 行729-759
function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('nexeliaLoggedIn') === 'true';
  if (!isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }
  // ユーザー情報を表示...
}

// ページ読み込み時と戻るボタン対策
window.addEventListener('load', checkLoginStatus);
window.addEventListener('pageshow', checkLoginStatus);
```

---

## 🔄 データフロー

### 新規登録フロー
```
register.html（入力）
    ↓
POST /api/auth/register（auth-server.js 行75）
    ↓
✅ 登録成功 → users.json に保存（自動生成）
              → localStorage クリア
              → 2秒後に login.html へリダイレクト
    ↓
❌ 登録失敗 → エラーメッセージ表示
```

### ログインフロー
```
login.html（入力）
    ↓
POST /api/auth/login（auth-server.js 行133）
    ↓
✅ ログイン成功 → localStorage に保存（nexeliaLoggedIn, nexeliaUser）
              → lessons.html へリダイレクト
    ↓
❌ ログイン失敗 → エラーメッセージ表示
```

### ページアクセスフロー
```
http://localhost:5500
    ↓
index.html
    ↓
localStorage チェック（行219-225）
    ├─ ログイン済み → コンテンツ表示
    └─ 未ログイン → login.html へリダイレクト
```

### ログアウトフロー
```
lessons.html の「ログアウト」ボタン
    ↓
確認ダイアログ表示（行749）
    ↓
OK → localStorage をクリア（行751-752）
     → login.html へリダイレクト（行753）
```

---

## 💾 localStorage キー一覧

| キー | 値の例 | 説明 |
|------|--------|------|
| `nexeliaLoggedIn` | `'true'` | ログイン状態フラグ |
| `nexeliaUser` | `{"username":"testuser","userId":"...","sessionId":"..."}` | ユーザー情報 |

---

## 📊 users.json の構造

**ファイル位置:** `C:\Users\rinkp\OneDrive\デスクトップ\NEXELIA\users.json`

```json
{
  "users": [
    {
      "id": "user_1774168891940_gj33pdnl7",
      "username": "testuser",
      "passwordHash": "513c2233080ae5b5b69dc3d8f66691cb289ee79aacc2b9fb29ede9a955eecc1e",
      "createdAt": "2026-03-22T08:41:31.941Z"
    }
  ]
}
```

**フィールド説明：**
- `id`: ユーザーID（auth-server.js 行65-68 で生成）
- `username`: ユーザー名
- `passwordHash`: SHA256 でハッシュ化されたパスワード
- `createdAt`: アカウント作成日時

---

## 🔗 APIエンドポイント一覧

| メソッド | パス | 実装行 | 説明 |
|---------|------|-------|------|
| POST | `/api/auth/register` | 75 | 新規ユーザー登録 |
| POST | `/api/auth/login` | 133 | ユーザーログイン |
| GET | `/api/auth/user/:userId` | 198 | ユーザー情報取得 |
| GET | `/api/auth/users` | 213 | 全ユーザー取得（管理用） |
| GET | `/` | 225 | ヘルスチェック |

---

## 🛡️ セキュリティ実装

| 機能 | ファイル | 行番号 | 説明 |
|------|---------|--------|------|
| **パスワードハッシュ化** | auth-server.js | 47-51 | SHA256 + salt でハッシュ化 |
| **パスワード検証** | auth-server.js | 53-56 | ハッシュ値の比較 |
| **CORS対応** | auth-server.js | 14-26 | クロスオリジンリクエスト許可 |
| **入力検証** | auth-server.js | 78-93 | ユーザー名・パスワード長チェック |
| **ユーザー名重複チェック** | auth-server.js | 95-99 | 既存ユーザーの確認 |

---

## ✅ テスト実行手順

### Step 1: auth-server 起動
```bash
node auth-server.js
# 出力: 認証サーバーが起動しました: http://localhost:5001
```

### Step 2: Live Server 起動
VS Code で `Ctrl + Shift + P` → "Live Server: Open with Live Server"

### Step 3: ブラウザで確認
```
http://localhost:5500
  ↓
login.html へ自動リダイレクト（期待どおり）
  ↓
register.html で新規登録、または既存ユーザーでログイン
  ↓
lessons.html でユーザー名表示を確認
  ↓
ログアウトボタンでログアウト確認
```

---

**Last Updated:** 2026-03-23
