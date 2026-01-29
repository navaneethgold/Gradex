import os, uuid, boto3, fitz, tempfile, sys
import pytesseract
from PIL import Image
import io
import json

# Set Tesseract path if not in PATH (Common Windows path)
# You might need to adjust this based on the user's installation
tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

s3 = boto3.client("s3")

def download_pdf(bucket,object_key,local_path):
    s3.download_file(bucket,object_key,local_path)

def get_page_text(page):
    """
    Extracts text from a single page.
    Tries native extraction first. If text is sparse (<100 chars), falls back to OCR.
    """
    # 1. Try Native Extraction
    text = page.get_text().strip()
    
    # 2. Check if text is sufficient (Threshold: 100 characters)
    # If text is very short, it's likely a scanned page, a diagram, or just a header/footer.
    if len(text) < 100:
        # print(f"Page {page.number + 1}: Insufficient text ({len(text)} chars). Attempting OCR...", file=sys.stderr)
        
        # 3. Fallback to OCR
        # High-resolution rendering for better OCR accuracy
        pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
        img_data = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_data))
        ocr_text = pytesseract.image_to_string(image).strip()
        
        if ocr_text:
            return ocr_text
            
    return text

def process_pdf(object_key):
    bucket = os.getenv("S3_BUCKET_NAME")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        local_path = tmp.name

    doc = None
    try:
        s3.download_file(bucket, object_key, local_path)
        doc = fitz.open(local_path)

        pages_data = []
        for i, page in enumerate(doc):
            page_text = get_page_text(page)
            if page_text:
                pages_data.append({
                    "page": i + 1,
                    "text": page_text,
                    "source": f"s3://{bucket}/{object_key}"
                })

        return json.dumps(pages_data, indent=2)

    except Exception as e:
        print(f"Error processing PDF: {e}", file=sys.stderr)
        return json.dumps([])

    finally:
        if doc is not None:
            doc.close()
        if os.path.exists(local_path):
            os.remove(local_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdfOperations.py <object_key>", file=sys.stderr)
        sys.exit(1)
    
    # Force UTF-8 encoding for stdout to handle special characters on Windows
    sys.stdout.reconfigure(encoding='utf-8')
    object_key = sys.argv[1]
    print(process_pdf(object_key))