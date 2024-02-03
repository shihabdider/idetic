require('dotenv').config()

const OpenAI = require('openai');

const openai = new OpenAI();
openai.api_key = process.env.OPENAI_API_KEY;

question = `What are biallelic hits in the context of cancer genomics?`

async function queryGPT(question) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant designed to answer user questions
                  about the book they are reading. Keep answers short and concise.
                  Always use latex formatting for expressing math.`,
      },
      {
        role: 'user',
        content: `The user asks: ${question}.`
      },
    ],
    model: 'gpt-4-turbo-preview',
  });

  return completion.choices[0].message.content;
}

// response = queryGPT(question);
// response.then((response) => {
//   console.log(response);
// });

module.exports.queryGPT = queryGPT;
