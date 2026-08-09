/**
 * Bloom-style HLD: titled hard boxes + emboss, mono chrome — B&W for Root.
 * Visual reference: https://bloom-web-amber.vercel.app/ terminal panel.
 */

type Stage = {
  title: string;
  lines: string[];
};

const stages: Stage[] = [
  {
    title: "You",
    lines: ["npx root@latest add resource post", "capability · name · flags"],
  },
  {
    title: "root CLI",
    lines: ["parse command · load root.json", "refuse if not a Root project"],
  },
  {
    title: "Module graph",
    lines: ["root.json + disk probes", "auth present? · duplicate?"],
  },
  {
    title: "Planner",
    lines: ["recipe → ordered operations", "create · patch · schema · ORM"],
  },
  {
    title: "Transaction",
    lines: [".root.lock → write / patch", "on failure → full rollback"],
  },
];

function TuiBox({ title, lines }: Stage) {
  return (
    <div className="hld-box">
      <div className="hld-box-title">
        <span className="hld-box-title-mark">┌─</span>
        <span className="hld-box-title-text">{title}</span>
        <span className="hld-box-title-rule" aria-hidden />
        <span className="hld-box-title-mark">┐</span>
      </div>
      <div className="hld-box-body">
        {lines.map((line) => (
          <p key={line} className="hld-box-line">
            <span className="hld-box-gutter" aria-hidden>
              │
            </span>
            <span>{line}</span>
          </p>
        ))}
      </div>
      <div className="hld-box-foot" aria-hidden>
        └──────────────────────────────────────────┘
      </div>
    </div>
  );
}

export function HldDiagram() {
  return (
    <figure className="hld" aria-label="Root high-level design">
      <div className="hld-frame">
        <div className="hld-chrome">
          <span>root · hld</span>
          <span>pipeline · v0.1</span>
        </div>

        <pre className="hld-prompt" aria-hidden>
          {"~/api ❯ "}
          <span className="hld-prompt-cmd">npx root@latest add resource post</span>
        </pre>

        <div className="hld-stack">
          {stages.map((stage, index) => (
            <div key={stage.title} className="hld-stage">
              <TuiBox {...stage} />
              {index < stages.length - 1 ? (
                <div className="hld-connector" aria-hidden>
                  <span>│</span>
                  <span>▼</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <p className="hld-status">
          <span className="hld-status-dot" aria-hidden />
          interconnection ready · rollback armed
        </p>
      </div>
      <figcaption className="hld-caption">
        High-level design — each capability runs through this pipeline once.
      </figcaption>
    </figure>
  );
}
