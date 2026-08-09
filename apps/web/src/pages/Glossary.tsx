const terms: { term: string; def: string }[] = [
  { term: "Backend / API", def: "The kitchen that answers requests from phones or websites." },
  { term: "Terminal", def: "A text window where you type instructions." },
  {
    term: "Node.js",
    def: "The engine that runs JavaScript on your computer. Root needs 22.18+ or 24+.",
  },
  { term: "pnpm / npm", def: "Tools that download packages — an app store for code libraries." },
  { term: "root-scaffold", def: "The npm package name. The command you run is still called root." },
  { term: "root.json", def: "Root’s notebook about your project: language, database, modules." },
  { term: "Route", def: "A door URL, like /api/post." },
  { term: "Auth / JWT", def: "A lock-and-key system. After login you get a temporary token." },
  { term: "ORM", def: "A helper that talks to a database (Prisma, Drizzle, Mongoose, or none)." },
  { term: "Schema", def: "Rules for what a valid request body looks like." },
  { term: "Interconnection", def: "Updating every related file when you add one feature." },
  { term: "Rollback", def: "Undo everything if a step fails." },
  { term: "Dry-run", def: "Show the plan; do not write files." },
  { term: "Doctor", def: "A checklist that looks for broken wiring." },
];

export function Glossary() {
  return (
    <>
      <h1>Glossary</h1>
      <p className="lede">Zero-jargon definitions. Keep this tab open while you learn.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Word</th>
              <th>Plain meaning</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t) => (
              <tr key={t.term}>
                <td>
                  <strong>{t.term}</strong>
                </td>
                <td>{t.def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
