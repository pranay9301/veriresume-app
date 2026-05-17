import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for PDF.js
// Use a stable CDN URL for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js`;

/**
 * Extracts text content from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText.trim();
}

/**
 * Extracts text content from a DOCX file
 * @param {File} file - The DOCX file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Extracts text content from a plain text file
 * @param {File} file - The text file to read
 * @returns {Promise<string>} - File content as text
 */
export function parseTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Determines file type and extracts text accordingly
 * @param {File} file - The file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromFile(file) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return await parsePDF(file);
  } else if (fileName.endsWith('.docx')) {
    return await parseDOCX(file);
  } else if (fileName.endsWith('.txt')) {
    return await parseTXT(file);
  } else {
    throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT files.');
  }
}

/**
 * Gets a user-friendly file type label
 * @param {string} fileName - The name of the file
 * @returns {string} - Human-readable file type
 */
export function getFileTypeLabel(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'PDF Document';
    case 'docx': return 'Word Document';
    case 'txt': return 'Text File';
    default: return 'Unknown File';
  }
}
