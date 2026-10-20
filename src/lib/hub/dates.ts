/** Outils de dates (heure locale, format AAAA-MM-JJ / AAAA-MM-JJTHH:mm). Partagés client et serveur. */

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const ymdhm = (d: Date) => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const todayYmd = () => ymd(new Date());
export const parseLocal = (s: string) => {
  const [date, time = "00:00"] = s.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
};
export const addDays = (s: string, n: number) => {
  const d = parseLocal(s);
  d.setDate(d.getDate() + n);
  return s.includes("T") ? ymdhm(d) : ymd(d);
};
export const diffDays = (a: string, b: string) => Math.round((parseLocal(a.slice(0, 10)).getTime() - parseLocal(b.slice(0, 10)).getTime()) / 864e5);
/** Lundi de la semaine contenant la date. */
export const mondayOf = (s: string) => {
  const d = parseLocal(s);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return ymd(d);
};
export const monthKey = (s: string) => s.slice(0, 7);

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
export const frDay = (s: string) => {
  const d = parseLocal(s);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const frShort = (s: string) => {
  const d = parseLocal(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4).replace(/\.$/, "")}${MONTHS[d.getMonth()].length > 4 ? "." : ""}`;
};
export const hm = (s: string) => (s.includes("T") ? s.slice(11, 16).replace(":", " h ").replace(" h 00", " h") : "");
export const dayName = (i: number) => DAYS[i];
export const monthName = (i: number) => MONTHS[i];

/** Prochaine occurrence (aujourd'hui inclus) d'un jour/mois donné. */
export const nextOccurrence = (month: number, day: number, from = todayYmd()) => {
  const y = Number(from.slice(0, 4));
  const cand = `${y}-${pad(month)}-${pad(day)}`;
  return cand >= from ? cand : `${y + 1}-${pad(month)}-${pad(day)}`;
};
/** Black Friday = 4ᵉ vendredi de novembre (le lendemain de Thanksgiving). */
export const blackFriday = (from = todayYmd()) => {
  const calc = (y: number) => {
    const d = new Date(y, 10, 1);
    const firstThu = ((4 - d.getDay() + 7) % 7) + 1;
    return `${y}-11-${pad(firstThu + 21 + 1)}`;
  };
  const y = Number(from.slice(0, 4));
  return calc(y) >= from ? calc(y) : calc(y + 1);
};
