import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // État persisté côté client (localStorage) : on lit l'état après hydratation dans un effet,
    // et l'UI affiche des dates relatives (Date.now). Ces règles du React Compiler restent en avertissement.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // Marketing Hub : textes français riches en apostrophes, variables « _x » volontairement ignorées (déstructuration).
    files: ["src/components/hub/**", "src/app/hub/**", "src/lib/hub/**", "src/components/crm/**", "src/app/crm/**", "src/lib/crm/**"],
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_", argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
    },
  },
  {
    // CRM : les boutons « Export CSV » sont des téléchargements vers /api/crm/export/*, pas des pages.
    files: ["src/components/crm/**"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**", // serveurs de dev secondaires (NEXT_DIST_DIR)
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
