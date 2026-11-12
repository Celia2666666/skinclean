/** Affiché immédiatement pendant l'ouverture du CRM (au premier accès, la démo est préparée côté serveur). */
export default function CrmLoading() {
  return (
    <div className="flex min-h-[calc(100vh-var(--demo-h))]" aria-busy="true" aria-label="Chargement du CRM">
      <aside className="hidden w-64 shrink-0 bg-[#1F3329] p-5 lg:block">
        <div className="h-6 w-32 rounded bg-white/15" />
        <div className="mt-8 space-y-3">{Array.from({ length: 9 }, (_, i) => <div key={i} className="h-4 rounded bg-white/10" style={{ width: `${55 + ((i * 17) % 35)}%` }} />)}</div>
      </aside>
      <main className="flex-1 bg-[#FAF9F6] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1F3329]/20 border-t-[#1F3329]" />
          <p className="text-sm text-[#5C6862]">Ouverture du CRM…</p>
        </div>
        <div className="mt-6 h-8 w-64 animate-pulse rounded bg-[#E3E1DC]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-white shadow-sm" />)}</div>
        <div className="mt-4 h-72 animate-pulse rounded-xl bg-white shadow-sm" />
      </main>
    </div>
  );
}
