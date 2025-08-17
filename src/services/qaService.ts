import { SearchResult, QAResult } from '../types';
import { VectorStore } from './vectorStore';

export class QAService {
  private vectorStore: VectorStore;

  constructor(vectorStore: VectorStore) {
    this.vectorStore = vectorStore;
  }

  async answerQuestion(question: string): Promise<QAResult> {
    // Search for relevant chunks
    const searchResults = await this.vectorStore.searchSimilarChunks(question, 5);
    
    if (searchResults.length === 0) {
      return {
        question,
        answer: "I couldn't find relevant information in your documents to answer this question. Please try rephrasing your question or upload more relevant documents.",
        sources: [],
        confidence: 0,
        timestamp: new Date()
      };
    }

    // Generate answer based on search results
    const answer = this.generateAnswer(question, searchResults);
    const confidence = this.calculateConfidence(searchResults);

    return {
      question,
      answer,
      sources: searchResults,
      confidence,
      timestamp: new Date()
    };
  }

  private generateAnswer(question: string, searchResults: SearchResult[]): string {
    // Simple answer generation - in production, you'd use GPT or similar
    const relevantContent = searchResults
      .slice(0, 3) // Top 3 most relevant chunks
      .map(result => result.chunk.content)
      .join('\n\n');

    // Extract key information based on question type
    if (this.isDefinitionQuestion(question)) {
      return this.generateDefinitionAnswer(question, relevantContent);
    } else if (this.isHowToQuestion(question)) {
      return this.generateHowToAnswer(question, relevantContent);
    } else if (this.isWhyQuestion(question)) {
      return this.generateWhyAnswer(question, relevantContent);
    } else {
      return this.generateGeneralAnswer(question, relevantContent);
    }
  }

  private isDefinitionQuestion(question: string): boolean {
    const definitionWords = ['what is', 'what are', 'define', 'definition', 'meaning'];
    return definitionWords.some(word => question.toLowerCase().includes(word));
  }

  private isHowToQuestion(question: string): boolean {
    return question.toLowerCase().includes('how to') || question.toLowerCase().includes('how do');
  }

  private isWhyQuestion(question: string): boolean {
    return question.toLowerCase().startsWith('why');
  }

  private generateDefinitionAnswer(question: string, content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevantSentences = sentences.slice(0, 2);
    
    return `Based on the documents, ${relevantSentences.join('. ')}.`;
  }

  private generateHowToAnswer(question: string, content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const steps = sentences.filter(s => 
      s.includes('first') || s.includes('then') || s.includes('next') || s.includes('finally') ||
      s.includes('step') || s.includes('process')
    );
    
    if (steps.length > 0) {
      return `Here's what I found in the documents:\n\n${steps.slice(0, 3).join('.\n\n')}.`;
    } else {
      return `Based on the available information: ${sentences.slice(0, 2).join('. ')}.`;
    }
  }

  private generateWhyAnswer(question: string, content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const explanatoryWords = ['because', 'since', 'due to', 'reason', 'cause', 'result'];
    
    const explanatorySentences = sentences.filter(s => 
      explanatoryWords.some(word => s.toLowerCase().includes(word))
    );
    
    if (explanatorySentences.length > 0) {
      return `According to the documents: ${explanatorySentences.slice(0, 2).join('. ')}.`;
    } else {
      return `Based on the available information: ${sentences.slice(0, 2).join('. ')}.`;
    }
  }

  private generateGeneralAnswer(question: string, content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return `Based on your documents:\n\n${sentences.slice(0, 3).join('.\n\n')}.`;
  }

  private calculateConfidence(searchResults: SearchResult[]): number {
    if (searchResults.length === 0) return 0;
    
    const avgScore = searchResults.reduce((sum, result) => sum + result.score, 0) / searchResults.length;
    const topScore = searchResults[0]?.score || 0;
    
    // Confidence based on average similarity score and number of results
    const baseConfidence = (avgScore + topScore) / 2;
    const resultBonus = Math.min(searchResults.length / 5, 1) * 0.2;
    
    return Math.min(baseConfidence + resultBonus, 1);
  }
}