import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  code: string;
  /** Optional caption above the block (e.g. "Terminal" or a filename). */
  label?: string;
  /** Shown in the top bar; defaults to label or "command". */
  title?: string;
};

export function CommandPlate({ code, label, title }: Props) {
  const [copied, setCopied] = useState(false);
  const bar = title ?? label ?? "command";

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="code-block" aria-label={label ?? "Code"}>
      <div className="code-block-bar">
        <span className="code-block-title">{bar}</span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={cn(
            "h-auto rounded-none border-2 border-foreground bg-background px-2 py-0.5 font-mono text-[0.68rem] tracking-[0.08em] text-foreground uppercase hover:bg-foreground hover:text-background",
            copied && "bg-foreground text-background",
          )}
          onClick={onCopy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
