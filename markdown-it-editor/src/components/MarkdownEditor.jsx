import React, { useState, useEffect, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItCollapsible from 'markdown-it-collapsible';
import markdownItKatex from 'markdown-it-katex';
import markdownItFancyLists from 'markdown-it-fancy-lists';
import markdownItMermaid from 'markdown-it-mermaid';


const BASE_STORAGE_KEY = 'markdown-editor-content';

const MarkdownEditor = () => {
  // State management
  const [filename, setFilename] = useState(() => {
    return localStorage.getItem(`${BASE_STORAGE_KEY}-last-filename`) || 'untitled';
  });
  const [markdown, setMarkdown] = useState(() => {
      try {
        const savedContent = localStorage.getItem(`${BASE_STORAGE_KEY}-${filename}`);
        if (savedContent) {
          const parsed = JSON.parse(savedContent);
          return parsed.text || ``;
        }
      } catch (e) {
        console.warn('Error loading saved content:', e);
      }
      return ``;
    });
  const [html, setHtml] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [savedFiles, setSavedFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [lastEditTime, setLastEditTime] = useState(Date.now());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Load saved files and initialize markdown-it
  useEffect(() => {
    loadSavedFiles();
    initializeMarkdownIt();
  }, []);

  const loadSavedFiles = () => {
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BASE_STORAGE_KEY) && !key.endsWith('last-filename')) {
        const filename = key.replace(`${BASE_STORAGE_KEY}-`, '');
        const content = localStorage.getItem(key);
        const lastModified = JSON.parse(content)?.lastModified || Date.now();
        files.push({ name: filename, lastModified });
      }
    }
    // Sort by filename, most recent first
    files.sort((a, b) => b.filename - a.filename);
    setSavedFiles(files);
  };

  const initializeMarkdownIt = useCallback(() => {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true
    });

    md.use(markdownItCollapsible).use(markdownItKatex).use(markdownItFancyLists).use(markdownItMermaid);

    const content = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-${filename}`) || '{}');
    const renderedHtml = md.render(content?.text || markdown);
    setHtml(renderedHtml);
    
    // Update word and character count
    const text = content?.text || markdown;
    setWordCount(text.trim().split(/\s+/).length);
    setCharCount(text.length);
  }, [filename, markdown]);

  // Save content periodically and when changes occur
  useEffect(() => {
    const saveContent = () => {
      const content = {
        text: markdown,
        lastModified: Date.now()
      };
      localStorage.setItem(`${BASE_STORAGE_KEY}-${filename}`, JSON.stringify(content));
      localStorage.setItem(`${BASE_STORAGE_KEY}-last-filename`, filename);
      loadSavedFiles();
      
      setSaveStatus('Saved!');
      const timer = setTimeout(() => setSaveStatus(''), 2000);
      return () => clearTimeout(timer);
    };

    saveContent();
    initializeMarkdownIt();
  }, [markdown, filename, initializeMarkdownIt]);

  // Auto-save every 30 seconds if changes were made
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Date.now() - lastEditTime < 30000) {
        const content = {
          text: markdown,
          lastModified: Date.now()
        };
        localStorage.setItem(`${BASE_STORAGE_KEY}-${filename}`, JSON.stringify(content));
        setSaveStatus('Auto-saved!');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [markdown, filename, lastEditTime]);

  const handleEditorChange = (e) => {
    setMarkdown(e.target.value);
    setLastEditTime(Date.now());
  };

  const handleFilenameChange = (e) => {
    const newFilename = e.target.value.trim();
    if (newFilename && newFilename !== filename) {
      const content = {
        text: markdown,
        lastModified: Date.now()
      };
      localStorage.setItem(`${BASE_STORAGE_KEY}-${newFilename}`, JSON.stringify(content));
      localStorage.removeItem(`${BASE_STORAGE_KEY}-${filename}`);
      setFilename(newFilename);
      loadSavedFiles();
    }
  };

  const handleFileClick = (selectedFile) => {
    const content = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-${selectedFile.name}`) || '{}');
    setFilename(selectedFile.name);
    setMarkdown(content.text || '');
    setLastEditTime(Date.now());
  };

  const handleNewFile = () => {
    const newFilename = `untitled-${Date.now()}`;
    const content = {
      text: '',
      lastModified: Date.now()
    };
    localStorage.setItem(`${BASE_STORAGE_KEY}-${newFilename}`, JSON.stringify(content));
    setFilename(newFilename);
    setMarkdown('');
    setLastEditTime(Date.now());
    loadSavedFiles();
  };

  const handleDeleteFile = (fileToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
      localStorage.removeItem(`${BASE_STORAGE_KEY}-${fileToDelete.name}`);
      if (fileToDelete.name === filename) {
        handleNewFile();
      }
      loadSavedFiles();
    }
  };

  const handleExport = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredFiles = savedFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`w-full mx-auto p-4 ${isFullscreen ? 'max-w-none' : 'max-w-6xl'}`}>
      <div className="grid grid-cols-[250px_1fr] gap-4">
        {/* File List Panel */}
        <div className="border rounded-lg p-4 h-[calc(100vh-2rem)]">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Files</h2>
              <button
                onClick={handleNewFile}
                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
              >
                New File
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="flex-1 overflow-auto">
              {filteredFiles.map((file) => (
                <div 
                  key={file.name}
                  className={`flex flex-col p-2 rounded cursor-pointer hover:bg-gray-100 mb-2 ${
                    file.name === filename ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate flex-1 font-medium">
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(file.lastModified)}
                  </span>
                </div>
              ))}
              {filteredFiles.length === 0 && (
                <div className="text-gray-500 text-sm text-center">
                  {searchTerm ? 'No matching files' : 'No saved files'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filename}
                  onChange={handleFilenameChange}
                  onBlur={handleFilenameChange}
                  className="px-2 py-1 border rounded text-lg font-semibold"
                  placeholder="Filename"
                  aria-label="Filename"
                />
                <span className="text-sm text-gray-500">.md</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {wordCount} words | {charCount} characters
              </div>
              <span className="text-sm text-green-600">{saveStatus}</span>
              <button
                onClick={handleExport}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Editor</h2>
              <textarea
                className="w-full h-[calc(100vh-300px)] p-2 border rounded font-mono"
                value={markdown}
                onChange={handleEditorChange}
                placeholder="Enter your markdown here..."
              />
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Preview</h2>
              <div 
                className="prose max-w-none h-[calc(100vh-300px)] overflow-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .collapsible {
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 8px 0;
        }
        
        .collapsible-header {
          background-color: #f5f5f5;
          padding: 8px 16px;
          cursor: pointer;
          user-select: none;
        }
        
        .collapsible-header:hover {
          background-color: #eeeeee;
        }
        
        .collapsible-content {
          padding: 8px 16px;
          display: none;
        }
        
        .collapsible.is-open .collapsible-content {
          display: block;
        }

        .text-green-600 {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
