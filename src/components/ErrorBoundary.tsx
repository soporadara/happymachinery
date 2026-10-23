import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#090f1a',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '36px 28px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚜</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px' }}>
              Happy Machinery
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              We encountered a temporary display glitch while rendering. Please reload the page or return to the storefront.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#0066ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <a
                href="/"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontWeight: 600
                }}
              >
                Return to Homepage
              </a>
              <a
                href="/store#!/~/cart"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontWeight: 600
                }}
              >
                View Ecwid Cart &rarr;
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
