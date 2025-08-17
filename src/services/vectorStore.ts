import { Document, DocumentChunk, SearchResult } from '../types';
import { EmbeddingService } from './embeddingService';

export class VectorStore {
  private dbName = 'DocumentQA';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('name', 'name', { unique: false });
          docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        }

        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('documentId', 'documentId', { unique: false });
        }
      };
    });
  }

  async storeDocument(document: Document): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['documents', 'chunks'], 'readwrite');
    const docStore = transaction.objectStore('documents');
    const chunkStore = transaction.objectStore('chunks');

    await docStore.put(document);
    
    for (const chunk of document.chunks) {
      await chunkStore.put(chunk);
    }
  }

  async getDocuments(): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['documents', 'chunks'], 'readwrite');
    const docStore = transaction.objectStore('documents');
    const chunkStore = transaction.objectStore('chunks');

    await docStore.delete(documentId);
    
    // Delete all chunks for this document
    const chunkIndex = chunkStore.index('documentId');
    const chunkRequest = chunkIndex.openCursor(IDBKeyRange.only(documentId));
    
    chunkRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  async searchSimilarChunks(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    const queryEmbedding = await EmbeddingService.generateEmbedding(query);
    const documents = await this.getDocuments();
    const results: SearchResult[] = [];

    for (const document of documents) {
      for (const chunk of document.chunks) {
        if (chunk.embedding) {
          const similarity = EmbeddingService.cosineSimilarity(queryEmbedding, chunk.embedding);
          
          if (similarity > 0.1) { // Threshold for relevance
            results.push({
              chunk,
              document,
              score: similarity,
              relevanceReason: this.generateRelevanceReason(query, chunk.content, similarity)
            });
          }
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private generateRelevanceReason(query: string, content: string, score: number): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    const commonWords = queryWords.filter(word => contentWords.includes(word));
    
    if (commonWords.length > 0) {
      return `Contains relevant terms: ${commonWords.slice(0, 3).join(', ')}`;
    } else if (score > 0.5) {
      return 'High semantic similarity to your query';
    } else if (score > 0.3) {
      return 'Moderate semantic relevance';
    } else {
      return 'Related content found';
    }
  }
}