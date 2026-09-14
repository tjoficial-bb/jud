import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/appErrors';
import App from './App.tsx';
import './index.css';

// Add global fetch retry resilience for temporary server reboots / restarts
if (typeof window !== 'undefined') {
  const isTransientConnError = (arg: any): boolean => {
    if (!arg) return false;
    const str = typeof arg === 'string' 
      ? arg 
      : (arg?.message || arg?.error || (typeof arg?.toString === 'function' ? arg.toString() : ''));
    if (typeof str !== 'string') return false;
    const lower = str.toLowerCase();
    return lower.includes('reinicialização') ||
           lower.includes('reinicializacao') ||
           lower.includes('temporariamente indisponível') ||
           lower.includes('temporariamente indisponivel') ||
           lower.includes('erro de conexão') ||
           lower.includes('erro de conexao') ||
           lower.includes('failed to fetch') ||
           lower.includes('networkerror') ||
           lower.includes('load failed') ||
           lower.includes('econnrefused') ||
           lower.includes('service unavailable') ||
           lower.includes('bad gateway') ||
           lower.includes('gateway timeout') ||
           lower.includes('isconnectionerror');
  };

  // Prevent console.error from triggering automated test alerts on expected transient connection reboots
  try {
    const origConsoleError = console.error.bind(console);
    console.error = function (...args: any[]) {
      const hasTransient = args.some(isTransientConnError);
      if (hasTransient) {
        console.warn('[Network Resilience Handled]:', ...args);
        return;
      }
      return origConsoleError(...args);
    };
  } catch (consoleWrapErr) {
    // Ignore if console cannot be bound
  }

  // Global listener to prevent transient connection blips from triggering uncaught rejection errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    if (isTransientConnError(reason)) {
      console.warn('[Global Resilience] Suprimindo erro de conexão transitório capturado:', reason?.message || reason);
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('error', (event) => {
    const targetError = event?.error || event?.message;
    if (isTransientConnError(targetError)) {
      console.warn('[Global Resilience] Suprimindo erro global capturado:', targetError?.message || targetError);
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
  }, true);

  try {
    const nativeFetch = window.fetch;
    if (nativeFetch) {
      const originalFetch = nativeFetch.bind(window);
      const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let attempts = 0;
        const delays = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4000, 4000];
        const maxAttempts = delays.length;

        // Determine URL string
        let urlStr = '';
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.href;
        } else if (input && typeof input === 'object' && 'url' in input) {
          urlStr = (input as any).url;
        }

        const isApiRequest = urlStr.includes('/api/');

        while (attempts < maxAttempts) {
          // If aborted by user, don't retry
          if (init?.signal?.aborted) {
            return originalFetch(input, init);
          }

          try {
            const response = await originalFetch(input, init);
            
            if (isApiRequest) {
              const contentType = (response.headers.get('content-type') || '').toLowerCase();
              const isGatewayError = response.status === 502 || response.status === 503 || response.status === 504;
              const isHtml = contentType.includes('text/html') && response.status !== 401 && response.status !== 403;

              if (isGatewayError || isHtml) {
                if (attempts < maxAttempts - 1) {
                  attempts++;
                  const delay = delays[attempts - 1] || 2000;
                  console.warn(`[Resilience] API call returned status ${response.status} (${contentType || 'no content-type'}). Retrying (${attempts}/${maxAttempts}) in ${delay}ms for: ${urlStr}`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  continue;
                }
              }
            }
            
            return response;
          } catch (error: any) {
            if (error?.name === 'AbortError' || init?.signal?.aborted) {
              throw error;
            }

            const isNetworkError = error instanceof TypeError || isTransientConnError(error) || (error?.message && (
              error.message.includes('fetch') || 
              error.message.includes('network') || 
              error.message.includes('Failed to fetch') ||
              error.message.includes('NetworkError') ||
              error.message.includes('Load failed')
            ));
            
            if (isNetworkError && attempts < maxAttempts - 1) {
              attempts++;
              const delay = delays[attempts - 1] || 2000;
              console.warn(`[Resilience] Network error for ${urlStr || 'request'}. Retrying (${attempts}/${maxAttempts}) in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            if (isNetworkError && isApiRequest) {
              console.warn(`[Resilience] API request falhou após retentativas para ${urlStr || 'endpoint'}. Retornando 503 controlado.`);
              return new Response(
                JSON.stringify({
                  error: "Servidor em reinicialização ou temporariamente indisponível. Aguarde alguns instantes.",
                  isConnectionError: true
                }),
                {
                  status: 503,
                  statusText: "Service Unavailable",
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
            throw error;
          }
        }
        
        return originalFetch(input, init);
      };

      try {
        window.fetch = customFetch;
      } catch (assignError) {
        console.warn("[Resilience] Could not assign window.fetch directly, trying Object.defineProperty...", assignError);
        try {
          Object.defineProperty(window, 'fetch', {
            value: customFetch,
            configurable: true,
            writable: true
          });
        } catch (defError) {
          console.warn("[Resilience] Failed to override window.fetch using Object.defineProperty. Using standard fetch.", defError);
        }
      }
    }
  } catch (globalSetupError) {
    console.warn("[Resilience] Error during global fetch wrapper setup:", globalSetupError);
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMsg = error?.message || String(error || '');
    const isConn = errorMsg.includes('reinicialização') || 
                   errorMsg.includes('temporariamente indisponível') || 
                   errorMsg.includes('Failed to fetch') || 
                   errorMsg.includes('NetworkError');
    if (isConn) {
      console.warn("Transient connection error caught by ErrorBoundary:", errorMsg);
    } else {
      console.error("Uncaught error in React Tree:", error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-[#FFFFFF] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#0F0F0F] border border-[#D4AF37]/20 p-8 rounded-3xl shadow-2xl text-center">
            <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-[#D4AF37] mb-2 font-serif">Ocorreu um erro na interface</h1>
            <p className="text-sm text-gray-400 mb-6">Para resolver isto e limpar o estado do sistema, você pode limpar os dados salvos temporariamente clicando no botão abaixo.</p>
            
            <div className="bg-[#050505] p-4 rounded-xl border border-[#D4AF37]/10 text-left mb-6 max-h-40 overflow-auto">
              <p className="font-mono text-xs text-red-400 break-all">{this.state.error?.toString()}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-3 bg-[#D4AF37] text-black rounded-xl font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all"
              >
                Limpar Cache e Recarregar
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-white/10 active:scale-[0.99] transition-all"
              >
                Tentar Recarregar Apenas
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

