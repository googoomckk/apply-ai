import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const PORT = Number(process.env.PORT) || 3000;
const app = new Hono();

// 1. Middlewares
app.use("*", logger());
app.use("*", cors());

// Helper for cleaning LLM responses that might contain markdown fences
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  return cleaned.trim();
}

// 2. API Endpoint for Resume Comparison
app.post("/api/compare", async (c) => {
  try {
    // Authenticate request using API_KEY if configured
    const serverApiKey = process.env.API_KEY;
    if (serverApiKey && serverApiKey.trim() !== "") {
      const clientApiKey = c.req.header("x-api-key") || c.req.header("Authorization")?.replace("Bearer ", "");
      if (clientApiKey !== serverApiKey) {
        return c.json(
          { error: "Unauthorized: Invalid or missing API Key." },
          { status: 401 }
        );
      }
    }

    const { resumeText, jobDescription } = await c.req.json();

    if (!resumeText || !resumeText.trim()) {
      return c.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    if (!jobDescription || !jobDescription.trim()) {
      return c.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || !groqApiKey.trim()) {
      return c.json(
        {
          error:
            "Groq API Key is not configured on the server. Please set the GROQ_API_KEY environment variable in your .env.local file.",
        },
        { status: 500 }
      );
    }

    console.log("Initializing comparison via Groq Llama-3.3-70b...");

    const groqProvider = createGroq({
      apiKey: groqApiKey,
    });

    const model = groqProvider("llama-3.3-70b-versatile");

    const result = await generateText({
      model,
      experimental_responseFormat: { type: "json_object" },
      system: `You are an expert technical recruiter and resume optimization system.
Compare the CV/Resume against the Job Description.
Provide an honest, constructive, and detailed evaluation. Identify all key skills mentioned in the job description, and classify them as matched or missing. Point out specific strengths, gaps, and give concrete suggestions on how to rewrite resume bullet points to improve the match. Also, prepare custom interview questions based on the candidate's gaps.

You MUST respond with a raw JSON object matching this schema structure.
Do NOT wrap your response in markdown code blocks or backticks (e.g. do NOT use \`\`\` or \`\`\`json). Just return the raw JSON object structure.

Schema:
{
  "score": number (0 to 100),
  "fitLevel": "Excellent Match" | "Strong Match" | "Good Match" | "Fair Match" | "Needs Work",
  "summary": "detailed summary string",
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword3", "keyword4", ...],
  "strengths": ["strength1", ...],
  "gaps": ["gap1", ...],
  "suggestions": [
    {
      "section": "Experience" | "Skills" | "Summary" | etc,
      "original": "original bullet point",
      "suggested": "suggested updated bullet point",
      "rationale": "why this change helps"
    }
  ],
  "interviewPrep": [
    {
      "question": "interview question",
      "strategy": "how to answer"
    }
  ]
}`,
      prompt: `Resume/CV:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""`,
    } as any);

    console.log("Comparison completed successfully.");
    const cleanedText = cleanJsonString(result.text);
    const parsedData = JSON.parse(cleanedText);
    return c.json(parsedData);
  } catch (err: any) {
    console.error("Comparison error:", err);
    return c.json(
      { error: err.message || "An error occurred during comparison." },
      { status: 500 }
    );
  }
});

// 3. Serve static frontend files (Vite build output)
app.use("/*", serveStatic({ root: "./dist" }));

// Fallback to index.html for client-side routing (SPA fallback)
app.get("*", async (c) => {
  const indexFile = Bun.file("./dist/index.html");
  if (await indexFile.exists()) {
    return c.html(await indexFile.text());
  }
  return c.text("Not Found", { status: 404 });
});

console.log(`Starting ApplyAI MVP Server on port ${PORT}...`);

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
});

console.log(`Server successfully started and listening on http://localhost:${PORT}`);

export default server;
