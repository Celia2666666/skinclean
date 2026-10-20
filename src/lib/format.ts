export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Math.round(n * 100) / 100);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const frDate = (d: string | number | Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

export const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
