import React, { Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("CRITICAL UI ERROR:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="guimd-error-boundary">
                    <h1>Something went wrong.</h1>
                    <pre className="guimd-error-pre">{this.state.error?.toString()}</pre>
                    <button onClick={() => window.location.reload()}>Reload App</button>
                </div>
            );
        }
        return this.props.children;
    }
}

console.log("App starting...");

// window.addEventListener('contextmenu', (e) => e.preventDefault());

const container = document.getElementById('root')
if (!container) {
    console.error("Critical: #root element not found in DOM");
} else {
    const root = createRoot(container!)
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>
    )
}
