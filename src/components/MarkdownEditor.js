import React, { useState, useEffect } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItCollapsible from 'markdown-it-collapsible';

const BASE_STORAGE_KEY = 'markdown-editor-content';

const MarkdownEditor = () => {
  const [filename, setFilename] = useState(() => {
    // Try to get the last used filename from localStorage
    return localStorage.getItem(`${BASE_STORAGE_KEY}-last-filename`) || 'untitled';
  });

  const [markdown, setMarkdown] = useState(() => {
    const savedContent = localStorage.getItem(`${BASE_STORAGE_KEY}-${filename}`);
    return savedContent || `+++ Hello\nABC\n+++`;
  });
  
  const [html, setHtml] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Initialize markdown-it with plugins
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });

    md.use(markdownItCollapsible);

    // Convert markdown to HTML
    const renderedHtml = md.render(markdown);
    setHtml(renderedHtml);

    // Save to localStorage with the current filename
    localStorage.setItem(`${BASE_STORAGE_KEY}-${filename}`, markdown);
    localStorage.setItem(`${BASE_STORAGE_KEY}-last-filename`, filename);
    
    // Show save status
    setSaveStatus('Saved!');
    const timer = setTimeout(() => setSaveStatus(''), 2000);
    
    return () => clearTimeout(timer);
  }, [markdown, filename]);

  const handleEditorChange = (e) => {
    setMarkdown(e.target.value);
  };

  const handleFilenameChange = (e) => {
    const newFilename = e.target.value.trim();
    if (newFilename) {
      // Save current content under new filename
      const currentContent = localStorage.getItem(`${BASE_STORAGE_KEY}-${filename}`);
      localStorage.setItem(`${BASE_STORAGE_KEY}-${newFilename}`, currentContent);
      // Remove content under old filename
      localStorage.removeItem(`${BASE_STORAGE_KEY}-${filename}`);
      setFilename(newFilename);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all content? This cannot be undone.')) {
      setMarkdown('');
      localStorage.removeItem(`${BASE_STORAGE_KEY}-${filename}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Markdown Editor</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filename}
              onChange={handleFilenameChange}
              onBlur={handleFilenameChange}
              className="px-2 py-1 border rounded"
              placeholder="Filename"
              aria-label="Filename"
            />
            <span className="text-sm text-gray-500">.md</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-green-600">{saveStatus}</span>
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Editor */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Editor</h2>
          <textarea
            className="w-full h-64 p-2 border rounded font-mono"
            value={markdown}
            onChange={handleEditorChange}
            placeholder="Enter your markdown here..."
          />
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Styling for collapsible sections */}
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

        /* Add transition for save status */
        .text-green-600 {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
