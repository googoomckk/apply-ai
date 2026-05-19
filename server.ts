import { serve } from "bun";
import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const PORT = process.env.PORT || 3000;

console.log(`Starting ApplyAI MVP Server on port ${PORT}...`);

serve({
  port: PORT,
  async fetch(req) {
    // Handle CORS headers
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    });

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // 1. API Endpoint for Resume Comparison
    if (url.pathname === "/api/compare" && req.method === "POST") {
      try {
        // Authenticate request using API_KEY if configured
        const serverApiKey = process.env.API_KEY;
        if (serverApiKey && serverApiKey.trim() !== "") {
          const clientApiKey = req.headers.get("x-api-key") || req.headers.get("Authorization")?.replace("Bearer ", "");
          if (clientApiKey !== serverApiKey) {
            return Response.json(
              { error: "Unauthorized: Invalid or missing API Key." },
              { status: 401, headers }
            );
          }
        }

        const { resumeText, jobDescription } = await req.json();

        if (!resumeText || !resumeText.trim()) {
          return Response.json(
            { error: "Resume text is required." },
            { status: 400, headers }
          );
        }

        if (!jobDescription || !jobDescription.trim()) {
          return Response.json(
            { error: "Job description is required." },
            { status: 400, headers }
          );
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey || !groqApiKey.trim()) {
          return Response.json(
            {
              error:
                "Groq API Key is not configured on the server. Please set the GROQ_API_KEY environment variable in your .env.local file.",
            },
            { status: 500, headers }
          );
        }

        console.log("Initializing comparison via Groq Llama-3.3-70b...");

        const groqProvider = createGroq({
          apiKey: groqApiKey,
        });

        const model = groqProvider("llama-3.3-70b-versatile");

        const result = await generateObject({
          model,
          schema: z.object({
            score: z.number().min(0).max(100),
            fitLevel: z.enum([
              "Excellent Match",
              "Strong Match",
              "Good Match",
              "Fair Match",
              "Needs Work",
            ]),
            summary: z.string(),
            matchedKeywords: z.array(z.string()),
            missingKeywords: z.array(z.string()),
            strengths: z.array(z.string()),
            gaps: z.array(z.string()),
            suggestions: z.array(
              z.object({
                section: z.string(),
                original: z.string(),
                suggested: z.string(),
                rationale: z.string(),
              })
            ),
            interviewPrep: z.array(
              z.object({
                question: z.string(),
                strategy: z.string(),
              })
            ),
          }),
          system: `You are an expert technical recruiter and resume optimization system.
Compare the CV/Resume against the Job Description.
Provide an honest, constructive, and detailed evaluation. Identify all key skills mentioned in the job description, and classify them as matched or missing. Point out specific strengths, gaps, and give concrete suggestions on how to rewrite resume bullet points to improve the match. Also, prepare custom interview questions based on the candidate's gaps.`,
          prompt: `Resume/CV:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""`,
        });

        console.log("Comparison completed successfully.");
        return Response.json(result.object, { headers });
      } catch (err: any) {
        console.error("Comparison error:", err);
        return Response.json(
          { error: err.message || "An error occurred during comparison." },
          { status: 500, headers }
        );
      }
    }

    // 2. Serve static frontend files (Vite build output)
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(`./dist${filePath}`);
    
    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback to index.html (for client-side SPA routing)
    const indexFile = Bun.file("./dist/index.html");
    if (await indexFile.exists()) {
      return new Response(indexFile);
    }

    return new Response("Not Found", { status: 404, headers });
  },
});
