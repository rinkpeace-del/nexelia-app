<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '{}', true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON']);
  exit;
}

$question = trim((string)($data['question'] ?? ''));
$context = trim((string)($data['context'] ?? 'NEXELIA'));
$prompt = trim((string)($data['prompt'] ?? ''));
if ($question === '') {
  http_response_code(400);
  echo json_encode(['error' => 'question is required']);
  exit;
}
if ($prompt === '') {
  $prompt = "中学生向け英語学習サイト NEXELIA を使っています。\n現在の画面: {$context}\n\n質問:\n{$question}\n\n日本語でやさしく解説して、最後に確認クイズを1問出してください。";
}

// =========================================================
// 設定: ここに OpenAI の APIキー を直接貼り付けてください
// 例: $apiKey = 'sk-proj-...';
// =========================================================
$apiKey = ''; 

if ($apiKey === '') {
  $apiKey = getenv('OPENAI_API_KEY') ?: '';
}
if ($apiKey === '' && isset($_SERVER['OPENAI_API_KEY'])) {
  $apiKey = (string)$_SERVER['OPENAI_API_KEY'];
}
if ($apiKey === '') {
  http_response_code(500);
  echo json_encode(['error' => 'OPENAI_API_KEY is not configured on server']);
  exit;
}

$payload = [
  'model' => 'gpt-4o-mini',
  'messages' => [
    [
      'role' => 'system',
      'content' => 'あなたは中学生向け英語学習の先生です。短く、わかりやすく、丁寧に日本語で説明してください。'
    ],
    [
      'role' => 'user',
      'content' => $prompt
    ]
  ]
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
  ],
  CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
  CURLOPT_TIMEOUT => 60
]);

$result = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($result === false) {
  http_response_code(502);
  echo json_encode(['error' => 'Failed to connect OpenAI', 'detail' => $curlErr]);
  exit;
}

$json = json_decode($result, true);
if (!is_array($json)) {
  http_response_code(502);
  echo json_encode(['error' => 'Invalid OpenAI response', 'raw' => mb_substr((string)$result, 0, 300)]);
  exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
  http_response_code($httpCode);
  echo json_encode(['error' => 'OpenAI API error', 'detail' => $json]);
  exit;
}

$answer = '';
if (!empty($json['choices'][0]['message']['content']) && is_string($json['choices'][0]['message']['content'])) {
  $answer = trim($json['choices'][0]['message']['content']);
}

echo json_encode([
  'answer' => $answer !== '' ? $answer : '回答を生成できませんでした。もう一度試してください。'
], JSON_UNESCAPED_UNICODE);

