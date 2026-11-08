import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Root Error Boundary untuk menangkap segala error rendering pada level paling atas
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LINDUNGMAS HST Root Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0F2A4A',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '1.5rem',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              backgroundColor: '#F0B429',
              color: '#0F2A4A',
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              fontWeight: 800
            }}>
              🛡️
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>LINDUNGMAS HST</h2>
            <p style={{ color: '#FCD34D', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
              Pemulihan Tampilan Aplikasi
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
              Sistem mendeteksi kendala pada pemuatan tampilan. Klik tombol di bawah untuk memuat ulang atau memulihkan data sistem ke kondisi normal.
            </p>
            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: '#FDA4AF',
                maxHeight: '140px',
                overflow: 'auto',
                marginBottom: '1.25rem'
              }}>
                <strong>{String(this.state.error?.message || this.state.error)}</strong>
                {this.state.error?.stack && (
                  <pre style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap', color: '#94A3B8', fontSize: '0.65rem' }}>
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#F0B429',
                  color: '#0F2A4A',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Segarkan Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('lindungmas_auth_session');
                  } catch (e) {}
                  window.location.href = '/';
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer'
                }}
              >
                Reset Sesi & Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

