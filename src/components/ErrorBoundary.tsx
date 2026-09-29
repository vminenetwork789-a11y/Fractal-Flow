import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ExternalLink, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  public render() {
    if (this.state.hasError) {
      const isCrossFrame =
        this.state.errorMessage.includes('Blocked a frame with origin') ||
        this.state.errorMessage.includes('Location');

      const isTranslateDomError =
        this.state.errorMessage.includes('insertBefore') ||
        this.state.errorMessage.includes('removeChild') ||
        this.state.errorMessage.includes('not a child of this node') ||
        this.state.errorMessage.includes('ไม่ใช่โหนดลูก');

      return (
        <div
          className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 notranslate"
          translate="no"
        >
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h1 className="text-lg font-bold text-slate-100">
              {isCrossFrame
                ? 'iFrame Security Notice'
                : isTranslateDomError
                ? 'เกิดข้อผิดพลาดจากการแปลภาษาอัตโนมัติ'
                : 'เกิดข้อผิดพลาดบางอย่าง'}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed">
              {isCrossFrame
                ? 'เบราว์เซอร์จำกัดการเข้าถึง Cross-Origin ระหว่าง Web3 Wallet และ iFrame Sandbox แนะนำให้เปิดแอปในแท็บใหม่เพื่อการเชื่อมต่อที่สมบูรณ์'
                : isTranslateDomError
                ? 'ระบบตรวจพบว่าโปรแกรมแปลภาษาอัตโนมัติของเบราว์เซอร์ (Google Translate) เข้าไปแก้ไขโครงสร้างข้อความ แนะนำให้กด "คืนค่าระบบ" หรือปิดแปลภาษาอัตโนมัติชั่วคราว'
                : this.state.errorMessage}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              {isTranslateDomError && (
                <button
                  onClick={this.handleReset}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าระบบทันที</span>
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีโหลดระบบ</span>
              </button>

              <button
                onClick={this.handleOpenNewTab}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดในแท็บใหม่</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

