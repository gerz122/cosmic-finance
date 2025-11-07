import React, { Component, ErrorInfo, ReactNode } from 'react';
import { XCircleIcon } from './icons';

interface Props {
  children: ReactNode;
  logError: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.props.logError(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-cosmic-surface p-8 rounded-lg border border-cosmic-danger text-center m-8">
            <XCircleIcon className="w-12 h-12 text-cosmic-danger mx-auto mb-4" />
            <h1 className="text-xl font-bold text-cosmic-danger">Something Went Wrong</h1>
            <p className="text-cosmic-text-secondary mt-2">
                A component has crashed. This error has been logged in the Activity Monitor.
                <br />
                Try refreshing the page or navigating to a different section.
            </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
