import { DocumentChunk } from '../types';

export class EmbeddingService {
  private static readonly EMBEDDING_DIM = 384;

  // Simplified embedding generation using TF-IDF-like approach
  // In production, you'd use OpenAI embeddings, Hugging Face, or similar
  static async generateEmbedding(text: string): Promise<number[]> {
    // Create a simple bag-of-words embedding
    const words = this.preprocessText(text);
    const vocabulary = this.getVocabulary();
    const embedding = new Array(this.EMBEDDING_DIM).fill(0);
    
    // Simple TF-IDF calculation
    const wordCounts = this.getWordCounts(words);
    const totalWords = words.length;
    
    words.forEach((word, index) => {
      if (vocabulary.has(word)) {
        const vocabIndex = vocabulary.get(word)! % this.EMBEDDING_DIM;
        const tf = wordCounts[word] / totalWords;
        const idf = Math.log(1000 / (vocabulary.get(word) || 1)); // Simulated IDF
        embedding[vocabIndex] += tf * idf;
      }
    });
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  static async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const embeddings = await Promise.all(
      chunks.map(chunk => this.generateEmbedding(chunk.content))
    );
    
    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));
  }

  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private static preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }

  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    return stopWords.has(word);
  }

  private static getWordCounts(words: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    words.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });
    return counts;
  }

  private static getVocabulary(): Map<string, number> {
    // Simulated vocabulary with frequency scores
    const commonWords = [
      'document', 'text', 'content', 'information', 'data', 'analysis', 'report',
      'research', 'study', 'project', 'system', 'process', 'method', 'result',
      'conclusion', 'summary', 'overview', 'introduction', 'background', 'objective'
    ];
    
    const vocabulary = new Map<string, number>();
    commonWords.forEach((word, index) => {
      vocabulary.set(word, index + 1);
    });
    
    return vocabulary;
  }
}