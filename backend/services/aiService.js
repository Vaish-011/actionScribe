const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const runPrompt = async ({ system, user, temperature = 0.2 }) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature
  });

  return completion.choices[0].message.content;
};

exports.generateSummary = async (transcript) => {
  return runPrompt({
    system: "You summarize meeting transcripts clearly and concisely.",
    user: `Summarize the following meeting transcript:\n\n${transcript}`,
    temperature: 0.3
  });
};


exports.extractTasks = async (transcript) => {

  return runPrompt({
    system: `
You extract action items from meeting transcripts.

Return ONLY valid JSON array.

Format exactly like this:

[
 { "title": "task description", "owner": "person name", "deadline": "ISO date if explicit else null" }
]

Do not return explanation.
Do not return text outside JSON.
`
    ,
    user: transcript,
    temperature: 0.1
  });
};

exports.extractDecisions = async (transcript) => {
  return runPrompt({
    system: `
Extract key decisions from a meeting transcript.

Return ONLY valid JSON array.

Format exactly like this:

[
 { "decision": "decision summary", "context": "short supporting context" }
]

Do not return explanation.
Do not return text outside JSON.
`
    ,
    user: transcript,
    temperature: 0.1
  });
};

exports.extractTopics = async (transcript) => {
  return runPrompt({
    system: `
Segment a meeting transcript into agenda topics.

Return ONLY valid JSON array.

Format exactly like this:

[
 { "title": "topic title", "content": "short section summary", "startTime": null, "endTime": null }
]

Do not return explanation.
Do not return text outside JSON.
`
    ,
    user: transcript,
    temperature: 0.1
  });

};

exports.generateFollowUpMessage = async ({ assignee, taskTitle, deadline, meetingSummary }) => {
  return runPrompt({
    system: "You write concise professional follow-up reminders for team tasks.",
    user: `Draft a follow-up message.\nAssignee: ${assignee}\nTask: ${taskTitle}\nDeadline: ${deadline || "Not specified"}\nMeeting summary: ${meetingSummary}`,
    temperature: 0.2
  });
};

exports.answerMeetingQuestion = async ({ transcript, summary, question }) => {
  return runPrompt({
    system: "You answer questions using only the provided meeting context. If unknown, say not found in meeting notes.",
    user: `Meeting summary:\n${summary}\n\nTranscript:\n${transcript}\n\nQuestion: ${question}`,
    temperature: 0.1
  });
};