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

// Config Constants
const getBackendUrls = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      const httpUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const wsUrl = httpUrl.replace(/^http/, "ws");
      return { httpUrl, wsUrl };
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    
    return {
      httpUrl: `${protocol}//${hostname}:8000`,
      wsUrl: `${wsProtocol}//${hostname}:8000`
    };
  }
  
  const fallback = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  return {
    httpUrl: fallback,
    wsUrl: fallback.replace(/^http/, "ws")
  };
};

const urls = getBackendUrls();
export const API_URL = urls.httpUrl;
export const WS_URL = urls.wsUrl;


