import os, uuid, boto3, fitz, tempfile, sys

s3 = boto3.client("s3")

def download_pdf(bucket,object_key,local_path):
    s3.download_file(bucket,object_key,local_path)

def extract_text_from_pdf(local_path):
    pdf_document = fitz.open(local_path)
    text = ""
    for page in pdf_document:
        text += page.get_text()
    return text.strip()

def process_pdf(object_key):
    bucket = os.getenv("S3_BUCKET_NAME")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        local_path = tmp.name

    doc = None
    try:
        s3.download_file(bucket, object_key, local_path)
        doc = fitz.open(local_path)

        text = "".join(page.get_text() for page in doc)
        return text

    finally:
        if doc is not None:
            doc.close()   # 🔴 THIS is the key line
        if os.path.exists(local_path):
            os.remove(local_path)

if __name__ == "__main__":
    object_key = sys.argv[1]
    print(process_pdf(object_key))