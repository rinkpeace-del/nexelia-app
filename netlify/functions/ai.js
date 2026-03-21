export async function handler(event) {

  const { question, lesson } = JSON.parse(event.body)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはNEXELIAの英語教師です。次の内容を参考にして答えてください。\n\n${lesson}`
        },
        {
          role: "user",
          content: question
        }
      ]
    })
  })

  const data = await response.json()

  return {
    statusCode: 200,
    body: JSON.stringify({
      answer: data.choices[0].message.content
    })
  }
}