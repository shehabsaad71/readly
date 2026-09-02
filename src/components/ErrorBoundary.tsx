/* ========================================
   FREE PDF TTS READER — Error Boundary
   by Analyst Sandeep
   ======================================== */

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorStack: '',
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorStack: errorInfo.componentStack || '',
    });
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      errorMessage: '',
      errorStack: '',
      showDetails: false,
    });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '32px',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: '40px',
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--text-primary)',
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}
          >
            The application encountered an unexpected error.
            Don&apos;t worry — your data is safe. Try refreshing the page
            or resetting the app.
          </p>

          {this.state.errorMessage && (
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => this.setState(prev => ({ ...prev, showDetails: !prev.showDetails }))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
              </button>
              {this.state.showDetails && (
                <div
                  style={{
                    textAlign: 'left',
                    marginTop: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <pre
                    style={{
                      fontSize: '11px',
                      color: '#ef4444',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: '1.5',
                      fontFamily: 'monospace',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      margin: 0,
                    }}
                  >
                    {this.state.errorMessage}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Try Again
            </button>

            <button
              onClick={this.handleRefresh}
              className="btn-gradient"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
              }}
            >
              🔃 Refresh Page
            </button>
          </div>

          <p
            style={{
              marginTop: '32px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            🎧 FREE PDF TTS READER by Analyst Sandeep
          </p>
        </div>
      </div>
    );
  }
}