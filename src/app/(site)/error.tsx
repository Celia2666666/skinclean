"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-4xl">Oups, un souci est survenu</h1>
      <p className="mt-3 text-forest-soft">Réessaie dans un instant. Ton panier est conservé.</p>
      <button onClick={reset} className="btn btn-primary mt-6">Réessayer</button>
    </div>
  );
}
