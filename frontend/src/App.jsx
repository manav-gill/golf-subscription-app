function App() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-primary transition-colors duration-300 sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-soft transition-all duration-300">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Golf Charity Platform</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">Theme Applied</h1>
        <p className="mt-3 text-base leading-relaxed text-secondary">
          A soft premium interface foundation is now active and ready to scale across rewards, subscriptions, and
          charity-focused workflows.
        </p>
        <button
          type="button"
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Continue
        </button>
      </section>
    </main>
  );
}

export default App;
