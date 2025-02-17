import React, { useState, useEffect, useCallback } from 'react';
import * as echarts from 'echarts';
import MarkdownIt from 'markdown-it';
import markdownItCollapsible from 'markdown-it-collapsible';
import markdownItKatex from 'markdown-it-katex';
import {markdownItFancyListPlugin} from 'markdown-it-fancy-lists';

const BASE_STORAGE_KEY = 'multi-content-editor';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
}).use(markdownItFancyListPlugin)
  .use(markdownItCollapsible)
  .use(markdownItKatex);

const defaultContent = `[
  {
    "kind": "chart",
    "data": {
      "xAxis": {},
      "yAxis": {},
      "series": [{
        "symbolSize": 20,
        "data": [[10.0, 8.04], [8.07, 6.95]],
        "type": "scatter"
      }]
    }
  },
  {
    "kind": "markdown",
    "data": {
      "text": "## Analysis\\nThis scatter plot shows..."
    }
  }
]`;

const MultiContentEditor = () => {
  // State definitions
  const [filename, setFilename] = useState(() => {
    return localStorage.getItem(`${BASE_STORAGE_KEY}-last-filename`) || 'untitled';
  });

  const [codeInput, setCodeInput] = useState(() => {
    try {
      const savedContent = localStorage.getItem(`${BASE_STORAGE_KEY}-${filename}`);
      if (savedContent) {
        const parsed = JSON.parse(savedContent);
        return parsed.text || defaultContent;
      }
    } catch (e) {
      console.warn('Error loading saved content:', e);
    }
    return defaultContent;
  });
  
  const [contentList, setContentList] = useState([]);
  const [parseError, setParseError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [savedFiles, setSavedFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [lastEditTime, setLastEditTime] = useState(Date.now());
  const [charts, setCharts] = useState([]);

  // Helper functions
  const loadSavedFiles = useCallback(() => {
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
    files.sort((a, b) => b.lastModified - a.lastModified);
    setSavedFiles(files);
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handler functions
  const handleNewFile = useCallback(() => {
    const newFilename = `untitled-${Date.now()}`;
    const content = {
      text: defaultContent,
      lastModified: Date.now()
    };
    localStorage.setItem(`${BASE_STORAGE_KEY}-${newFilename}`, JSON.stringify(content));
    setFilename(newFilename);
    setCodeInput(defaultContent);
    setLastEditTime(Date.now());
    loadSavedFiles();
  }, [loadSavedFiles]);

  const handleFileClick = useCallback((selectedFile) => {
    const content = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-${selectedFile.name}`) || '{}');
    setFilename(selectedFile.name);
    setCodeInput(content.text || defaultContent);
    setLastEditTime(Date.now());
  }, []);

  const handleDeleteFile = useCallback((fileToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
      localStorage.removeItem(`${BASE_STORAGE_KEY}-${fileToDelete.name}`);
      if (fileToDelete.name === filename) {
        handleNewFile();
      }
      loadSavedFiles();
    }
  }, [filename, handleNewFile, loadSavedFiles]);

  const handleEditorChange = useCallback((e) => {
    setCodeInput(e.target.value);
    setLastEditTime(Date.now());
  }, []);

  const handleFilenameChange = useCallback((e) => {
    const newFilename = e.target.value.trim();
    if (newFilename && newFilename !== filename) {
      const content = {
        text: codeInput,
        lastModified: Date.now()
      };
      localStorage.setItem(`${BASE_STORAGE_KEY}-${newFilename}`, JSON.stringify(content));
      localStorage.removeItem(`${BASE_STORAGE_KEY}-${filename}`);
      setFilename(newFilename);
      loadSavedFiles();
    }
  }, [codeInput, filename, loadSavedFiles]);

  // Load saved files on mount
  useEffect(() => {
    loadSavedFiles();
  }, [loadSavedFiles]);

  // Charts management effect
  useEffect(() => {
    // Cleanup old charts
    charts.forEach(chart => {
      try {
        chart?.dispose();
      } catch (e) {
        console.warn('Error disposing chart:', e);
      }
    });
    setCharts([]); // Clear charts array after disposal
    
    try {
      const parsedContent = JSON.parse(codeInput);
      setContentList(parsedContent);
      setParseError('');
      
      // Initialize new charts in next frame to ensure containers exist
      requestAnimationFrame(() => {
        const newCharts = [];
        parsedContent.forEach((item, index) => {
          if (item.kind === 'chart') {
            const container = document.getElementById(`chart-${index}`);
            if (container) {
              try {
                // Check if container already has a chart
                const existingChart = echarts.getInstanceByDom(container);
                if (existingChart) {
                  existingChart.dispose();
                }
                const chart = echarts.init(container);
                chart.setOption(item.data);
                newCharts.push(chart);
              } catch (e) {
                console.warn('Error initializing chart:', e);
              }
            }
          }
        });
        setCharts(newCharts);
      });
    } catch (e) {
      setParseError('Invalid configuration: ' + e.message);
      console.error(e);
    }
  }, [codeInput]);

  // Clean up all charts on unmount
  useEffect(() => {
    return () => {
      charts.forEach(chart => {
        try {
          chart?.dispose();
        } catch (e) {
          console.warn('Error disposing chart:', e);
        }
      });
    };
  }, [charts]);

  // Auto-save effect
  useEffect(() => {
    const saveContent = () => {
      const content = {
        text: codeInput,
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
  }, [codeInput, filename, loadSavedFiles]);

  return (
    <>
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
              
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-4"
              />

              <div className="flex-1 overflow-auto">
                {savedFiles
                  .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((file) => (
                    <div 
                      key={file.name}
                      className={`flex flex-col p-2 rounded cursor-pointer hover:bg-gray-100 mb-2 ${
                        file.name === filename ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate flex-1 font-medium">{file.name}</span>
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
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filename}
                  onChange={handleFilenameChange}
                  onBlur={handleFilenameChange}
                  className="px-2 py-1 border rounded text-lg font-semibold"
                  placeholder="Filename"
                />
                <span className="text-sm text-gray-500">.json</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-600">{saveStatus}</span>
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
                <h2 className="text-lg font-semibold mb-2">Content Configuration</h2>
                <textarea
                  className="w-full h-[calc(100vh-300px)] p-2 border rounded font-mono"
                  value={codeInput}
                  onChange={handleEditorChange}
                  placeholder="Enter your content configuration here..."
                />
                {parseError && (
                  <div className="text-red-500 mt-2 text-sm">{parseError}</div>
                )}
              </div>

              <div className="border rounded-lg p-4 overflow-auto">
                <h2 className="text-lg font-semibold mb-2">Content Preview</h2>
                <div className="space-y-4">
                  {contentList.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {item.kind === 'chart' ? (
                        <div
                          id={`chart-${index}`}
                          className="w-full h-64"
                        />
                      ) : item.kind === 'markdown' ? (
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: md.render(item.data.text) 
                          }}
                        />
                      ) : (
                        <div className="text-red-500">Unknown content type: {item.kind}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
    </>
  );
};

export default MultiContentEditor;
