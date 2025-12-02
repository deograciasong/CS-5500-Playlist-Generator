import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind class names while keeping conditional class toggles tidy.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
