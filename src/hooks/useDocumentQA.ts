import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentChunk, QAResult, ProcessingStatus } from '../types';
import { DocumentParser } from '../services/documentParser';
import { EmbeddingService } from '../services/embeddingService';
import { VectorStore } from '../services/vectorStore';
import { QAService } from '../services/qaService';

export const useDocumentQA = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchHistory, setSearchHistory] = useState<QAResult[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [vectorStore] = useState(() => new VectorStore());
  const [qaService, setQaService] = useState<QAService | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      await vectorStore.initialize();
      setQaService(new QAService(vectorStore));
      
      // Load existing documents
      const existingDocs = await vectorStore.getDocuments();
      setDocuments(existingDocs);
    };

    initializeServices();
  }, [vectorStore]);

  const uploadDocument = useCallback(async (file: File) => {
    try {
      setProcessingStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Starting upload...'
      });

      // Parse document
      setProcessingStatus({
        stage: 'parsing',
        progress: 25,
        message: 'Extracting text from document...'
      });

      const { content, metadata } = await DocumentParser.parseDocument(file);

      // Create document object
      const document: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        content,
        chunks: [],
        summary: content.slice(0, 200) + '...'
      };

      // Chunk text
      setProcessingStatus({
        stage: 'chunking',
        progress: 50,
        message: 'Breaking document into searchable chunks...'
      });

      const textChunks = DocumentParser.chunkText(content);
      const documentChunks = DocumentParser.createDocumentChunks(document, textChunks);

      // Generate embeddings
      setProcessingStatus({
        stage: 'embedding',
        progress: 75,
        message: 'Generating semantic embeddings...'
      });

      const chunksWithEmbeddings = await EmbeddingService.generateEmbeddings(documentChunks);
      document.chunks = chunksWithEmbeddings;

      // Store in vector database
      setProcessingStatus({
        stage: 'embedding',
        progress: 90,
        message: 'Storing in vector database...'
      });

      await vectorStore.storeDocument(document);

      // Update state
      setDocuments(prev => [...prev, document]);

      setProcessingStatus({
        stage: 'complete',
        progress: 100,
        message: 'Document processed successfully!'
      });

      // Clear status after a delay
      setTimeout(() => {
        setProcessingStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Document upload error:', error);
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: `Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [vectorStore]);

  const searchDocuments = useCallback(async (query: string): Promise<QAResult> => {
    if (!qaService) {
      throw new Error('QA service not initialized');
    }

    setIsSearching(true);
    
    try {
      const result = await qaService.answerQuestion(query);
      setSearchHistory(prev => [...prev, result]);
      return result;
    } finally {
      setIsSearching(false);
    }
  }, [qaService]);

  const deleteDocument = useCallback(async (documentId: string) => {
    await vectorStore.deleteDocument(documentId);
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    
    // Remove related search history
    setSearchHistory(prev => 
      prev.filter(result => 
        !result.sources.some(source => source.document.id === documentId)
      )
    );
  }, [vectorStore]);

  const selectDocument = useCallback((document: Document) => {
    // In a real app, this might show document details or focus search on this document
    console.log('Selected document:', document);
  }, []);

  return {
    documents,
    searchHistory,
    processingStatus,
    isSearching,
    uploadDocument,
    searchDocuments,
    deleteDocument,
    selectDocument
  };
};