"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { analyse, visibleQuestions, type Answers } from "@/lib/diag";
import { useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { ArrowIcon, CheckIcon, ChatIcon, DropIcon, LeafIcon } from "@/components/ui/Icons";

export function SkinDiag() {
  const router = useRouter();
  const search = useSearchParams();
  const h = useHydrated();
  const progress = useStore((s) => s.diagProgress);
  const save = useStore((s) => s.saveDiagProgress);
  const prefill = useStore((s) => s.diagPrefill);
  const setPrefill = useStore((s) => s.setDiagPrefill);
  const pushDiag = useStore((s) => s.pushDiag);
  const openAssistant = useUI((s) => s.openAssistant);

  const [phase, setPhase] = useState<"intro" | "quiz" | "analyse">("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [showHelp, setShowHelp] = useState(false);

  const qs = useMemo(() => visibleQuestions(answers), [answers]);
  const q = qs[Math.min(index, qs.length - 1)];
  const value = q ? answers[q.id] : undefined;
  const pct = ((index + (value ? 1 : 0)) / qs.length) * 100;

  useEffect(() => { if (phase === "quiz") save({ answers, index }); }, [answers, index, phase, save]);

  const start = (from?: { answers: Answers; index: number }) => {
    setAnswers(from?.answers ?? {});
    setIndex(from?.index ?? 0);
    setPhase("quiz");
  };

  const choose = (v: string) => {
    if (!q) return;
    if (q.multi) {
      const cur = (Array.isArray(value) ? value : []) as string[];
      let nextVal = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      if (v === "aucun") nextVal = cur.includes("aucun") ? [] : ["aucun"];
      else nextVal = nextVal.filter((x) => x !== "aucun");
      if (q.max && nextVal.length > q.max) return;
      setAnswers({ ...answers, [q.id]: nextVal });
    } else {
      const updated = { ...answers, [q.id]: v };
      setAnswers(updated);
      setTimeout(() => goNext(updated), 380);
    }
  };

  /** Passe à la question suivante en recalculant les questions conditionnelles avec les réponses à jour. */
  const goNext = (a: Answers) => {
    setShowHelp(false);
    setDir(1);
    if (index + 1 >= visibleQuestions(a).length) finish(a);
    else setIndex(index + 1);
  };

  const back = () => { setShowHelp(false); setDir(-1); if (index === 0) setPhase("intro"); else setIndex(index - 1); };

  const finish = (a: Answers) => {
    setPhase("analyse");
    setTimeout(() => {
      const r = analyse(a);
      pushDiag(r);
      router.push(`/skin-diag/resultats?id=${r.id}`);
    }, 2600);
  };

  const canNext = q?.multi ? Array.isArray(value) && value.length > 0 : !!value;

  if (!h) return <div className="min-h-[80vh]" />;

  return (
    <div className="relative min-h-[calc(100svh-100px)] overflow-hidden bg-[radial-gradient(120%_90%_at_10%_0%,#EFEEEA,#F4F3EF_55%,#EFEEEA)]">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="relative mx-auto flex min-h-[calc(100svh-100px)] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center">
            <motion.div animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 6 }} className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-ivory text-4xl text-sage-deep shadow-[var(--shadow-soft)]"><DropIcon size={34} /></motion.div>
            <p className="eyebrow text-sage-deep">Skin Diag · 2 minutes</p>
            <h1 className="mt-4 font-display text-[clamp(2.8rem,8vw,5.5rem)] leading-[0.92]">Faisons connaissance avec ta peau</h1>
            <p className="mt-5 max-w-xl text-forest-soft">Une dizaine de questions pour construire une routine matin & soir adaptée à ton type de peau, tes préoccupations, ta sensibilité, ton temps et ton budget.</p>
            {prefill && search.get("prefill") && (
              <div className="mt-6 rounded-none bg-ivory p-4 text-sm">
                <p>Tu as déjà répondu à quelques questions avec le Glow Assistant. On les utilise pour préremplir ton diag ?</p>
                <div className="mt-3 flex justify-center gap-2">
                  <button className="btn btn-primary px-4 py-2" onClick={() => { start({ answers: prefill, index: 0 }); setPrefill(undefined); }}>Oui, préremplir</button>
                  <button className="btn btn-ghost px-4 py-2" onClick={() => setPrefill(undefined)}>Non merci</button>
                </div>
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button className="btn btn-primary px-8 py-4 text-base" onClick={() => start()}>Commencer <ArrowIcon size={18} /></button>
              {progress && Object.keys(progress.answers).length > 0 && <button className="btn btn-light px-8 py-4 text-base" onClick={() => start(progress)}>Reprendre où j&apos;en étais</button>}
            </div>
            <p className="mt-8 max-w-md text-xs text-forest-soft">Outil de conseil cosmétique, pas un diagnostic médical. Tes réponses restent sur ton appareil tant que tu ne crées pas de compte.</p>
          </motion.div>
        )}

        {phase === "quiz" && q && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mx-auto max-w-4xl px-5 py-10 md:py-16">
            <div className="flex items-center gap-4">
              <button onClick={back} className="grid h-11 w-11 shrink-0 rotate-180 place-items-center rounded-full bg-ivory transition hover:bg-sage" aria-label="Question précédente"><ArrowIcon size={18} /></button>
              <div className="flex-1">
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-forest-soft"><span>Question {index + 1} / {qs.length}</span><span>{Math.round(pct)} %</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-ivory" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                  <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#9CB8A6,#24392F)]" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={q.id}
                custom={dir}
                initial={{ opacity: 0, x: dir * 60, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: dir * -60, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 md:mt-14"
              >
                <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] leading-[1.02]">{q.title}</h2>
                {q.subtitle && <p className="mt-3 text-forest-soft">{q.subtitle}</p>}
                {q.help && (
                  <button onClick={() => setShowHelp(!showHelp)} className="mt-3 text-sm underline">Comment savoir ?</button>
                )}
                <AnimatePresence>{showHelp && q.help && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 max-w-2xl overflow-hidden rounded-[2px] bg-ivory p-4 text-sm">{q.help}</motion.p>}</AnimatePresence>

                <div className={`mt-8 grid gap-3 ${q.options.length > 6 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {q.options.map((o, i) => {
                    const on = Array.isArray(value) ? value.includes(o.value) : value === o.value;
                    return (
                      <motion.button
                        key={o.value}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i } }}
                        whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                        onClick={() => choose(o.value)}
                        aria-pressed={on}
                        className={`group relative flex items-center gap-4 overflow-hidden rounded-none border-2 p-4 text-left transition-colors ${on ? "border-forest bg-ivory" : "border-transparent bg-ivory/70 hover:bg-ivory"}`}
                      >
                        {o.emoji && <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[2px] text-2xl transition ${on ? "bg-sage" : "bg-cream group-hover:bg-sky"}`}>{o.emoji}</span>}
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{o.label}</span>
                          {o.hint && <span className="block text-xs text-forest-soft">{o.hint}</span>}
                        </span>
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-forest bg-forest text-ivory" : "border-forest/20"}`}>{on && <CheckIcon size={14} />}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <button onClick={() => openAssistant("diag-help")} className="flex items-center gap-2 text-sm text-forest-soft hover:text-forest"><ChatIcon size={18} /> Une question ? Le Glow Assistant t&apos;aide</button>
              {(q.multi || value) && (
                <button onClick={() => goNext(answers)} disabled={!canNext} className="btn btn-primary px-8">
                  {index + 1 >= qs.length ? "Découvrir ma routine" : "Continuer"} <ArrowIcon size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "analyse" && (
          <motion.div key="analyse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex min-h-[calc(100svh-100px)] flex-col items-center justify-center px-5 text-center">
            <div className="relative h-40 w-40">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-sage-deep" initial={{ scale: 0.4, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }} />
              ))}
              <motion.div className="absolute inset-8 grid place-items-center rounded-full bg-sage text-forest" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }}><LeafIcon size={32} /></motion.div>
            </div>
            <AnalyseText />
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sr-only"><Link href="/skin-diag/resultats">Voir mes derniers résultats</Link></p>
    </div>
  );
}

function AnalyseText() {
  const steps = ["Analyse de ton type de peau…", "Prise en compte de ta sensibilité…", "Vérification de la compatibilité des actifs…", "Composition de ta routine…"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 650); return () => clearInterval(t); }, [steps.length]);
  return (
    <AnimatePresence mode="wait">
      <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-10 font-display text-3xl">{steps[i]}</motion.p>
    </AnimatePresence>
  );
}
