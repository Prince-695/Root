export function ProjectAnatomy() {
  return (
    <>
      <h1>Project anatomy</h1>
      <p className="lede">After init, these are the shelves that matter most.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>Plain meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>root.json</code>
              </td>
              <td>Root’s contract for this project</td>
            </tr>
            <tr>
              <td>
                <code>package.json</code>
              </td>
              <td>Scripts and library list</td>
            </tr>
            <tr>
              <td>
                <code>src/index.*</code>
              </td>
              <td>Starts the server</td>
            </tr>
            <tr>
              <td>
                <code>src/server.*</code>
              </td>
              <td>Middleware + mounts; contains the inject anchor</td>
            </tr>
            <tr>
              <td>
                <code>src/routes/</code>
              </td>
              <td>Doors (URLs)</td>
            </tr>
            <tr>
              <td>
                <code>src/controllers/</code>
              </td>
              <td>Door attendants</td>
            </tr>
            <tr>
              <td>
                <code>src/services/</code>
              </td>
              <td>Business work</td>
            </tr>
            <tr>
              <td>
                <code>src/middleware/</code>
              </td>
              <td>Shared checks (logger, validate, auth)</td>
            </tr>
            <tr>
              <td>
                <code>src/schema.*</code>
              </td>
              <td>Validation checklists</td>
            </tr>
            <tr>
              <td>
                <code>src/db/</code>
              </td>
              <td>Database client</td>
            </tr>
            <tr>
              <td>
                <code>.env.example</code>
              </td>
              <td>
                Sample environment variables — copy to <code>.env</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
