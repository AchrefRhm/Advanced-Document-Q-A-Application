import { Document, DocumentChunk } from '../types';

export class DocumentParser {
  static async parseDocument(file: File): Promise<{ content: string; metadata: any }> {
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
      return this.parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      return this.parseWord(file);
    } else if (fileType === 'text/plain') {
      return this.parseText(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private static async parsePDF(file: File): Promise<{ content: string; metadata: any }> {
    // For demo purposes, we'll simulate PDF parsing
    // In production, you'd use pdf-parse or similar library
    const text = await file.text();
    return {
      content: `[PDF Content Simulation]\n\n${text}\n\nThis is a simulated PDF parsing result. In production, this would extract actual PDF content with proper formatting and metadata.`,
      metadata: { pages: 1, fileType: 'pdf' }
    };
  }

  private static async parseWord(file: File): Promise<{ content: string; metadata: any }> {
    // For demo purposes, we'll simulate Word parsing
    // In production, you'd use mammoth.js or similar library
    const text = await file.text();
    return {
      content: `[Word Document Simulation]\n\n${text}\n\nThis is a simulated Word document parsing result. In production, this would extract actual document content with formatting preservation.`,
      metadata: { pages: 1, fileType: 'docx' }
    };
  }

  private static async parseText(file: File): Promise<{ content: string; metadata: any }> {
    const content = await file.text();
    return {
      content,
      metadata: { fileType: 'txt', encoding: 'utf-8' }
    };
  }

  static chunkText(content: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentSize = 0;
    
    for (const sentence of sentences) {
      const sentenceSize = sentence.trim().length;
      
      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Create overlap by keeping last few sentences
        const overlapSentences = currentChunk.split(/[.!?]+/).slice(-2).join('. ');
        currentChunk = overlapSentences + sentence.trim();
        currentSize = currentChunk.length;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
        currentSize = currentChunk.length;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
  }

  static createDocumentChunks(document: Document, textChunks: string[]): DocumentChunk[] {
    return textChunks.map((chunk, index) => ({
      id: `${document.id}-chunk-${index}`,
      documentId: document.id,
      content: chunk,
      startIndex: document.content.indexOf(chunk),
      endIndex: document.content.indexOf(chunk) + chunk.length,
      metadata: {
        wordCount: chunk.split(/\s+/).length,
        section: `Section ${index + 1}`
      }
    }));
  }
}