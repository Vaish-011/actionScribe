const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

exports.generateSummary = async (transcript) => {

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You summarize meeting transcripts clearly and concisely."
      },
      {
        role: "user",
        content: `Summarize the following meeting transcript:\n\n${transcript}`
      }
    ],
    temperature: 0.3
  });

  return completion.choices[0].message.content;
};


exports.extractTasks = async (transcript) => {

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You extract action items from meeting transcripts.

Return ONLY valid JSON array.

Format exactly like this:

[
 { "task": "task description", "owner": "person name", "deadline": "time if mentioned or Not specified" }
]

Do not return explanation.
Do not return text outside JSON.
`
      },
      {
        role: "user",
        content: transcript
      }
    ],
    temperature: 0.1
  });

  return completion.choices[0].message.content;
};