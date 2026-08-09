export function WhyUseIt() {
  return (
    <>
      <h1>Why use Root?</h1>
      <p className="lede">
        Adding one feature by hand often means updating five places. Miss one, and the doorbell is
        dead while the kitchen still looks fine.
      </p>
      <h2>The pain without Root</h2>
      <ul>
        <li>A route file (the door)</li>
        <li>A controller (who answers)</li>
        <li>A service (who cooks)</li>
        <li>A schema (the order checklist)</li>
        <li>Maybe a database model (the fridge shelf)</li>
        <li>A line in the server that mounts the door</li>
        <li>A note in a config file that the door exists</li>
      </ul>
      <h2>What Root changes</h2>
      <p>
        When you say “add a post door,” Root updates <strong>all</strong> the connected pieces in
        one go. If something fails halfway, it <strong>undoes</strong> the change so you are not
        left with a half-built mess.
      </p>
      <h2>Who it is for</h2>
      <ul>
        <li>People building an API who want a sensible start</li>
        <li>People who want login and resources wired correctly</li>
        <li>People who prefer owned code over a locked SaaS template</li>
      </ul>
      <h2>What it is not</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Not this</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Artificial intelligence</td>
              <td>Fixed recipes. No guessing. No chat bot.</td>
            </tr>
            <tr>
              <td>A website host</td>
              <td>It does not put your app on the internet for you.</td>
            </tr>
            <tr>
              <td>A cloud account</td>
              <td>Nothing is uploaded to Root’s servers.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
