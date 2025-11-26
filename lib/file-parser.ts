
/**
 * File Parser Library
 * Handles parsing of various file types (PDF, DOCX, XLSX) for knowledge base
 */

import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

// @ts-ignore - pdf-parse has inconsistent types
const pdfParse = require('pdf-parse');

export interface ParsedFile {
  text: string;
  metadata?: {
    pages?: number;
    sheets?: string[];
    [key: string]: any;
  };
}

/**
 * Parse PDF file to text
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedFile> {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
      },
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parse DOCX file to text
 */
export async function parseDOCX(buffer: Buffer): Promise<ParsedFile> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      metadata: {
        warnings: result.messages,
      },
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Parse XLSX file to text
 */
export async function parseXLSX(buffer: Buffer): Promise<ParsedFile> {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    let text = '';
    const sheets: string[] = [];
    
    sheetNames.forEach((sheetName) => {
      sheets.push(sheetName);
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = xlsx.utils.sheet_to_csv(worksheet);
      text += `\n\n=== ${sheetName} ===\n${sheetData}`;
    });
    
    return {
      text: text.trim(),
      metadata: {
        sheets,
        totalSheets: sheetNames.length,
      },
    };
  } catch (error) {
    console.error('Error parsing XLSX:', error);
    throw new Error('Failed to parse XLSX file');
  }
}

/**
 * Parse file based on mime type
 */
export async function parseFile(buffer: Buffer, mimeType: string): Promise<ParsedFile> {
  const normalizedMime = mimeType.toLowerCase();
  
  if (normalizedMime.includes('pdf')) {
    return parsePDF(buffer);
  } else if (normalizedMime.includes('word') || normalizedMime.includes('document') || normalizedMime.includes('.document')) {
    return parseDOCX(buffer);
  } else if (normalizedMime.includes('spreadsheet') || normalizedMime.includes('excel') || normalizedMime.includes('sheet')) {
    return parseXLSX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(mimeType: string): boolean {
  const normalizedMime = mimeType.toLowerCase();
  return (
    normalizedMime.includes('pdf') ||
    normalizedMime.includes('word') ||
    normalizedMime.includes('document') ||
    normalizedMime.includes('spreadsheet') ||
    normalizedMime.includes('excel') ||
    normalizedMime.includes('sheet')
  );
}
