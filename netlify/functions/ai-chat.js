exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { question, context } = JSON.parse(event.body);

    if (!question) {
      return { statusCode: 400, body: JSON.stringify({ error: 'question is required' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }) };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは中学生向け英語学習の先生です。短く、わかりやすく、丁寧に日本語で説明してください。'
          },
          {
            role: 'user',
            content: `中学生向け英語学習サイト NEXELIA を使っています。\n現在の画面: ${context || 'NEXELIA'}\n\n質問:\n${question}\n\n日本語でやさしく解説してください。`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: 'OpenAI API error', details: errorData }) };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '回答を生成できませんでした。';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: err.message })
    };
  }
};
