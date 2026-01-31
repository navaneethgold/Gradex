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

import argparse

def download_from_s3(local_dir):
    """Downloads index and metadata from S3 if they exist."""
    print("Checking for existing vector store in S3...", file=sys.stderr)
    index_path = os.path.join(local_dir, INDEX_FILE)
    metadata_path = os.path.join(local_dir, METADATA_FILE)
    
    # Initialize defaults
    index = faiss.IndexFlatL2(384) # 384 dimensions for all-MiniLM-L6-v2
    metadata = {}
    
    try:
        s3.download_file(BUCKET_NAME, S3_PREFIX + INDEX_FILE, index_path)
        print("Downloaded index.", file=sys.stderr)
        index = faiss.read_index(index_path)
    except Exception as e:
        print(f"Index not found or error downloading: {e}. Creating new index.", file=sys.stderr)

    try:
        s3.download_file(BUCKET_NAME, S3_PREFIX + METADATA_FILE, metadata_path)
        print("Downloaded metadata.", file=sys.stderr)
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Metadata not found or error downloading: {e}. Creating new metadata.", file=sys.stderr)

    return index, metadata

def upload_to_s3(local_dir, index, metadata):
    """Save index and metadata to disk, then upload to S3."""
    print("Uploading updated vector store to S3...", file=sys.stderr)
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
        print("Upload successful.", file=sys.stderr)
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
        print("No data to process.", file=sys.stderr)
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
        print("No chunks found in input.", file=sys.stderr)
        return

    print(f"Processing {len(new_chunks)} new chunks...", file=sys.stderr)

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
            
        print(f"Added {len(new_chunks)} vectors. Total count: {index.ntotal}", file=sys.stderr)

        # 5. Upload Updating Store
        upload_to_s3(temp_dir, index, metadata)

def search_vector_store(query, allowed_sources=None, k=10):
    """
    Searches the vector store for the query.
    Filters results to only include chunks from allowed_sources.
    """
    print(f"Searching for: '{query}' in sources: {allowed_sources}...", file=sys.stderr)
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Download
        index, metadata = download_from_s3(temp_dir)
        
        if index.ntotal == 0:
            print("Index is empty.", file=sys.stderr)
            return []

        # 2. Embed Query
        query_vector = model.encode([query]).astype("float32")
        
        # 3. Search (Fetch more to allow for filtering)
        # If we need 10 results but filter 80% out, we need a larger pool.
        fetch_k = 50 
        distances, indices = index.search(query_vector, fetch_k)
        
        results = []
        source_set = set(allowed_sources) if allowed_sources else None
        
        # 4. Filter and Format
        for i, idx in enumerate(indices[0]):
            if idx == -1: continue
            
            meta = metadata.get(str(idx))
            if not meta: continue
            
            # Filter by source
            if source_set and meta.get('source') not in source_set:
                continue
                
            results.append(meta.get('text'))
            
            if len(results) >= k:
                break
                
        return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vector Store Operations")
    parser.add_argument("--search", type=str, help="Query string for similarity search")
    parser.add_argument("--sources", type=str, help="Comma-separated list of allowed S3 object keys")
    
    args, unknown = parser.parse_known_args()
    
    if args.search:
        # Search Mode
        sources = args.sources.split(",") if args.sources else None
        results = search_vector_store(args.search, sources)
        print(json.dumps(results)) # Output JSON list of strings for Node.js to parse
    else:
        # Ingestion Mode (Default / Pipe)
        if not sys.stdin.isatty():
             data = sys.stdin.read()
             try:
                 json_data = json.loads(data)
                 process_and_store(json_data)
             except json.JSONDecodeError as e:
                 print(f"Invalid JSON input: {e}", file=sys.stderr)
                 sys.exit(1)
        elif len(sys.argv) > 1:
             # Try to parse first arg as JSON (Legacy support)
            try:
                json_data = json.loads(sys.argv[1])
                process_and_store(json_data)
            except json.JSONDecodeError:
                pass # Argument likely processed by argparse if valid
        else:
             parser.print_help()
