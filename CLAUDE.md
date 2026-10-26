# TwistLab

A Rubik's cube timer with an academy ([twistlab.app](https://twistlab.app)). See README.md for what it does and how to
run it.

## Language

- **English for everything internal:** commit messages (subject and body), code, identifiers, comments, tests, file
  headers, PR descriptions and this file.
- **User-facing text is the exception:** it lives in `src/i18n/es.ts`, `en.ts` and `pt.ts` (UI) and in the `Localized`
  content of `src/academy/` (`tr(es, en, pt)`), always in all three languages. A comment may quote a UI name as the
  user sees it ("Reto del día", "Tamaño del texto") to say which feature it means.

## Commits

- Changes come as pull requests against `main`, which only the maintainer merges (the `main` ruleset).
- An English subject line naming the area ("Resolver: …", "Sync: …"), then a body saying what changed and why.
- Never add a `Co-Authored-By` trailer.
- One commit per change that can be reviewed on its own.

## Before committing

`npx tsc && npx tsc -p api && npm test && npm run build` (the build also type-checks the tests with
`tsconfig.test.json`). Check UI changes in the browser (`npx vite`; `?simcube=moyu` simulates a smart cube in dev).
CI runs the same checks on every pull request, and the Vercel build runs the tests before deploying.

## Code conventions

- Every file starts with a comment saying what it does and why. Comments are dense and explain intent, not mechanics.
- Vite + TypeScript with no framework: the DOM by hand with `el()`, `$()` and `btn()` from `src/el.ts`. Every id the
  code looks up must exist in `index.html` (a test checks it).
- Smallest change that works: reuse what the codebase already has, no speculative abstractions, delete before adding.
  A deliberate shortcut gets a `ponytail:` comment naming its limit.
- Tests are `node --test` files next to their source (`*.test.ts`); logic worth testing stays out of DOM modules so it
  can be imported in node.
- Styles are SCSS in `src/styles/`, one partial per screen, joined by `app.scss` in cascade order (one stylesheet for
  the whole app, so prerendered pages never paint unstyled).
- `three` stays on the version cubing.js depends on (0.170.x): cubing renders the 3D cube with it, and the app only
  imports its types (and one test), so a newer `three` would describe objects it doesn't have.
- `index.html`'s inline script picks the screen before the first paint; it must agree with `router.ts`'s `parseRoute`
  (a test checks it).

## Data and deploys

- Database changes go through the deploy: `vercel.json`'s build runs `npm run db:migrate` (`db/migrate.js`, then
  `db/scrambles.js`). Never run migrations or scripts against production by hand; `.env.local` points at production.
- `db/schema.sql` is idempotent: a published table only changes through an `ALTER … IF NOT EXISTS` added below it.
- Challenge scrambles live in the database, never in the code: the repository is public.
- Never print or commit secrets; `.env.example` lists the variable names only.
- New keys the app saves must be classified in `src/sync.ts` (`LISTS`, `RECORDS` or `LWW`); a test enforces it.
