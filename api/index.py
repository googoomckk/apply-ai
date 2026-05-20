import os
import json
from fastapi import FastAPI, HTTPException, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env.local (ignored on Vercel production as env vars are set via Vercel dashboard)
load_dotenv(".env.local")

app = FastAPI(title="ApplyAI API Server")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to clean Markdown code fences from the JSON output if present
def clean_json_string(text: str) -> str:
    cleaned = text.strip()
    # Strip leading ```json or ```
    if cleaned.startswith("```"):
        first_line_end = cleaned.find("\n")
        if first_line_end != -1:
            cleaned = cleaned[first_line_end:]
        else:
            cleaned = cleaned[3:]
            
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    return cleaned.strip()

@app.post("/api/compare")
async def compare_resume(request: Request, authorization: str = Header(None), x_api_key: str = Header(None)):
    try:
        # 1. Authenticate request using API_KEY if configured in environmental variables
        server_api_key = os.environ.get("API_KEY")
        if server_api_key and server_api_key.strip():
            client_api_key = x_api_key
            if not client_api_key and authorization:
                if authorization.lower().startswith("bearer "):
                    client_api_key = authorization[7:]
                else:
                    client_api_key = authorization
            
            if client_api_key != server_api_key.strip():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unauthorized: Invalid or missing API Key."
                )

        # 2. Parse request JSON body
        body = await request.json()
        resume_text = body.get("resumeText")
        job_description = body.get("jobDescription")

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume text is required."
            )
        
        if not job_description or not job_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description is required."
            )

        # 3. Check Groq API Key configuration
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key or not groq_api_key.strip():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Groq API Key is not configured on the server. Please set the GROQ_API_KEY environment variable in your deployment configuration."
            )

        print("Initializing comparison via Groq Llama-3.3-70b-versatile...")

        # 4. Initialize Groq client
        client = Groq(api_key=groq_api_key.strip())

        system_instruction = """You are an expert technical recruiter and resume optimization system.
Compare the CV/Resume against the Job Description.
Provide an honest, constructive, and detailed evaluation. Identify all key skills mentioned in the job description, and classify them as matched or missing. Point out specific strengths, gaps, and give concrete suggestions on how to rewrite resume bullet points to improve the match. Also, prepare custom interview questions based on the candidate's gaps.

You MUST respond with a raw JSON object matching this schema structure.
Do NOT wrap your response in markdown code blocks or backticks (e.g. do NOT use ``` or ```json). Just return the raw JSON object structure.

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
}"""

        prompt = f"""Resume/CV:
\"\"\"
{resume_text}
\"\"\"

Job Description:
\"\"\"
{job_description}
\"\"\""""

        # 5. Call Groq model in JSON Mode
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        model_response = chat_completion.choices[0].message.content
        print("Comparison completed successfully.")
        
        # 6. Parse and clean output
        cleaned_text = clean_json_string(model_response)
        parsed_data = json.loads(cleaned_text)
        return parsed_data

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Comparison error:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during comparison: {str(e)}"
        )

# Fallback routes for static client files (mainly used during local preview/production testing)
@app.get("/{rest_of_path:path}")
async def serve_static(request: Request, rest_of_path: str):
    file_path = os.path.join("dist", rest_of_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_path = os.path.join("dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return HTMLResponse("Backend is live. (Frontend build not found)", status_code=404)
