import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import materials from "../models/materials.js";
dotenv.config();
import { spawn } from "child_process";

const processPdf = (objectKey) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["./scripts/pdfOperations.py", objectKey, "--full-text"]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0 || error) {
        reject(error || "Python process failed");
      } else {
        resolve(output);
      }
    });
  });
};


const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generateExamQuestions = async (text, difficult, maxMarks, noQuestions, typeQuestions, portions) => {

  const prompt = `Generate an array of JavaScript objects representing exam questions.

The difficulty level is ${difficult}, the total marks are ${maxMarks}, and the number of questions to generate is ${noQuestions}.  
The allowed question types are strictly limited to ${typeQuestions}.  

⚠️ **SOURCE OF TRUTH (VERY IMPORTANT)**  
You MUST generate questions **ONLY from the following extracted study material text**.  
Do NOT introduce facts, concepts, definitions, examples, or terminology that are not explicitly present or clearly inferable from this text.

PRIMARY CONTENT SOURCE:
${text}

The questions must be strictly based on the following syllabus portions:
${portions}

If any information required to form a question is **not present in the provided text**, DO NOT generate that question.

Ensure:
- The difficulty level strictly matches ${difficult}
- Marks are fairly and logically distributed across all questions
- Question phrasing closely reflects the language and concepts used in the provided text

Each question object must follow this structure EXACTLY:
{
  "questionNo": Number,
  "questionsType": String,
  "question": String,
  "additional": [String],
  "qAnswer": String
}

Rules:
- Full form of MCQ is "multiple choice questions"
- questionNo starts from 1 and increments sequentially
- questionsType must be one of: "MCQ", "TrueFalse", "FillBlank"
- question must be derived directly from the provided text and syllabus portions
- For "MCQ", the "additional" array must contain EXACTLY four answer options
- For non-MCQ types, "additional" must be an empty array
- qAnswer must contain the **actual correct answer text**, NOT option labels
- Do NOT include any question types other than ${typeQuestions}

OUTPUT CONSTRAINTS (STRICT):
- Return ONLY the raw JavaScript array of question objects
- Do NOT include explanations, comments, markdown, variable declarations, or extra text
- Do NOT wrap the output in quotes
- Output must be a valid JavaScript array and nothing else`;


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

const getRelevantContext = (query, sources) => {
  return new Promise((resolve, reject) => {
    // Sources map to 'selectedMaterialIds' which are S3 Object Keys
    const sourceStr = sources.join(",");

    // Spawn python script in search mode
    // Note: 'portions' (syllabus/query) is passed as the search query
    const python = spawn("python", ["./scripts/vectorOperations.py", "--search", query, "--sources", sourceStr]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("Vector Search Error:", error);
        // Don't reject, just resolve empty so flow continues
        resolve("");
      } else {
        try {
          // Output is a JSON list of strings (chunks)
          console.log("Vector Search Output:", output);
          const chunks = JSON.parse(output);
          resolve(chunks.join("\n\n")); // Join chunks with newlines
        } catch (err) {
          console.error("Failed to parse vector search output:", output);
          // If parse fails (e.g. empty), return empty string or fallback
          resolve("");
        }
      }
    });
  });
};

router.post("/generate-AI-questions", async (req, res) => {
  const { examId, difficult, maxMarks, noQuestions, typeQuestions, portions, selectedMaterialIds } = req.body;

  if (!difficult || !maxMarks || !noQuestions || !typeQuestions || !portions) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const exam = await materials.find({ examId });
    if (!exam) {
      console.log("Exam not found");
      return res.status(404).json({ error: "Exam not found" });
    }

    // 1. Fetch Full Text (Legacy)
    let text = "";
    for (const eachexam of exam) {
      console.log(eachexam);
      const object = eachexam.objectKey;
      try {
        const extracted = await processPdf(object);
        text += extracted + "\n\n";
        console.log("Extracted:", extracted.length);
      } catch (err) {
        console.error(`Failed to process ${object}:`, err);
      }
    }

    // 2. Fetch Relevant Context (RAG)
    let contextText = "";
    if (selectedMaterialIds && selectedMaterialIds.length > 0) {
      console.log(`Generating context for query: "${portions}"`);
      contextText = await getRelevantContext(portions, selectedMaterialIds);
      console.log("Retrieved RAG Context Length:", contextText.length);
    }

    // 3. Combine Contexts
    const finalText = text + "\n\n" + "### RELEVANT CONTEXT FROM VECTORS ###\n" + contextText;

    const AIquestions = await generateExamQuestions(finalText, difficult, maxMarks, noQuestions, typeQuestions, portions);
    console.log("AIquestions generated");

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