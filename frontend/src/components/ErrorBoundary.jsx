import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      lastRoute: window.location.hash || '/'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
      lastRoute: window.location.hash || '/'
    });
  }

  handleGoToAdmin = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '/admin';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-red-800 mb-4">
                Something went wrong
              </h2>
              <p className="text-red-700 mb-4">
                Unicare encountered an error while loading this page.
              </p>
              
              {this.state.error && (
                <div className="bg-white border border-red-300 rounded p-3 mb-4 text-left">
                  <p className="font-mono text-sm text-red-800 mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  <p className="font-mono text-xs text-red-600">
                    <strong>Route:</strong> {this.state.lastRoute}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-700 text-sm">
                        Show Stack Trace
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={this.handleGoToAdmin}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Admin Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;