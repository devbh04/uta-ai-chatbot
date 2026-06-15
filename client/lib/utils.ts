import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  
  if (Array.isArray(content)) {
    return content.map((item) => formatMessageContent(item)).join(" ");
  }
  
  if (typeof content === "object") {
    if (content.text) return content.text;
    if (content.type === "text" && content.text) return content.text;
    return JSON.stringify(content);
  }
  
  return String(content);
}
