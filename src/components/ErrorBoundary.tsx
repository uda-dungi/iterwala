import { Component, ReactNode } from "react";

/**
 * Catches render-time crashes so a single bad product row or missing asset shows a
 * recoverable error card instead of unmounting the whole tree into a white screen —
 * which is exactly what a stray comma in src/data/products.ts used to do to the
 * homepage, every /product/:slug page and the quiz results.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl text-ivory">Something went wrong</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          We hit an unexpected error loading this page. Please try again.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => this.setState({ error: null })}
            className="border border-border px-6 py-2 text-xs uppercase tracking-[0.3em] text-ivory hover:border-primary/50"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-border px-6 py-2 text-xs uppercase tracking-[0.3em] text-ivory hover:border-primary/50"
          >
            Go home
          </a>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-8 overflow-x-auto whitespace-pre-wrap text-left text-xs text-destructive">
            {this.state.error.stack || this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
