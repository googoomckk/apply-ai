import os
import uvicorn
from api.index import app

# Port configuration (default to 3000)
PORT = int(os.environ.get("PORT", 3000))

if __name__ == "__main__":
    print(f"Starting ApplyAI Python Server on port {PORT}...")
    # Run the uvicorn server pointing to the api/index.py FastAPI application
    uvicorn.run("api.index:app", host="0.0.0.0", port=PORT, reload=True)
