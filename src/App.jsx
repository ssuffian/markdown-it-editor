import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import MarkdownEditor from './components/MarkdownEditor';
import EChartsEditor from './components/EChartsEditor';
import MultiContentEditor from './components/MultiContentEditor';

const Navigation = () => (
  <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-2">
    <nav className="flex gap-4 items-center max-w-6xl mx-auto">
      <Link 
        to="/markdown" 
        className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
      >
        Markdown Editor
      </Link>
      <Link 
        to="/echarts" 
        className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
      >
        ECharts Editor
      </Link>
      <Link 
        to="/multicontent" 
        className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
      >
        Multi-Content Editor
      </Link>
    </nav>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-16"> {/* Add padding to account for fixed navigation */}
          <Routes>
            <Route path="/markdown" element={<MarkdownEditor />} />
            <Route path="/echarts" element={<EChartsEditor />} />
            <Route path="/multicontent" element={<MultiContentEditor />} />
            <Route path="/" element={<Navigate to="/markdown" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
