import React, { useState } from 'react';
import { FileText, Search, Upload, Brain, Sparkles } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DocumentGrid } from './components/DocumentGrid';
import { SearchInterface } from './components/SearchInterface';
import { useDocumentQA } from './hooks/useDocumentQA';

function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'search'>('upload');
  
  const {
    documents,
    searchHistory,
    processingStatus,
    isSearching,
    uploadDocument,
    searchDocuments,
    deleteDocument,
    selectDocument
  } = useDocumentQA();

  const tabs = [
    { id: 'upload' as const, label: 'Upload', icon: Upload, count: null },
    { id: 'documents' as const, label: 'Documents', icon: FileText, count: documents.length },
    { id: 'search' as const, label: 'Ask Questions', icon: Search, count: null }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DocumentQA</h1>
                <p className="text-sm text-gray-600">AI-Powered Document Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>Created by Achref Rhouma</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upload Your Documents
              </h2>
              <p className="text-lg text-gray-600">
                Upload PDF, Word documents, or text files to start asking intelligent questions
              </p>
            </div>
            
            <FileUpload
              onFileUpload={uploadDocument}
              processingStatus={processingStatus || undefined}
            />

            {documents.length > 0 && (
              <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">
                    {documents.length} document{documents.length !== 1 ? 's' : ''} ready for Q&A
                  </span>
                </div>
                <p className="text-center text-green-700 mt-2">
                  Switch to the "Ask Questions" tab to start querying your documents
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Document Library
                </h2>
                <p className="text-lg text-gray-600">
                  Manage your uploaded documents and their processing status
                </p>
              </div>
              
              {documents.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Total: {documents.length} document{documents.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {documents.reduce((sum, doc) => sum + doc.chunks.length, 0)} searchable chunks
                  </p>
                </div>
              )}
            </div>

            <DocumentGrid
              documents={documents}
              onDeleteDocument={deleteDocument}
              onSelectDocument={selectDocument}
            />
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ask Your Documents
              </h2>
              <p className="text-lg text-gray-600">
                Get intelligent answers with source citations from your uploaded documents
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No documents available
                </h3>
                <p className="text-gray-500 mb-6">
                  Upload some documents first to start asking questions
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Upload Documents
                </button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <SearchInterface
                  onSearch={searchDocuments}
                  searchHistory={searchHistory}
                  isSearching={isSearching}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Built with ❤️ by <strong>Achref Rhouma</strong>
            </p>
            <p className="text-sm">
              Advanced Document Q&A System with AI-Powered Semantic Search
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;