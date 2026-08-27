import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/appErrors';
import App from './App.tsx';
import './index.css';

// Add global fetch retry resilience for temporary server reboots / restarts
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let attempts = 0;
        const maxAttempts = 3;
        const delayMs = 1000;

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
          try {
            const response = await originalFetch(input, init);
            
            if (isApiRequest) {
              const contentType = response.headers.get('content-type') || '';
              if (contentType.toLowerCase().includes('text/html')) {
                // Bypass retries for authentication codes (401, 403)
                if (response.status === 401 || response.status === 403) {
                  return response;
                }

                // If the request returned HTML on an API endpoint (e.g. proxy starting up), retry
                const clonedResponse = response.clone();
                const text = await clonedResponse.text();
                const trimmed = text.trim();
                const lowerTrimmed = trimmed.toLowerCase();
                
                const isHtml = lowerTrimmed.startsWith('<!doctype') || 
                               lowerTrimmed.includes('<html') || 
                               lowerTrimmed.includes('<body') || 
                               lowerTrimmed.startsWith('<');
                
                if (isHtml) {
                  console.warn(`[Resilience] API call returned HTML on status ${response.status}. Retrying (${attempts + 1}/${maxAttempts}) in ${delayMs}ms for: ${urlStr}`);
                  attempts++;
                  if (attempts >= maxAttempts) {
                    return response;
                  }
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                  continue;
                }
              }
            }
            
            return response;
          } catch (error: any) {
            const isNetworkError = error instanceof TypeError || (error?.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')));
            
            if (isNetworkError && attempts < maxAttempts - 1) {
              console.warn(`[Resilience] Network error for ${urlStr || 'request'}. Retrying (${attempts + 1}/${maxAttempts}) in ${delayMs}ms...`);
              attempts++;
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }
            
            if (isNetworkError && isApiRequest) {
              throw new Error("Erro de conexão temporário com o servidor. Por favor, tente novamente em instantes.");
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
          console.error("[Resilience] Failed to override window.fetch using Object.defineProperty. Using standard fetch.", defError);
        }
      }
    }
  } catch (globalSetupError) {
    console.error("[Resilience] Error during global fetch wrapper setup:", globalSetupError);
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
    console.error("Uncaught error in React Tree:", error, errorInfo);
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

