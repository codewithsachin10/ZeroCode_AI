import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSecretCode = (seed: string) => {
  const normalized = seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!normalized) return "XXXX-XXXX";
  const prefix = normalized.slice(0, 4).padEnd(4, "X");
  const suffix = normalized.slice(-4).padStart(4, "X");
  return `${prefix}-${suffix}`;
};
