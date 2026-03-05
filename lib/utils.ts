import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Deterministically pick a password from an array for a given user id.
 * This avoids storing extra fields in the database while keeping values
 * stable across sessions.
 */
export function pickPasswordForId(passwords: string[], userId: string) {
  if (!passwords || passwords.length === 0) return "";
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    // djb2 hash
    hash = (hash * 33) ^ userId.charCodeAt(i);
  }
  const idx = Math.abs(hash) % passwords.length;
  return passwords[idx];
}
