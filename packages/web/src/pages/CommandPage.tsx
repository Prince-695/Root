import { CommandPlate } from "@/components/CommandPlate";
import { commands } from "@/content/commands";
import { Link, useParams } from "react-router-dom";

export function CommandPage() {
  const { slug } = useParams();
  const doc = commands.find((c) => c.slug === slug);

  if (!doc) {
    return (
      <>
        <h1>Unknown command</h1>
        <p>
          <Link to="/docs/commands">Back to commands</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{doc.title}</h1>
      <p className="lede">{doc.oneLiner}</p>

      <h2>Overview</h2>
      <p>{doc.overview}</p>

      <h2>What you type</h2>
      {doc.commands.map((code) => (
        <CommandPlate key={code} title="terminal" code={code} />
      ))}

      <h2>When to use it</h2>
      <p>{doc.when}</p>

      <h2>What you will see</h2>
      <ul>
        {doc.see.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>What files change</h2>
      <ul>
        {doc.files.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {doc.samples && doc.samples.length > 0 ? (
        <>
          <h2>Code walkthrough</h2>
          {doc.samples.map((sample) => (
            <div key={sample.title}>
              <CommandPlate title={sample.title} code={sample.code} />
              {sample.note ? <p className="code-note">{sample.note}</p> : null}
            </div>
          ))}
        </>
      ) : null}

      <h2>What to do next</h2>
      <ul>
        {doc.next.map((item) => (
          <li key={item}>
            <code>{item}</code>
          </li>
        ))}
      </ul>

      {doc.mistakes.length > 0 ? (
        <>
          <h2>Common mistakes</h2>
          <ul>
            {doc.mistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}

      <p>
        <Link to="/docs/commands">← All commands</Link>
      </p>
    </>
  );
}
