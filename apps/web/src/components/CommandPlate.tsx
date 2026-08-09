import { useState } from "react";

type Props = {
  code: string;
  label?: string;
};

export function CommandPlate({ code, label }: Props) {
  const [copied, setCopied] = useState(false);

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
    <div className="plate" aria-label={label ?? "Command"}>
      <button type="button" className={`stamp${copied ? " copied" : ""}`} onClick={onCopy}>
        {copied ? "Stamped" : "Copy"}
      </button>
      <pre>{code}</pre>
    </div>
  );
}
