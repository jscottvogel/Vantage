import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 m-4 border border-red-500 rounded bg-red-50 text-red-900">
                    <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
                    <pre className="whitespace-pre-wrap text-sm">{this.state.error?.toString()}</pre>
                    <pre className="mt-2 text-xs text-red-700">{this.state.error?.stack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}
