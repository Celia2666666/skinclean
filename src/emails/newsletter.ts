import { emailLayout, button } from "./layout";

export function newsletterConfirmEmail(confirmUrl: string) {
  return emailLayout({
    preheader: "Confirme ton inscription pour recevoir -20 % et 100 feuilles",
    body: `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;margin:0 0 12px">Bienvenue dans le Glow Club </h1>
<p style="font-size:15px;line-height:22px">Encore un clic pour confirmer ton adresse. Après confirmation, tu recevras :</p>
<ul style="font-size:15px;line-height:24px"><li><b>-20 %</b> sur ta première commande éligible (code valable 30 jours)</li><li><b>100 feuilles </b> SKINCLEAN CLUB, créditées sur ton compte fidélité</li></ul>
<div style="text-align:center;margin:24px 0">${button(confirmUrl, "Je confirme mon inscription")}</div>
<p style="font-size:12px;color:#7a8a82">Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.</p>`,
  });
}

export function journalReminderEmail(day: number, url: string) {
  const titles: Record<number, string> = {
    7: "Et si on faisait un premier point sur ta peau ?",
    14: "Ta routine avance, prends un moment pour observer ta peau !",
    30: "30 jours de glow : découvre ton Skin Journal !",
  };
  return emailLayout({
    preheader: titles[day] ?? "Ton Skin Journal t'attend",
    body: `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px">${titles[day] ?? "Ton Skin Journal t'attend"}</h1>
<p style="font-size:15px;line-height:22px">Jour ${day} de ton suivi : ajoute une photo et tes observations pour voir ton évolution.</p>
<div style="text-align:center;margin:24px 0">${button(url, "Ouvrir mon Skin Journal")}</div>
<p style="font-size:12px;color:#7a8a82">Tu peux désactiver ces rappels à tout moment depuis ton Skin Journal.</p>`,
  });
}
