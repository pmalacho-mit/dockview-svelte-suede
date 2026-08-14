# Dockview-svelte-suede

This repo is a [suede dependency](https://github.com/pmalacho-mit/suede).

To see the installable source code, please checkout the [release branch](https://github.com/pmalacho-mit/dockview-svelte-suede/tree/release).

## Installation

```bash
bash <(curl https://suede.sh/install/release) --repo pmalacho-mit/dockview-svelte-suede
```

<details>
<summary>
See alternative to using <a href="https://github.com/pmalacho-mit/suede#suedesh">suede.sh</a> script proxy
</summary>

```bash
bash <(curl https://raw.githubusercontent.com/pmalacho-mit/suede/refs/heads/main/scripts/install/release.sh) --repo pmalacho-mit/dockview-svelte-suede
```

</details>

## Development

The views in [release/](./release/) are covered by [sweater-vest-suede](./sweater-vest-suede/)
tests in [src/tests/](./src/tests/), one file per view. They double as worked examples of
each view: components, snippets, reactive params, placement, dock chrome, pane headers and
the [animate](./release/animate.ts) helpers. `Themes.test.svelte` renders every built-in
theme, so `npm run report` doubles as a screenshot gallery of the styles.

```bash
npm run dev      # then open http://localhost:5173/tests.html and pick a file
npm run report   # drives every test file through a containerized browser
npm run check    # svelte-check, including the type assertions in src/tests/typing.check.ts
```

[UPGRADE.md](./UPGRADE.md) is the plan that moved this library from `dockview@4.11` to
`8.x`; [release/CHANGELOG.md](./release/CHANGELOG.md) is what that changed for consumers.
