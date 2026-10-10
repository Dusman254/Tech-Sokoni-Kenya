import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';
import { errorTracker } from '../services/errorTracker';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorId: `ERR-${Date.now().toString().slice(-6)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorTracker.captureException(error, `ErrorBoundary:${errorInfo.componentStack?.slice(0, 100)}`);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F3EF] text-[#141413] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-[#EAE9E4]/80 border border-[#141413]/20 p-8 text-center space-y-6 shadow-xl">
            <div className="w-14 h-14 bg-[#141413] text-[#F4F3EF] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-[#D94E34] stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono-num uppercase tracking-[0.24em] text-[#6E6D68]">
                TECH SOKONI · STATUS 500
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                Showroom Display Notice
              </h1>
              <p className="text-xs text-[#5E5D59] leading-relaxed">
                An unexpected interface interruption was safely contained. No hardware inventory or cart records were affected.
              </p>
              <p className="text-[10px] font-mono-num text-[#8E8D87]">
                Reference ID: {this.state.errorId}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-[0.18em] hover:bg-[#2B2B28] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Showroom Canvas</span>
              </button>

              <a
                href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20noticed%20an%20issue%20on%20the%20website."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 border border-[#1F6F43] text-[#1F6F43] hover:bg-[#1F6F43] hover:text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Direct WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
