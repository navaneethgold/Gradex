import os
import sys
import json
import boto3
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import tempfile

# Initialize S3 Client
s3 = boto3.client("s3")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_PREFIX = "vector_store/"
INDEX_FILE = "vector_store.index"
METADATA_FILE = "metadata_store.json"

# Load Model (Global to avoid reloading if used in a persistent process, though script runs once)
# Using a small, efficient model
model = SentenceTransformer('all-MiniLM-L6-v2')

def download_from_s3(local_dir):
    """Downloads index and metadata from S3 if they exist."""
    print("Checking for existing vector store in S3...")
    index_path = os.path.join(local_dir, INDEX_FILE)
    metadata_path = os.path.join(local_dir, METADATA_FILE)
    
    # Initialize defaults
    index = faiss.IndexFlatL2(384) # 384 dimensions for all-MiniLM-L6-v2
    metadata = {}
    
    try:
        s3.download_file(BUCKET_NAME, S3_PREFIX + INDEX_FILE, index_path)
        print("Downloaded index.")
        index = faiss.read_index(index_path)
    except Exception as e:
        print(f"Index not found or error downloading: {e}. Creating new index.")

    try:
        s3.download_file(BUCKET_NAME, S3_PREFIX + METADATA_FILE, metadata_path)
        print("Downloaded metadata.")
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Metadata not found or error downloading: {e}. Creating new metadata.")

    return index, metadata

def upload_to_s3(local_dir, index, metadata):
    """Save index and metadata to disk, then upload to S3."""
    print("Uploading updated vector store to S3...")
    index_path = os.path.join(local_dir, INDEX_FILE)
    metadata_path = os.path.join(local_dir, METADATA_FILE)

    # Save to disk
    faiss.write_index(index, index_path)
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # Upload
    try:
        s3.upload_file(index_path, BUCKET_NAME, S3_PREFIX + INDEX_FILE)
        s3.upload_file(metadata_path, BUCKET_NAME, S3_PREFIX + METADATA_FILE)
        print("Upload successful.")
    except Exception as e:
        print(f"Error uploading to S3: {e}", file=sys.stderr)
        raise e

def generate_embeddings(chunks):
    """Generates embeddings for a list of text chunks."""
    if not chunks:
        return np.array([])
    embeddings = model.encode(chunks)
    return np.array(embeddings).astype("float32")

def process_and_store(pdf_json_output):
    """
    Main function to process PDF data and update vector store.
    pdf_json_output: List of page objects with 'chunks'
    """
    if not pdf_json_output:
        print("No data to process.")
        return

    # 1. Prepare Data
    new_chunks = []
    new_metadata_entries = []
    
    for page_data in pdf_json_output:
        page_num = page_data.get('page')
        source = page_data.get('source')
        chunks = page_data.get('chunks', [])
        
        for i, chunk in enumerate(chunks):
            new_chunks.append(chunk)
            new_metadata_entries.append({
                "text": chunk,
                "page": page_num,
                "source": source,
                "chunk_id": f"{source}_p{page_num}_c{i}" # Simple unique ID logic
            })

    if not new_chunks:
        print("No chunks found in input.")
        return

    print(f"Processing {len(new_chunks)} new chunks...")

    with tempfile.TemporaryDirectory() as temp_dir:
        # 2. Download Embedding Store
        index, metadata = download_from_s3(temp_dir)
        
        # 3. Generate Embeddings
        embeddings = generate_embeddings(new_chunks)
        
        # 4. Update Index and Metadata
        start_id = index.ntotal
        index.add(embeddings)
        
        for i, entry in enumerate(new_metadata_entries):
            metadata[str(start_id + i)] = entry
            
        print(f"Added {len(new_chunks)} vectors. Total count: {index.ntotal}")

        # 5. Upload Updating Store
        upload_to_s3(temp_dir, index, metadata)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python vectorOperations.py <json_data_string> OR pipe data", file=sys.stderr)
        # Check if piping
        if not sys.stdin.isatty():
             data = sys.stdin.read()
             try:
                 json_data = json.loads(data)
                 process_and_store(json_data)
             except json.JSONDecodeError as e:
                 print(f"Invalid JSON input: {e}", file=sys.stderr)
                 sys.exit(1)
        else:
            sys.exit(1)
    else:
        # Argument mode
        try:
            json_data = json.loads(sys.argv[1])
            process_and_store(json_data)
        except json.JSONDecodeError:
            print("Invalid JSON argument.", file=sys.stderr)
            sys.exit(1)
