import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generateExamQuestions = async (difficult, maxMarks, noQuestions, typeQuestions, portions) => {
  const prompt = `Generate an array of JavaScript objects representing exam questions. The difficulty of the exam is ${difficult}, the total marks are ${maxMarks}, and the number of questions to generate is ${noQuestions}. The type of questions required is ${typeQuestions}. All questions should be strictly based on the following syllabus portions: ${portions}.

Ensure the difficulty level matches ${difficult} and marks are fairly distributed across all questions.

Each question object must follow this structure exactly:
{
  "questionNo": Number,
  "questionsType": String, 
  "question": String, 
  "additional": [String], 
  "qAnswer": String
}
full form of MCQ is multi choice questions
questionNo: the question number starting from 1.
questionsType: "MCQ", "TrueFalse", or "FillBlank".
question: The actual question text, generated based on the topic in ${portions} and the difficulty ${difficult}.
additional: if the question type is "MCQ", include **exactly four** answer options as strings; otherwise, leave as an empty array.
qAnswer: the correct answer to the question don't just mention the option(if MCQ) put the text.
**IMPORTANT**:
Return only the array of question objects.
type of questions is limited to ${typeQuestions} no other type of questions to be included
Do NOT include any variable declarations, comments, code formatting, explanations, or markdown.
Just the raw JavaScript array. Nothing else.
Remember: return ONLY a clean array of question objects, not a string.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up potential markdown code blocks
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json|javascript)?\n?/, "").replace(/\n?```$/, "");
    }

    return text.trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}

router.post("/generate-AI-questions", async (req, res) => {
  const { difficult, maxMarks, noQuestions, typeQuestions, portions } = req.body;

  if (!difficult || !maxMarks || !noQuestions || !typeQuestions || !portions) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const AIquestions = await generateExamQuestions(difficult, maxMarks, noQuestions, typeQuestions, portions);
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(AIquestions);
    } catch (parseError) {
      console.error("JSON Parsing failed. Raw response:", AIquestions);
      return res.status(500).json({ error: "Failed to parse AI response", details: parseError.message, raw: AIquestions });
    }
    res.json({ allAiQuestions: parsedQuestions });
  } catch (err) {
    console.error("AI Generation failed:", err);
    res.status(500).json({ error: "AI Generation failed", details: err.message });
  }
});

export default router;