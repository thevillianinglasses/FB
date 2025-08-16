import React, { useState, useEffect } from 'react';

function DiagnosticsOverlay() {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    // Capture window errors
    const handleError = (event) => {
      const log = {
        type: 'error',
        timestamp: new Date().toISOString(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || 'No stack trace',
        route: window.location.hash || '/'
      };
      setLogs(prev => [...prev, log]);
      setIsVisible(true);
    };

    // Capture unhandled promise rejections
    const handleRejection = (event) => {
      const log = {
        type: 'rejection',
        timestamp: new Date().toISOString(),
        message: event.reason?.message || event.reason?.toString() || 'Unhandled rejection',
        error: event.reason?.stack || 'No stack trace',
        route: window.location.hash || '/'
      };
      setLogs(prev => [...prev, log]);
      setIsVisible(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}\nRoute: ${log.route}\nError: ${log.error}\n`
    ).join('\n---\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      alert('Logs copied to clipboard');
    });
  };

  const clearLogs = () => {
    setLogs([]);
    setIsVisible(false);
  };

  if (!isVisible && logs.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-red-900 text-white rounded-lg shadow-lg border border-red-700">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-red-700">
          <h3 className="text-sm font-semibold">
            🚨 Diagnostics ({logs.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-red-200 text-sm"
            >
              {isMinimized ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-red-200 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3">
            <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
              {logs.slice(-3).map((log, index) => (
                <div key={index} className="text-xs bg-red-800 p-2 rounded">
                  <div className="font-semibold">
                    {log.type.toUpperCase()}: {log.message}
                  </div>
                  <div className="text-red-300 mt-1">
                    Route: {log.route}
                  </div>
                  {log.filename && (
                    <div className="text-red-300">
                      File: {log.filename}:{log.lineno}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={copyLogs}
                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
              >
                Copy Log
              </button>
              <button
                onClick={clearLogs}
                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticsOverlay;