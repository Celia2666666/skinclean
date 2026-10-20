"use client";
import { create } from "zustand";

/** État d'interface non persisté (toasts, overlays, contexte de l'assistant). */
interface UI {
  toasts: { id: number; title: string; body?: string; productId?: string; icon?: string }[];
  toast: (t: { title: string; body?: string; productId?: string; icon?: string }) => void;
  dismiss: (id: number) => void;
  searchOpen: boolean;
  setSearch: (o: boolean) => void;
  assistantOpen: boolean;
  assistantIntent?: string;
  openAssistant: (intent?: string) => void;
  closeAssistant: () => void;
}

export const useUI = create<UI>((set, get) => ({
  toasts: [],
  toast: (t) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts.slice(-2), { id, ...t }] });
    setTimeout(() => get().dismiss(id), 3800);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
  searchOpen: false,
  setSearch: (o) => set({ searchOpen: o }),
  assistantOpen: false,
  openAssistant: (intent) => set({ assistantOpen: true, assistantIntent: intent }),
  closeAssistant: () => set({ assistantOpen: false, assistantIntent: undefined }),
}));
