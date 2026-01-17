"use client";

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Algo salió mal
                </h1>
                <p className="text-red-100">
                  Lo sentimos, ocurrió un error inesperado
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    ¿Qué puedes hacer?
                  </h2>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-sky-500 mt-0.5">•</span>
                      <span>Intenta recargar la página</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-500 mt-0.5">•</span>
                      <span>Vuelve a la página principal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-500 mt-0.5">•</span>
                      <span>Si el problema persiste, contacta al soporte técnico</span>
                    </li>
                  </ul>
                </div>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-6">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 mb-2">
                      Detalles técnicos (solo en desarrollo)
                    </summary>
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-auto">
                      <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Recargar página
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg font-medium transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    Ir al inicio
                  </button>
                </div>

                {/* Support Link */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <a
                    href="mailto:soporte@dentify.com"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar soporte técnico
                  </a>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>Error ID: {Date.now().toString(36)}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simpler error fallback component
export function ErrorFallback({
  error,
  resetError
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Error al cargar
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {error.message || 'Ocurrió un error inesperado'}
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
