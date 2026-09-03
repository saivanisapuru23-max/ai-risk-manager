const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// ---------------- GEMINI SETUP ----------------

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
    })
  : null;

// ---------------- HEALTH CHECK ----------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Risk Manager backend is running",
    aiConfigured: Boolean(apiKey),
  });
});

// ---------------- ANALYZE RISK ----------------

app.post("/api/analyze-risk", async (req, res) => {
  try {
    const {
      projectName,
      systemPurpose,
      aiUsage,
      dataProcessed,
      affectedUsers,
    } = req.body;

    // Validate required fields
    if (!projectName || !systemPurpose || !aiUsage) {
      return res.status(400).json({
        success: false,
        message:
          "Project name, system purpose and AI usage are required.",
      });
    }

    // Check API key
    if (!ai) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini API is not configured. Please check GEMINI_API_KEY in server/.env",
      });
    }

    // ---------------- PROMPT ----------------

    const prompt = `
You are an AI Risk Assessment Analyst.

Your job is to analyze an AI system and identify possible risks.

PROJECT NAME:
${projectName}

SYSTEM PURPOSE:
${systemPurpose}

HOW AI IS USED:
${aiUsage}

DATA PROCESSED:
${dataProcessed || "Not specified"}

AFFECTED USERS:
${affectedUsers || "Not specified"}

Analyze the system across these six categories:

1. Data Privacy
2. Security
3. Bias & Fairness
4. Reliability
5. Compliance
6. Operational

For each category provide:

- score: integer from 0 to 100
- level: Low, Medium, High, or Critical
- description: short explanation
- impact: Low, Medium, or High
- likelihood: Low, Medium, or High
- recommendedAction: practical mitigation action

Also calculate:

- overallScore: integer from 0 to 100
- overallLevel: Low, Medium, High, or Critical
- summary: short overall risk summary

IMPORTANT:
Return ONLY valid JSON.
Do NOT use markdown.
Do NOT use code fences.
Do NOT add any text before or after the JSON.

Use exactly this structure:

{
  "overallScore": 0,
  "overallLevel": "Low",
  "summary": "Short overall risk summary",
  "risks": [
    {
      "name": "Data Privacy",
      "score": 0,
      "level": "Low",
      "description": "Short explanation",
      "impact": "Low",
      "likelihood": "Low",
      "recommendedAction": "Recommended action"
    },
    {
      "name": "Security",
      "score": 0,
      "level": "Low",
      "description": "Short explanation",
      "impact": "Low",
      "likelihood": "Low",
      "recommendedAction": "Recommended action"
    },
    {
      "name": "Bias & Fairness",
      "score": 0,
      "level": "Low",
      "description": "Short explanation",
      "impact": "Low",
      "likelihood": "Low",
      "recommendedAction": "Recommended action"
    },
    {
      "name": "Reliability",
      "score": 0,
      "level": "Low",
      "description": "Short explanation",
      "impact": "Low",
      "likelihood": "Low",
      "recommendedAction": "Recommended action"
    },
    {
      "name": "Compliance",
      "score": 0,
      "level": "Low",
      "description": "Short explanation",
      "impact": "Low",
      "likelihood": "Low",
      "recommendedAction": "Recommended action"
    },
    {
      "name": "Operational",
      "score": 0,
      "level": "Low",
      "description": "Short explanation",
      "impact": "Low",
      "likelihood": "Low",
      "recommendedAction": "Recommended action"
    }
  ]
}
`;

    // ---------------- GEMINI MODELS ----------------

    const models = [
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
    ];

    let response = null;
    let successfulModel = null;
    let lastError = null;

    // Try available models one by one
    for (const model of models) {
      try {
        console.log(`Trying Gemini model: ${model}`);

        response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        successfulModel = model;

        console.log(`Gemini model succeeded: ${model}`);

        break;
      } catch (error) {
        lastError = error;

        console.log(
          `Gemini model ${model} failed:`,
          error?.message || error
        );
      }
    }

    // ---------------- ALL MODELS FAILED ----------------

    if (!response) {
      console.error("All Gemini models failed.");

      return res.status(503).json({
        success: false,
        message:
          "Gemini service is temporarily unavailable. Please try again in a few seconds.",
        details: lastError?.message || "Unknown Gemini error",
      });
    }

    // ---------------- GET RESPONSE ----------------

    const text = response.text;

    if (!text) {
      return res.status(500).json({
        success: false,
        message: "Gemini returned an empty response.",
      });
    }

    console.log(`Risk analysis generated using ${successfulModel}`);

    // ---------------- PARSE JSON ----------------

    let result;

    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error("Invalid JSON returned by Gemini:");
      console.error(text);

      return res.status(500).json({
        success: false,
        message: "Gemini returned an invalid risk analysis response.",
      });
    }

    // ---------------- VALIDATE RESULT ----------------

    if (
      typeof result.overallScore !== "number" ||
      !result.overallLevel ||
      !result.summary ||
      !Array.isArray(result.risks)
    ) {
      return res.status(500).json({
        success: false,
        message: "Invalid risk analysis format received from Gemini.",
      });
    }

    // ---------------- SEND RESULT ----------------

    return res.json({
      success: true,
      model: successfulModel,
      data: result,
    });
  } catch (error) {
    console.error("Risk analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Risk analysis failed.",
      details: error?.message || "Unknown server error",
    });
  }
});

// ---------------- START SERVER ----------------

app.listen(PORT, () => {
  console.log(
    `AI Risk Manager backend running on http://localhost:${PORT}`
  );
});