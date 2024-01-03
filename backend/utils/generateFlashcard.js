const OpenAI = require('openai');

const openai = new OpenAI();

test_text = `Jod Gumbaz is a complex of two tombs located in Bijapur, in the Indian state of Karnataka.[1] Built during the late Adil Shahi period and completed in 1687,[2] it contains the tombs of Khan Muhammad and his spiritual advisor Abdul Razzaq Qadiri. A third, smaller tomb is located towards the west of the complex.

Background
The Jod Gumbaz dates back to the late Adil Shahi period. The tombs were erected for Khan Muhammad and his spiritual advisor Abdul Razzaq Qadiri.[3]

Khan Muhammad "the traitor" was a military commander in service of the Adil Shahis, and had been bribed into switching allegiances in favour of the Mughals. This information was given to the Adil Shahi ruler by Afzal Khan, who was also in the field. Khan Muhammad was recalled to Bijapur, and was assassinated. Subsequently, the Mughal emperor Aurangzeb ordered that a mausoleum be built for him using the taxes paid by Bijapur to the Mughals for one year. Later, Khan Muhammad's son, entitled Khawas Khan, who was also executed for his allegiance to the Mughals, was also buried within the same tomb. The tomb of Abdul Razzaq Qadiri, who was Khan Muhammad's spiritual advisor was also built around the same time.[4]


The Jod Gumbaz, described as "Tombs of Negro Nobles, Beejapoor", photographed by Henry Hinton, ca. 1855–1862
During the British period, the tomb of Khan Muhammad was used as an office and dwelling for the executive engineer.[4][5] The compound was being used for the residence of the sessions judge of Bijapur up until 1918, when the Archaeological Survey of India cleared all encroachments.[6] Due to the reverence Muslims had for Abdul Razzaq, his tomb was not repurposed.[4] The complex is now protected as a monument of national importance.[7]


The tomb of Khan Muhammad
The tombs are located on a high elevation, because the vaults are located above ground level, which is usually not the case.[4] The tomb of Khan Muhammad is an octagonal building to the south of the complex.[4] A trefoil-patterned parapet rises above the hall, with finials at each corner.[8] It is surmounted by a dome, resting on a lotus-shaped base. Abdul Razzaq Qadiri's tomb is a square building to the north of the complex, and larger than the tomb of Khan Muhammad.[4] It is similar in design, with the trefoil patterned parapet, finials on the corners, and dome rising above a lotus-shaped base. This mausoleum is revered as a dargah.[1] A smaller mausoleum located towards the west of the Jod Gumbaz is the burial place of Sidi Rehan, an officer during the reign of Muhammad Adil Shah.[4]`;

highlight = `During the British period, the tomb of Khan Muhammad was used as an office and dwelling for the executive engineer.`

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
                  The flashcards should only be on the highlight. The page can be used for context`,
      },
      {
        role: 'user',
        content: `Here is the highlight to generate flashcards from: ${highlight}. And here is the context ${page}`
      },
    ],
    model: 'gpt-3.5-turbo-1106',
    response_format: { type: 'json_object' },
  });

  return completion.data.choices[0].message.content;
}

module.exports.generateFlashcards = generateFlashcards;
