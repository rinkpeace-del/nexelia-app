# NEXELIA 無料版 / 有料版 運用メモ

## 現在の構成

- `free/` : 無料版（`Unit 1-5` のみ）
- `pro/` : 有料版（全Unit）

`FREE_UNIT_LIMIT` の設定:

- `free/lessons.html` → `const FREE_UNIT_LIMIT = 5;`
- `pro/lessons.html` → `const FREE_UNIT_LIMIT = 999;`

## 公開方法（推奨）

1. 無料版URLを公開（例: `https://.../free/`）
2. 有料版URLを公開（例: `https://.../pro/`）
3. BASE購入者には有料版URLのみ案内

## BASE購入後メッセージ例

```
ご購入ありがとうございます。
有料版（全Unit）はこちらからご利用ください。
https://あなたのドメイン/pro/
```

## 更新手順

1. ルートで教材を編集
2. `free/` と `pro/` に同じ更新を反映
3. `pro/lessons.html` の `FREE_UNIT_LIMIT` が `999` になっていることを確認
4. GitHubへコミット/プッシュ
