export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  content: string;
  chunks: DocumentChunk[];
  embeddings?: number[][];
  summary?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
  metadata: {
    page?: number;
    section?: string;
    wordCount: number;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  score: number;
  relevanceReason: string;
}

export interface QAResult {
  question: string;
  answer: string;
  sources: SearchResult[];
  confidence: number;
  timestamp: Date;
}

export interface ProcessingStatus {
  stage: 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'complete' | 'error';
  progress: number;
  message: string;
}