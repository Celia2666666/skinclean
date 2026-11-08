"use client";
import { useState } from "react";
import { EyeI, EyeOffI } from "./icons";

/** Champ mot de passe avec bouton « afficher / masquer ». */
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={visible ? "text" : "password"} className={`${props.className ?? "hub-input"} pr-11`} />
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setVisible((v) => !v); }}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-forest-soft hover:text-forest"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? <EyeOffI size={18} /> : <EyeI size={18} />}
      </button>
    </span>
  );
}
