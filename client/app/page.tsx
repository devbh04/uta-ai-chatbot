import Link from "next/link";
import { MessageSquare, Shield, Compass, Mountain, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between overflow-x-hidden relative">
      {/* Background soft glow patterns */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
            NS
          </div>
          <span className="font-extrabold text-sm text-foreground tracking-wider uppercase flex items-center gap-1.5">
            North Star Outfitters
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge text="Client Demo Platform" />
        </div>
      </header>

      {/* Main Core */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-center items-center text-center space-y-10">
        {/* Title Hub */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-[10px] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
            <Mountain className="h-3.5 w-3.5" /> Outdoor Gear AI Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            North Star Support &amp; Operations Portal
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Welcome to the North Star demo environment. Interact with our LangGraph-powered customer support agent or manage product listings, orders, and agent takeover actions.
          </p>
        </div>

        {/* Action Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl pt-4">
          {/* Card 1: Consumer Portal */}
          <Link href="/chat" className="group block h-full">
            <Card className="h-full bg-white border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer p-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-primary/10" />
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Start Customer Chat <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    Access the interactive customer support terminal as a guest. Ask questions, view semantic gear suggestions, track orders, or initiate return processes.
                  </CardDescription>
                </div>
              </div>
              <div className="pt-6">
                <Button variant="outline" size="sm" className="w-full text-xs h-8.5 font-semibold group-hover:bg-primary group-hover:text-white transition-colors border-border">
                  Launch Chat Client
                </Button>
              </div>
            </Card>
          </Link>

          {/* Card 2: Support Dashboard */}
          <Link href="/dashboard" className="group block h-full">
            <Card className="h-full bg-white border border-border/80 hover:border-accent/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer p-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-accent/10" />
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                    Support Operations <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    Open the management terminal. Review order pipelines, update inventory databases, view live conversations, and perform real-time user chat takeover.
                  </CardDescription>
                </div>
              </div>
              <div className="pt-6">
                <Button variant="outline" size="sm" className="w-full text-xs h-8.5 font-semibold group-hover:bg-accent group-hover:text-white transition-colors border-border">
                  Launch Admin Console
                </Button>
              </div>
            </Card>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-border/60 text-center text-xs text-muted-foreground shrink-0 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© {new Date().getFullYear()} North Star Outfitters. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/chat" className="hover:underline">Consumer View</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard View</Link>
        </div>
      </footer>
    </div>
  );
}

// Simple internal Badge component
function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-white px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground tracking-wide uppercase">
      {text}
    </span>
  );
}
