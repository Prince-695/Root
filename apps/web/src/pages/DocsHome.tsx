import { Link } from "react-router-dom";

export function DocsHome() {
  return (
    <>
      <h1>Start here</h1>
      <p className="lede">
        This manual explains Root as if you have never written code. Read in order, or jump when you
        already know a piece.
      </p>
      <ol>
        <li>
          <Link to="/docs/what-is-root">What is Root?</Link> — the kitchen metaphor
        </li>
        <li>
          <Link to="/docs/why-use-it">Why use it?</Link> — the problem it solves
        </li>
        <li>
          <Link to="/docs/install">Install</Link> — what to type on your computer
        </li>
        <li>
          <Link to="/docs/first-project">First project</Link> — empty folder → working API
        </li>
        <li>
          <Link to="/docs/commands">Commands</Link> — every button, line by line
        </li>
        <li>
          <Link to="/docs/how-it-works">How it works</Link> — the diagram under the hood
        </li>
      </ol>
      <div className="callout">
        Root is <strong>not</strong> artificial intelligence. It follows fixed recipes so the same
        answers always produce the same structure.
      </div>
    </>
  );
}
