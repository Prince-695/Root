import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "repeating-linear-gradient(-12deg, transparent, transparent 26px, rgba(10,10,10,0.02) 26px, rgba(10,10,10,0.02) 27px)",
        }}
      />

      <section className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-24">
        <div className="animate-rise flex w-full max-w-md flex-col items-center text-center">
          <div className="animate-drift mb-10 flex flex-col items-center gap-5">
            <span className="inline-flex size-[4.5rem] items-center justify-center overflow-hidden border-2 border-foreground bg-background shadow-[5px_5px_0_var(--ink)] sm:size-20">
              <img
                src="/logo.png"
                alt=""
                width={80}
                height={80}
                className="size-full object-contain p-1.5"
              />
            </span>
            <div className="border-2 border-foreground bg-background px-[0.55em] pt-[0.22em] pb-[0.1em] font-serif text-[clamp(3.25rem,11vw,5.25rem)] leading-none tracking-[0.02em] shadow-[6px_6px_0_var(--ink)]">
              Root
            </div>
          </div>

          <p className="mb-12 max-w-[26ch] text-[1.05rem] leading-[1.75] text-foreground/80">
            Pure-engineering backend scaffolding. No AI. No account. You own every file.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-none border-2 border-foreground px-5 text-[0.95rem] shadow-[3px_3px_0_rgba(10,10,10,0.18)] transition-transform hover:-translate-x-px hover:-translate-y-px"
            >
              <Link to="/docs">
                Read the docs
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 rounded-none border-2 border-foreground bg-background px-5 text-[0.95rem] shadow-[3px_3px_0_rgba(10,10,10,0.1)] transition-transform hover:-translate-x-px hover:-translate-y-px"
            >
              <a href="https://github.com/Prince-695/Root" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </Button>
          </div>

          <p className="mt-4 font-mono text-[0.85rem] tracking-[0.18em] text-foreground uppercase">
            npx root@latest
          </p>
        </div>
      </section>
    </div>
  );
}
