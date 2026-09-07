import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { safeStorage } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      safeStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 font-arabic" dir="rtl">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                تنبيه في واجهة النظام
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                حدث خطأ غير متوقع أثناء معالجة العرض. تم حماية البيانات المخزنة لمنع أي تلف.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-mono text-right max-h-24 overflow-y-auto" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الصفحة</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetData}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                title="إعادة ضبط البيانات المؤقتة المخزنة محلياً"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة تعيين التخزين</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
