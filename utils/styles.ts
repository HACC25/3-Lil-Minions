import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const bgUrl =
  "https://images.unsplash.com/photo-1684451048897-a9dc914fe24e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2006";

export const tropicalBgUrl =
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070";

export const frostedGlassBg =
  "cursor-pointer py-4 bg-gradient-to-r  text-white rounded-lg text-lg  hover:shadow-2xl transition-all duration-300 transform   bg-white/30 backdrop-blur-md";
