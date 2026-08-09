import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Box, Lock, Stethoscope, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

const marquee = [
  "npx root@latest init",
  "npx root@latest add auth",
  "npx root@latest add resource post",
  "npx root@latest list",
  "npx root@latest doctor",
  "npx root@latest --dry-run add resource note",
];

const bento = [
  {
    title: "add resource",
    body: "Routes, schema, mount, and ORM — one capability.",
    to: "/docs/commands/add-resource",
    icon: Box,
    className: "md:col-span-2",
  },
  {
    title: "add auth",
    body: "Signup, signin, Bearer tokens.",
    to: "/docs/commands/add-auth",
    icon: Lock,
    className: "md:col-span-1",
  },
  {
    title: "init",
    body: "Empty folder → Express + root.json.",
    to: "/docs/commands/init",
    icon: Terminal,
    className: "md:col-span-1",
  },
  {
    title: "doctor",
    body: "Integrity when files drift.",
    to: "/docs/commands/doctor",
    icon: Stethoscope,
    className: "md:col-span-2",
  },
];

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
          <div className="animate-drift mb-12 border-2 border-foreground bg-background px-[0.55em] pt-[0.22em] pb-[0.1em] font-serif text-[clamp(3.25rem,11vw,5.25rem)] leading-none shadow-[6px_6px_0_var(--ink)]">
            Root
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

          <p className="animate-pulse-rule mt-16 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
            npx root@latest
          </p>
        </div>
      </section>

      <div className="relative z-10 border-y-2 border-foreground bg-primary text-primary-foreground">
        <div className="overflow-hidden py-3">
          <div className="animate-marquee flex w-max gap-14 whitespace-nowrap font-mono text-[0.8rem] tracking-wide opacity-90">
            {[
              ...marquee.map((cmd) => ({ key: `a-${cmd}`, cmd })),
              ...marquee.map((cmd) => ({ key: `b-${cmd}`, cmd })),
            ].map((item) => (
              <span key={item.key} className="inline-flex items-center gap-14">
                <span>{item.cmd}</span>
                <span aria-hidden className="opacity-30">
                  ◆
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-28">
        <Badge
          variant="outline"
          className="mb-6 rounded-none border border-foreground/80 font-mono text-[0.62rem] tracking-[0.16em] uppercase"
        >
          Capabilities
        </Badge>
        <h2 className="m-0 mb-3 border-0 p-0 text-center font-serif text-[1.65rem] tracking-tight sm:text-[1.85rem]">
          Backend verbs, not file kinds.
        </h2>
        <p className="mb-14 max-w-[32ch] text-center text-[0.95rem] leading-[1.75] text-muted-foreground">
          Add a capability. Root interconnects the rest.
        </p>

        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
          {bento.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={cn(
                  "group rounded-none border-2 border-foreground py-0 shadow-[4px_4px_0_rgba(10,10,10,0.08)] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(10,10,10,0.12)]",
                  item.className,
                )}
              >
                <Link to={item.to} className="flex h-full min-h-[9.5rem] flex-col no-underline">
                  <CardHeader className="gap-2.5 px-5 pt-5 pb-1">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="font-serif text-lg font-normal tracking-tight">
                        {item.title}
                      </CardTitle>
                      <Icon className="size-4 opacity-50 transition-transform duration-300 group-hover:rotate-6" />
                    </div>
                    <CardDescription className="text-[0.9rem] leading-[1.65] text-foreground/65">
                      {item.body}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto px-5 pt-3 pb-5">
                    <span className="font-mono text-[0.65rem] tracking-[0.12em] uppercase opacity-40 transition-opacity group-hover:opacity-90">
                      Open →
                    </span>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        <div className="mt-24 flex flex-col items-center gap-5 text-center">
          <p className="m-0 max-w-[30ch] text-[0.95rem] leading-[1.75] text-muted-foreground">
            Printed-manual docs. No account. No AI.
          </p>
          <Button
            asChild
            variant="outline"
            className="rounded-none border-2 border-foreground bg-background shadow-[3px_3px_0_rgba(10,10,10,0.1)]"
          >
            <Link to="/docs/first-project">First project walkthrough</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
