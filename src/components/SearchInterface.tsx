import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, Loader, MessageCircle, Clock } from 'lucide-react';
import { QAResult } from '../types';

interface SearchInterfaceProps {
  onSearch: (query: string) => Promise<QAResult>;
  searchHistory: QAResult[];
  isSearching?: boolean;
  className?: string;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearch,
  searchHistory,
  isSearching = false,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<QAResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    try {
      const result = await onSearch(query.trim());
      setCurrentResult(result);
      setQuery('');
      
      // Scroll to results
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    inputRef.current?.focus();
  };

  const quickQueries = [
    "What is the main topic of this document?",
    "Summarize the key points",
    "What are the conclusions?",
    "List the important dates or numbers"
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full pl-12 pr-4 py-4 text-lg border-none outline-none focus:ring-0"
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSearching ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Quick Query Suggestions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 font-medium">Quick questions:</span>
        {quickQueries.map((quickQuery, index) => (
          <button
            key={index}
            onClick={() => handleQuickQuery(quickQuery)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
          >
            {quickQuery}
          </button>
        ))}
      </div>

      {/* Current Result */}
      {currentResult && (
        <div ref={resultsRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-gray-900">Answer</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(currentResult.confidence)}`}>
                  {Math.round(currentResult.confidence * 100)}% confident
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(currentResult.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 font-medium mb-2">Question:</p>
              <p className="text-gray-900">{currentResult.question}</p>
            </div>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {currentResult.answer}
              </p>
            </div>

            {/* Sources */}
            {currentResult.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-4">Sources ({currentResult.sources.length})</h4>
                <div className="space-y-3">
                  {currentResult.sources.map((source, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-900">
                          {source.document.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-blue-600">
                            {Math.round(source.score * 100)}% match
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {source.chunk.metadata.section}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {source.chunk.content}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        {source.relevanceReason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Recent Questions</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {searchHistory.slice(-5).reverse().map((result, index) => (
              <div key={index} className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 font-medium truncate flex-1 mr-4">
                    {result.question}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(result.confidence)}`}>
                      {Math.round(result.confidence * 100)}%
                    </span>
                    <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};