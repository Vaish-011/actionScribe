const Groq = require("groq-sdk");
const fs = require("fs");

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

const cleanSummaryText = (raw = "") => {
  if (!raw) return "";

  return raw
    .replace(/\*\*/g, "")
    .replace(/^\s*here'?s\s+a\s+clear\s+and\s+concise\s+summary\s+of\s+the\s+meeting\s+transcript\s*:?\s*/i, "")
    .replace(/^\s*here'?s\s+a\s+concise\s+summary\s*:?\s*/i, "")
    .replace(/^\s*meeting\s+summary\s*:?\s*/i, "")
    .trim();
};

exports.generateSummary = async (transcript) => {
  const rawSummary = await runPrompt({
    system: "You summarize meeting transcripts clearly and concisely. Return plain text only, with no markdown, no bold markers, and no preface like 'Here is a summary'.",
    user: `Summarize the following meeting transcript:\n\n${transcript}`,
    temperature: 0.3
  });

  return cleanSummaryText(rawSummary);
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

exports.transcribeAudio = async (audioFilePath) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Configure it to enable audio transcription.");
  }

  const fileStream = fs.createReadStream(audioFilePath);
  const transcription = await groq.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-large-v3-turbo"
  });

  const text = transcription?.text?.trim();
  if (!text) {
    throw new Error("Audio transcription returned empty text.");
  }

  return text;
};