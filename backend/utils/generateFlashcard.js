const OpenAI = require('openai');

const openai = new OpenAI();
openai.api_key = process.env.OPENAI_API_KEY;

test_text = `But it’s good to begin thinking about   your motivation for starting a startup because it dictates the type of product you should launch.  The Power of Goals  To nail down what you want out of entrepreneurship, you need to decide on your goals. This is a process most people skip due to skepticism about the benefits of the process.  A study at Dominican University 3   revealed that the following 3  factors substantially increased someone’s chance of following  through on their goals:  1.   Written Goals   –   “ Those who wrote their goals accomplished significantly more than those who did not  write their goals.”  2.   Public Commitment   -   “…those who sent their  commitments to a friend accomplished significantly more than those who wrote action commitments or did  not write their goals.”  3.   Accountability   –   “…those who sent wee kly progress reports to their friend accomplished significantly more  than those who had unwritten goals…”  It may feel like you’re an exception; that you don’t need goals or accountability…but trust the science and give   it a shot. Spend 20 minutes making a list of the things you are hoping to accomplish by starting up. If you believe what was said above, it will make a big difference. Worst case, you waste 20 minutes of your time.  Remember that there is no single   best   path to success as a startup founder. Since you are deciding on a specific lifestyle and are making sacrifices to get there, it can look like almost  anything. Just be sure it’s what you want.  3   Summary of Recent Goals Research, by Gail Matthews, Ph.D., Dominican University`;

highlight = `A study at Dominican University3 revealed that the following 3factors substantially increased someone’s chance of followingthrough on their goals:1. Written Goals – “Those who wrote their goalsaccomplished significantly more than those who did notwrite their goals.”2. Public Commitment - “...those who sent theircommitments to a friend accomplished significantlymore than those who wrote action commitments or didnot write their goals.”3. Accountability – “...those who sent weekly progressreports to their friend accomplished significantly morethan those who had unwritten goals...”`

async function generateFlashcards(highlight, page) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant designed to generate flashcards
                  in JSON. It should have the following structure:
                  { 
                    flashcards: [ 
                      { question: "Question 1", answer: "Answer 1" },
                      { question: "Question 2", answer: "Answer 2" } 
                    ] 
                  }
                  The flashcards should only be on the highlight. The page can be used for context. Do not include commas in the answer.`,
      },
      {
        role: 'user',
        content: `Here is the highlight to generate flashcards from: ${highlight}. And here is the context ${page}`
      },
    ],
    model: 'gpt-3.5-turbo-1106',
    response_format: { type: 'json_object' },
  });

  return completion.choices[0].message.content;
}

//generateFlashcards(highlight, test_text);

module.exports.generateFlashcards = generateFlashcards;
