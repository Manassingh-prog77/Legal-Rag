import os
import faiss
import uuid
import pickle
import pdfplumber
import docx
from tqdm import tqdm
from typing import List, Dict
from sentence_transformers import SentenceTransformer

# --- Configuration ---
DOC_FOLDER = "../cases_citations"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'
INDEX_PATH = "index.faiss"
METADATA_PATH = "metadata.pkl"

# --- Load Model ---
model = SentenceTransformer(MODEL_NAME)

# --- File Readers ---
def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    except Exception as e:
        print(f"❌ PDF Read Error: {pdf_path} – {e}")
        return ""

def extract_text_from_docx(docx_path: str) -> str:
    try:
        doc = docx.Document(docx_path)
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    except Exception as e:
        print(f"❌ DOCX Read Error: {docx_path} – {e}")
        return ""

# --- Chunking ---
def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end].strip())
        start += chunk_size - overlap
    return chunks

# --- Processing ---
def process_documents(folder_path: str):
    all_chunks = []
    metadata = []

    print(f"📂 Scanning folder: {folder_path}")
    for file in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file)
        if file.endswith(".pdf"):
            print(f"📄 Reading PDF: {file}")
            text = extract_text_from_pdf(file_path)
        elif file.endswith(".docx"):
            print(f"📄 Reading DOCX: {file}")
            text = extract_text_from_docx(file_path)
        else:
            continue

        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            metadata.append({
                "id": str(uuid.uuid4()),
                "file_name": file,
                "chunk_id": i,
                "text": chunk
            })
            all_chunks.append(chunk)
    
    return metadata, all_chunks

# --- Embedding ---
def embed_chunks(chunks: List[str]):
    print(f"🧠 Embedding {len(chunks)} chunks...")
    return model.encode(chunks, show_progress_bar=True)

# --- Save ---
def save_to_faiss(embeddings, metadata):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)
    print(f"✅ Saved to {INDEX_PATH} and {METADATA_PATH}")

# --- Main ---
def main():
    metadata, chunks = process_documents(DOC_FOLDER)
    if not chunks:
        print("⚠️ No content found.")
        return
    embeddings = embed_chunks(chunks)
    save_to_faiss(embeddings, metadata)

if __name__ == "__main__":
    main()
