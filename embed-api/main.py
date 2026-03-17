import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# Global model reference
model: SentenceTransformer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the embedding model once when the server starts."""
    global model
    model_name = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)
    print(f"Model loaded. Embedding dimension: {model.get_sentence_embedding_dimension()}")
    yield
    model = None


app = FastAPI(title="Embedding API", lifespan=lifespan)


# --- Request / Response schemas ---


class EmbedRequest(BaseModel):
    """Accepts a single text or a list of texts."""
    text: str | None = None
    texts: list[str] | None = None


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    dimension: int
    model: str


# --- Routes ---

@app.get("/health")
async def health():
    """Health check — confirms the model is loaded and ready."""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model": os.getenv("MODEL_NAME", "all-MiniLM-L6-v2"),
    }


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    """
    Generate embeddings for one or more texts.

    Send either:
      { "text": "single sentence" }
    or:
      { "texts": ["sentence 1", "sentence 2"] }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    # Collect the texts to embed
    if req.texts:
        texts = req.texts
    elif req.text:
        texts = [req.text]
    else:
        raise HTTPException(status_code=400, detail="Provide 'text' or 'texts'")

    # Generate embeddings
    embeddings = model.encode(texts, normalize_embeddings=True)

    return EmbedResponse(
        embeddings=embeddings.tolist(),
        dimension=model.get_sentence_embedding_dimension(),
        model=os.getenv("MODEL_NAME", "all-MiniLM-L6-v2"),
    )
