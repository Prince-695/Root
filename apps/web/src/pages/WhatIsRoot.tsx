export function WhatIsRoot() {
  return (
    <>
      <h1>What is Root?</h1>
      <p className="lede">
        Root is a kitchen kit for backends. You answer a few questions; it lays out the room and
        connects the pipes. The kitchen is yours.
      </p>
      <p>
        A <strong>backend</strong> (also called an API) is the part of an app that lives on a server
        and answers requests like “save this post” or “log me in.” Building one by hand means many
        tiny files must agree with each other.
      </p>
      <p>
        Root is a <strong>command-line tool</strong>: you type short instructions in a terminal
        window. It creates and updates Express projects and keeps routes, schemas, auth, and the
        server mount hooked together.
      </p>
      <h2>What you own</h2>
      <p>
        Every file Root writes sits on <em>your</em> computer, in <em>your</em> folder. Root does
        not host your app, does not keep your secrets, and does not need an account.
      </p>
      <h2>Package name vs command name</h2>
      <p>
        The program you run is named <code>root</code>. On npm the package is named{" "}
        <code>root-scaffold</code>, because the plain name <code>root</code> was already taken.
      </p>
    </>
  );
}
