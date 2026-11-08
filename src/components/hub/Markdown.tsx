import Link from "next/link";
import { Fragment } from "react";

/**
 * Rendu Markdown minimal et sûr (pas de HTML brut) pour les articles du blog SKINCLEAN :
 * titres ## / ###, listes - et 1., paragraphes, **gras**, *italique* et [liens](/url).
 */
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("[")) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
      const safe = /^(\/|https?:\/\/)/.test(href) ? href : "#";
      out.push(safe.startsWith("/") ? <Link key={`${key}-${i++}`} href={safe}>{label}</Link> : <a key={`${key}-${i++}`} href={safe} target="_blank" rel="noreferrer">{label}</a>);
    } else out.push(<em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, k) => {
        const lines = b.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        if (lines[0].startsWith("### ")) return <h3 key={k}>{inline(lines[0].slice(4), `h${k}`)}</h3>;
        if (lines[0].startsWith("## ")) return <Fragment key={k}><h2>{inline(lines[0].slice(3), `h${k}`)}</h2>{lines.length > 1 && <p>{inline(lines.slice(1).join(" "), `p${k}`)}</p>}</Fragment>;
        if (lines.every((l) => /^\s*-\s/.test(l))) return <ul key={k}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*-\s/, ""), `u${k}${i}`)}</li>)}</ul>;
        if (lines.every((l) => /^\s*\d+\.\s/.test(l))) return <ol key={k}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+\.\s/, ""), `o${k}${i}`)}</li>)}</ol>;
        return <p key={k}>{lines.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{inline(l, `t${k}${i}`)}</Fragment>)}</p>;
      })}
    </>
  );
}

/** Liens internes présents dans un texte Markdown. */
export const markdownLinks = (src: string) => [...src.matchAll(/\]\((\/[^)]+)\)/g)].map((m) => m[1]);
