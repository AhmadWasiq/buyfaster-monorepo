Basic OCR
Document AI OCR processor
Mistral Document AI API comes with a Document OCR (Optical Character Recognition) processor, powered by our latest OCR model mistral-ocr-latest, which enables you to extract text and structured content from PDF documents.

Basic OCR Graph
Key features:

Extracts text content while maintaining document structure and hierarchy
Preserves formatting like headers, paragraphs, lists and tables
Returns results in markdown format for easy parsing and rendering
Handles complex layouts including multi-column text and mixed content
Processes documents at scale with high accuracy
Supports multiple document formats including:
image_url: png, jpeg/jpg, avif and more...
document_url: pdf, pptx, docx and more...
The OCR processor returns the extracted text content, images bboxes and metadata about the document structure, making it easy to work with the recognized content programmatically.

OCR with PDF
python
typescript
curl
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({apiKey: apiKey});

const ocrResponse = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
        type: "document_url",
        documentUrl: "https://arxiv.org/pdf/2201.04234"
    },
    includeImageBase64: true
});

Or passing a Base64 encoded pdf:

import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

async function encodePdf(pdfPath) {
    try {
        // Read the PDF file as a buffer
        const pdfBuffer = fs.readFileSync(pdfPath);

        // Convert the buffer to a Base64-encoded string
        const base64Pdf = pdfBuffer.toString('base64');
        return base64Pdf;
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

const pdfPath = "path_to_your_pdf.pdf";

const base64Pdf = await encodePdf(pdfPath);

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

try {
    const ocrResponse = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
            type: "document_url",
            documentUrl: "data:application/pdf;base64," + base64Pdf
        },
        includeImageBase64: true
    });
    console.log(ocrResponse);
} catch (error) {
    console.error("Error processing OCR:", error);
}

Example output:
OCR with uploaded PDF
You can also upload a PDF file and get the OCR results from the uploaded PDF.

Upload a file
python
typescript
curl
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const uploadedFile = fs.readFileSync('uploaded_file.pdf');
const uploadedPdf = await client.files.upload({
    file: {
        fileName: "uploaded_file.pdf",
        content: uploadedFile,
    },
    purpose: "ocr"
});

Retrieve File
python
typescript
curl
const retrievedFile = await client.files.retrieve({
    fileId: uploadedPdf.id
});

id='00edaf84-95b0-45db-8f83-f71138491f23' object='file' size_bytes=3749788 created_at=1741023462 filename='uploaded_file.pdf' purpose='ocr' sample_type='ocr_input' source='upload' deleted=False num_lines=None

Get signed URL
python
typescript
curl
const signedUrl = await client.files.getSignedUrl({
    fileId: uploadedPdf.id,
});

Get OCR results
python
typescript
curl
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({apiKey: apiKey});

const ocrResponse = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
        type: "document_url",
        documentUrl: signedUrl.url,
    },
    includeImageBase64: true
});

OCR with image
python
typescript
curl
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({apiKey: apiKey});

const ocrResponse = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
        type: "image_url",
        imageUrl: "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png",
    },
    includeImageBase64: true
});

Or passing a Base64 encoded image:

import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

async function encodeImage(imagePath) {
    try {
        // Read the image file as a buffer
        const imageBuffer = fs.readFileSync(imagePath);

        // Convert the buffer to a Base64-encoded string
        const base64Image = imageBuffer.toString('base64');
        return base64Image;
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

const imagePath = "path_to_your_image.jpg";

const base64Image = await encodeImage(imagePath);

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

try {
    const ocrResponse = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
            type: "image_url",
            imageUrl: "data:image/jpeg;base64," + base64Image
        },
        includeImageBase64: true
    });
    console.log(ocrResponse);
} catch (error) {
    console.error("Error processing OCR:", error);
}

Coo