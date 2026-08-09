import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="brand-mark">Root</div>
        <p className="landing-tag">
          A pure-engineering kit that builds and wires backends for you — no AI, no account, you own
          every file.
        </p>
        <div className="cta-row">
          <Link className="btn" to="/docs">
            Read the docs
          </Link>
          <a
            className="btn btn-ghost"
            href="https://github.com/Prince-695/Root"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
