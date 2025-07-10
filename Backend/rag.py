from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import numpy as np
import requests
import os
import logging
import json # Import json explicitly
import re # Import re explicitly
from fastapi.middleware.cors import CORSMiddleware

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Environment variables ---
# WARNING: Hardcoding API key is not secure for production.
# Use environment variables instead: os.getenv("GEMINI_API_KEY")
# Example: GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_KEY = "AIzaSyCXj7iUCYWDQXPW3i6ky4Y24beLiINeDBw" # !!! Replace with your actual key

if not GEMINI_API_KEY:
    logging.error("GEMINI_API_KEY is not set! RAG generation will fail.")
    # In a production app, you might want to raise an exception here
    # raise EnvironmentError("GEMINI_API_KEY environment variable not set.")


# --- Load model and index ---
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
INDEX_PATH = "index.faiss"
METADATA_PATH = "metadata.pkl"

model = None
index = None
metadata = None

# Load resources on startup
try:
    logging.info(f"Loading SentenceTransformer model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    logging.info("Model loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load SentenceTransformer model {MODEL_NAME}: {e}")


try:
    logging.info(f"Loading FAISS index from {INDEX_PATH}")
    if not os.path.exists(INDEX_PATH):
         logging.error(f"FAISS index file not found at {INDEX_PATH}")
    else:
        index = faiss.read_index(INDEX_PATH)
        logging.info(f"FAISS index loaded successfully. Index size: {index.ntotal if index else 0}")
except Exception as e:
    logging.error(f"Failed to load FAISS index from {INDEX_PATH}: {e}")


try:
    logging.info(f"Loading metadata from {METADATA_PATH}")
    if not os.path.exists(METADATA_PATH):
         logging.error(f"Metadata file not found at {METADATA_PATH}")
    else:
        with open(METADATA_PATH, "rb") as f:
            metadata = pickle.load(f)
        logging.info(f"Metadata loaded successfully. Number of entries: {len(metadata) if metadata else 0}")
except Exception as e:
    logging.error(f"Failed to load metadata from {METADATA_PATH}: {e}")

# --- Initialize FastAPI app ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a simple root endpoint to check if the server is running and resources are loaded
@app.get("/")
async def read_root():
    status = {}
    status["model_loaded"] = model is not None
    status["index_loaded"] = index is not None
    status["metadata_loaded"] = metadata is not None
    status["index_size"] = index.ntotal if index else 0
    status["metadata_count"] = len(metadata) if metadata else 0

    if not status["model_loaded"] or not status["index_loaded"] or not status["metadata_loaded"]:
        # Return 503 Service Unavailable if critical resources didn't load
        raise HTTPException(status_code=503, detail="Server resources not loaded. Check server logs for details on loading errors.")

    return {"status": "ok", "resource_status": status}


# --- Request model ---
class QueryRequest(BaseModel):
    query: str

# --- Helper: Search top-k chunks from vector DB ---
def search_top_k(query: str, k: int = 5):
    # Check if resources are available before searching
    if model is None or index is None or metadata is None:
        logging.error("Cannot perform search: Resources (model, index, or metadata) not loaded.")
        # In the endpoint, we already check this and return 503, but this prevents errors here
        return []

    try:
        query_embedding = model.encode([query], convert_to_numpy=True)
        # Ensure index is not empty before searching
        if index.ntotal == 0:
            logging.warning("FAISS index is empty. No search performed.")
            return []

        distances, indices = index.search(query_embedding, k)
        results = []
        # Indices are returned as a list of lists (one list per query, even if only one query)
        # Flatten and process valid indices
        valid_indices = [idx for idx in indices[0] if idx >= 0 and idx < len(metadata)]

        for idx in valid_indices:
            entry = metadata[idx]
            results.append({
                "text": entry["text"],
                "source": entry.get("file_name", f"doc_{idx}") # Use a fallback source if missing
            })

        logging.info(f"Found {len(results)} top chunks.")
        # logging.debug(f"Top chunks sources: {[r['source'] for r in results]}") # Uncomment for source list
        return results

    except Exception as e:
        logging.error(f"Error during FAISS search: {e}")
        return []


# --- Helper: Generate answer ---
def generate_answer(query: str, context_chunks: list):
    # Check dependencies
    if not GEMINI_API_KEY:
         logging.error("GEMINI_API_KEY is not set. Cannot call Gemini API.")
         return "Configuration Error: AI model API key not set.", []

    if not context_chunks:
        logging.warning("No context chunks provided to generate_answer.")
        # This case is already handled in the main endpoint, but good check
        return "Could not find relevant information to answer your query in the provided documents.", []

    # --- Build context string with source information included ---
    # Prefix each chunk with its source identifier so Gemini can see it
    formatted_chunks = []
    for i, chunk in enumerate(context_chunks):
        # Use the source from metadata, fallback if missing
        source_id = chunk.get("source", f"chunk_{i+1}")
        # Format: Source [source_id]:\nChunk Text
        formatted_chunks.append(f"Source [{source_id}]:\n{chunk['text']}")

    # Join formatted chunks with a clear separator
    context = "\n\n---\n\n".join(formatted_chunks)

    # --- Update Prompt ---
    # Make instructions for citations clearer and link them to the Source [] format
    prompt = f"""
        You are a helpful legal assistant. Carefully read the following legal excerpts, each prefixed with a source identifier (like "Source [file_name]:"). Based *only* on this context, answer the user's question.

        Context:
        {context}

        Question:
        {query}

        Provide your answer in the following JSON format. Include citations for *each distinct piece of information* you use from the context to form your answer. For each citation, provide the exact snippet from the context that supports that part of your answer and its corresponding source identifier from the "Source [...]" prefix of that snippet.

        Ensure the citation snippets *come directly from the provided Context* and the source is extracted from the "Source [...]" prefix immediately preceding the snippet in the context.

        Respond in the following JSON format only:

        ```json
        {{
          "answer": "Your concise answer here, directly supported by the context.",
          "citations": [
            {{
              "text": "exact snippet 1 from context",
              "source": "source_identifier_from_prefix_for_snippet_1"
            }},
            {{
              "text": "exact snippet 2 from context",
              "source": "source_identifier_from_prefix_for_snippet_2"
            }}
            // ... include all relevant citations corresponding to facts in your answer
          ]
        }}
        ```
        If the provided context does not contain sufficient information to answer the question accurately and completely based *only* on the context, respond in the JSON format stating clearly that you cannot find the information in the provided documents. In this case, the "citations" array should be empty.
        """

    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }

    logging.info("Calling Gemini API...")
    try:
        # Add a longer timeout for API calls
        response = requests.post(url, json=data, headers=headers, timeout=120) # Increased timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        gemini_data = response.json()
        logging.info("Gemini API call successful.")
        # logging.debug(f"Raw Gemini response data: {json.dumps(gemini_data, indent=2)}") # Uncomment for detailed debugging

        # --- Robustly extract text from Gemini response ---
        raw_text = ""
        try:
            # Navigate the potentially nested dictionary structure safely
            raw_text = (
                gemini_data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            if not raw_text:
                 logging.warning("Gemini response 'text' part was empty or not found.")
                 # Check for potential issues reported by the API
                 candidates = gemini_data.get("candidates", [])
                 if candidates:
                     finish_reason = candidates[0].get("finishReason")
                     if finish_reason and finish_reason != "STOP":
                         logging.warning(f"Gemini finished with reason: {finish_reason}") # e.g., SAFETY, OTHER, MAX_TOKENS
                 prompt_feedback = gemini_data.get("promptFeedback")
                 if prompt_feedback:
                     logging.warning(f"Gemini prompt feedback: {prompt_feedback}")

        except Exception as e:
            logging.error(f"Error extracting text from Gemini response structure: {e}")
            # raw_text remains empty, which will be handled below

        # --- Parse JSON block from raw text ---
        match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_text)
        if match:
            json_block = match.group(1).strip() # Strip whitespace from JSON block
            logging.info("Found JSON block in Gemini response.")
            # logging.debug(f"JSON block to parse:\n{json_block}") # Uncomment for debugging

            try:
                parsed = json.loads(json_block)
                logging.info("Successfully parsed JSON.")
                # Safely extract answer and citations with default values
                answer = parsed.get("answer", "(Error) 'answer' key not found in parsed JSON.")
                citations = parsed.get("citations", []) # Default to empty list

                if not isinstance(citations, list):
                    logging.warning(f"'citations' key in JSON was not a list. Received type: {type(citations)}. Setting citations to empty list.")
                    citations = [] # Ensure citations is a list

                # Optional: Add basic validation for citation format
                valid_citations = []
                for i, cite in enumerate(citations):
                    if isinstance(cite, dict) and "text" in cite and "source" in cite:
                        valid_citations.append(cite)
                    else:
                        logging.warning(f"Invalid citation format at index {i}: {cite}. Skipping.")
                citations = valid_citations # Only keep valid ones

                logging.info(f"Returning answer and {len(citations)} citations.")
                return answer, citations

            except json.JSONDecodeError as e:
                logging.error(f"JSON Decode Error: Failed to parse JSON from Gemini response: {e}")
                logging.error(f"Faulty JSON block was:\n{json_block}") # Log the block that failed to parse
                return "(Error) Failed to parse JSON response from AI model.", []
            except Exception as e:
                 # Catch any other unexpected errors during parsing or extraction
                 logging.error(f"An unexpected error occurred after finding JSON block: {e}")
                 return "(Error) An internal error occurred during response processing.", []

        else:
            logging.warning("No JSON block found in Gemini response.")
            logging.warning(f"Raw Gemini text response was: {raw_text[:500]}...") # Log start of response for debugging
            return "(Error) AI model did not return the expected JSON format.", []

    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP error calling Gemini API: {e.response.status_code} - {e.response.text}")
        return f"API Error: Received status code {e.response.status_code} from AI model.", []
    except requests.exceptions.ConnectionError as e:
        logging.error(f"Connection error calling Gemini API: {e}")
        return "API Error: Could not connect to the AI model.", []
    except requests.exceptions.Timeout as e:
        logging.error(f"Timeout error calling Gemini API: {e}")
        return "API Error: AI model response timed out.", []
    except requests.exceptions.RequestException as e:
        logging.error(f"An unexpected RequestException occurred calling Gemini API: {e}")
        return "API Error: An unexpected error occurred during the API call.", []
    except Exception as e:
        # This catches any other unexpected errors during the process
        logging.error(f"An unexpected error occurred during generate_answer: {e}")
        return "(Error) An unexpected internal error occurred.", []


# --- Endpoint ---
@app.post("/query")
async def query_legal_docs(request: QueryRequest):
    # Ensure resources are loaded before processing any query
    if model is None or index is None or metadata is None:
        logging.error("Attempted to process query but resources (model, index, or metadata) are not loaded.")
        raise HTTPException(status_code=503, detail="Server is not ready. Resources failed to load on startup. Check server logs.")

    logging.info(f"Received query: {request.query[:100]}...") # Log incoming query

    # Retrieve top chunks based on the query
    top_chunks = search_top_k(request.query, k=5)

    # Handle case where no relevant chunks were found
    if not top_chunks:
        logging.warning("search_top_k returned no chunks for the query.")
        # Return a specific message if no context was found, without calling the LLM
        return {
            "answer": "Could not find any relevant information in the documents for your query.",
            "citations": []
        }

    # Generate the answer and citations using the retrieved chunks
    answer, citations = generate_answer(request.query, top_chunks)

    # The generate_answer function already handles errors and returns appropriate messages/empty citations
    # We can return the result directly
    return {
        "answer": answer,
        "citations": citations
    }