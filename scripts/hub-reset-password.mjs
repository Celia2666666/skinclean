// Marketing Hub — réinitialisation du mot de passe en ligne de commande (secours, en local).
// Usage : npm run hub:mot-de-passe -- <e-mail> <nouveau-mot-de-passe>
//         npm run hub:mot-de-passe            (liste les comptes existants)
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

const file = process.env.HUB_DB_FILE || path.join(process.cwd(), "data", "hub", "marketing-hub.sqlite");
if (!existsSync(file)) {
  console.error("Base du Marketing Hub introuvable : lance d'abord le site (npm run dev) puis ouvre /hub une fois.");
  process.exit(1);
}
const db = new DatabaseSync(file);
const [email, password] = process.argv.slice(2);
const users = db.prepare("SELECT id, email FROM users ORDER BY email").all();

if (!email) {
  console.log("Comptes du Marketing Hub :");
  for (const u of users) console.log("  -", u.email);
  console.log("\nPour changer un mot de passe : npm run hub:mot-de-passe -- <e-mail> <nouveau-mot-de-passe>");
  process.exit(0);
}
const user = users.find((u) => u.email === email.toLowerCase().trim());
if (!user) {
  console.error(`Aucun compte avec l'e-mail ${email}. Comptes existants : ${users.map((u) => u.email).join(", ")}`);
  process.exit(1);
}
if (!password || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error("Le mot de passe doit contenir au moins 10 caractères, dont des lettres et des chiffres.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(`scrypt$${salt.toString("hex")}$${hash.toString("hex")}`, user.id);
db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
console.log(`Mot de passe mis à jour pour ${user.email}. Les sessions ouvertes ont été fermées : reconnecte-toi sur /hub/connexion.`);
