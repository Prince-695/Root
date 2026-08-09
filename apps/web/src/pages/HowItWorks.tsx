export function HowItWorks() {
  return (
    <>
      <h1>How it works</h1>
      <p className="lede">
        Five workers in a line. You speak; Root plans; a padlock guards the write; failures undo
        everything.
      </p>

      <div className="diagram">{`You
 └─► root CLI
      └─► Module graph (root.json + disk probes)
           └─► Planner (recipe → ordered operations)
                └─► .root.lock  →  Transaction
                     ├─ create / patch files
                     ├─ update schema / ORM / manifest
                     └─ on failure → full rollback`}</div>

      <h2>In plain words</h2>
      <ol>
        <li>
          <strong>You</strong> type a command.
        </li>
        <li>
          The <strong>CLI</strong> opens your project and reads <code>root.json</code>.
        </li>
        <li>
          The <strong>module graph</strong> also peeks at the disk (“is auth already there?”).
        </li>
        <li>
          The <strong>planner</strong> expands a recipe into a checklist of operations.
        </li>
        <li>
          A <strong>lock</strong> stops two Roots from writing at once. A{" "}
          <strong>transaction</strong> applies every step. If one step fails, Root rolls back to the
          previous snapshot.
        </li>
      </ol>

      <div className="callout">
        That is why <code>add route</code> feels magical: it is not one file — it is a transaction
        across many files.
      </div>
    </>
  );
}
