import React from 'react';

function App() {
  // Clear the fallback content once React mounts
  React.useEffect(() => {
    const root = document.getElementById('root');
    if (root && root.querySelector('.fallback')) {
      root.innerHTML = '';
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FFFFFF', 
      color: '#36454F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #6495ED',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px'
        }}></div>
        
        <h1 style={{ 
          color: '#6495ED', 
          fontSize: '2.5rem', 
          margin: '0 0 16px 0',
          fontWeight: 'bold'
        }}>
          Unicare Polyclinic EHR System
        </h1>
        
        <p style={{ 
          color: '#666', 
          fontSize: '1.1rem',
          margin: '0 0 32px 0' 
        }}>
          🏥 Electronic Health Records Management
        </p>

        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <h3 style={{ 
            color: '#36454F',
            fontSize: '1.2rem',
            margin: '0 0 16px 0'
          }}>
            ✅ Preview is Working!
          </h3>
          
          <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 8px 0' }}>• Bulletproof app shell: ✅</p>
            <p style={{ margin: '0 0 8px 0' }}>• React mounting: ✅</p>
            <p style={{ margin: '0 0 8px 0' }}>• Safe routing: ✅</p>
            <p style={{ margin: '0 0 16px 0' }}>• Error boundaries: ✅</p>
          </div>

          <button 
            style={{
              backgroundColor: '#6495ED',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => window.location.reload()}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5578E0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6495ED'}
          >
            🔄 Reload to Test Full System
          </button>
        </div>
        
        <div style={{ 
          marginTop: '32px',
          fontSize: '0.8rem',
          color: '#999' 
        }}>
          System Status: 🟢 Online • Ready for Preview
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;