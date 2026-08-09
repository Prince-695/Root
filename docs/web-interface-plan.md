# Web interface plan — Root docs site

| Field | Value |
|---|---|
| **App** | `apps/web` (Vite + React + React Router) |
| **Backend** | None — static UI only |
| **Auth** | None |
| **Visual** | Bloom-like skeuomorphism × brutalism, **black & white only** |
| **Content source** | [`docs/explanation.md`](./explanation.md) + pages under `apps/web/src/content/` |

---

## 1. Goals

1. Minimal landing: brand **Root** as the hero, one sentence, CTAs to Docs / GitHub.  
2. Extremely detailed docs in the simplest language (non-coders).  
3. Copyable installer and command blocks.  
4. High-level “how it works” diagram with prose.  
5. No AI, no accounts, no generate/ZIP API.

---

## 2. Design system (B&W)

### CSS variables

```css
--ink: #0a0a0a;
--paper: #f4f4f0;
--paper-deep: #e8e8e2;
--rule: #0a0a0a;
--muted: #5c5c5c;
--plate: #111111;
--plate-ink: #f4f4f0;
--grain: /* subtle noise overlay */;
```

### Brutalism

- Thick 2–3px rules, hard corners (or 0 radius on plates).  
- Strong display type hierarchy.  
- Exposed nav structure; monospace for commands.  
- High contrast “printed manual” honesty.

### Skeuomorphism (B&W only)

- Paper grain background; inset “manual page” for docs reading column.  
- Command blocks as **terminal plates** (dark plate, light ink).  
- Copy control as a **stamp** button.  
- Docs chrome feels like a binder index (left rail).

### Type

- Display: expressive serif or slab (e.g. “Instrument Serif” / “Anybody” via Google Fonts) — not Inter/Roboto/Arial.  
- Body: readable grotesque with personality (e.g. “DM Sans” or “Schibsted Grotesk”).  
- Commands: `ui-monospace` / “IBM Plex Mono”.

### Motion (2–3)

1. Landing brand fade/rise on load.  
2. Command plate “stamp” on copy success.  
3. Docs sidebar ink underline on active route.

---

## 3. Information architecture

| Route | Purpose |
|---|---|
| `/` | Minimal landing |
| `/docs` | Start-here hub |
| `/docs/what-is-root` | Metaphor-first |
| `/docs/why-use-it` | Problems solved |
| `/docs/install` | Prerequisites + installer commands |
| `/docs/first-project` | End-to-end journey |
| `/docs/commands` | Command index |
| `/docs/commands/init` | Deep dive |
| `/docs/commands/add-auth` | Deep dive |
| `/docs/commands/add-route` | Deep dive |
| `/docs/commands/add-atomic` | Deep dive |
| `/docs/commands/doctor` | Deep dive |
| `/docs/commands/dry-run` | Deep dive |
| `/docs/how-it-works` | Diagram + explanation |
| `/docs/project-anatomy` | Folder tour |
| `/docs/usecases` | Stories |
| `/docs/glossary` | Zero-jargon terms |

### Command page template

1. One-sentence real-life meaning  
2. Exact command + copy  
3. When to use  
4. What you will see  
5. Files that change  
6. What to do next  
7. Common mistakes  

---

## 4. Technical notes

- Workspace package `web` / `@root/web`.  
- `pnpm --filter web dev` / `build` / `preview`.  
- Static deploy (GitHub Pages / Cloudflare Pages).  
- Content as React modules (typed sections) kept aligned with `explanation.md`.  
- Diagram: CSS/ASCII or inline SVG flowchart in B&W (no color Mermaid theme required).

---

## 5. Out of scope

- Sign-in / sign-up  
- Server-side generation / ZIP  
- Live browser terminal  
- Color accents / purple gradients  
- AI copy  

---

## 6. Checklist

- [x] Design tokens B&W only  
- [x] Landing one composition  
- [x] Docs shell + all IA routes  
- [x] Copy buttons on commands  
- [x] How-it-works diagram  
- [x] Non-coder language throughout  
