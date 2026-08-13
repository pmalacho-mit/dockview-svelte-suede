# Upgrading dockview: 4.11 → 8.1

`release/` is pinned to `dockview@4.11.0` / `dockview-core@4.11.0` (Nov 2025). The current
release is `8.1.0` (Aug 2026). Four majors happened in between.

**Target: 8.1.0, in one push.** The runtime API this wrapper drives is almost entirely
unchanged. The *types* it borrows are not: the `dockview` package stopped being the React
binding in v7, and every prop type this library derives its public surface from lived in that
binding. That rebuild is the bulk of the work, and the result is a **smaller** library — the
React dependency disappears.

Run `npm run report` (40 tests) before and after. That suite exists to make this upgrade a
mechanical exercise rather than a leap of faith.

**Rough budget:** 1–2 days for the port, ~1 day to expose tab groups and edge groups, and
2–4 days more if the two enterprise features we want are rebuilt in-house (§7).

---

## 1. Decisions taken

These are settled; everything below assumes them.

1. **Define the prop types locally** rather than importing them from `dockview-react`.
   A Svelte library should not carry React's type dependencies (§3.1).
2. **Import from `dockview`**, the surface upstream tells consumers to use, not `dockview-core`.
   Upstream now calls `dockview-core` an internal implementation detail (§3.2).
3. **Tab groups and edge groups become first-class here**, held to the same standard as tabs,
   watermarks and header actions: a components-and-snippets prop, typed, tested (§3.5, §3.6).
4. **Losing `themeReplit` is fine.** The `Theme` union narrows; that is an acceptable break (§3.3).

---

## 2. What changed, release by release

| Version | Date | Breaking for us? |
| --- | --- | --- |
| 5.0 – 5.2 | Feb–Mar 2026 | No. Additive: tab strip position, slimmer bundles, `always` renderer fixes. |
| 6.0 – 6.6 | May 2026 | Yes, small: `themeReplit` removed, `tabAnimation` moved onto the theme object, stylesheet no longer auto-injected, spaced themes moved to CSS variables. |
| 7.0 | Jun 2026 | **Yes, this is the one.** Package realignment: `dockview` is now vanilla JS, React bindings moved to `dockview-react`. `rootOverlayModel` removed; `onDidActivePanelChange` payload changed; a handful of type/event renames. |
| 8.0 – 8.1 | Aug 2026 | Barely. One behavioural change (reported panel dimensions), one method rename with aliases kept. Everything new is opt-in and off by default. Introduces a commercial `dockview-enterprise` package. |

Upstream guides: [Migrating to v7](https://dockview.dev/docs/releases/migrating/migrating-to-v7),
[Migrating to v8](https://dockview.dev/docs/releases/migrating/migrating-to-v8),
[What's new in v6](https://dockview.dev/docs/releases/whats-new/whats-new-v6).

---

## 3. The work

### 3.1 Rebuild the prop types locally (the bulk of it)

[release/utils/index.ts](release/utils/index.ts) imports eight types from `dockview`:

```ts
import type {
  IPaneviewReactProps, IDockviewReactProps, IGridviewReactProps, ISplitviewReactProps,
  IGridviewPanelProps, IDockviewPanelProps, IPaneviewPanelProps, ISplitviewPanelProps,
} from "dockview";
```

In v8, `dockview` re-exports `dockview-core` and **none of those eight names exist there**.
Only `IDockviewPanelProps` has a home in core; the rest are React-binding types.

They are load-bearing: `ReactViewPropsByView` → `PanelComponentProps` → `ComponentsConstraint` /
`SnippetsConstraint` / `ModifiedProps` / `RawAddPanelOptions` / `ViewProps` / `ViewAPI`. The whole
public type surface hangs off them, which is also why [src/tests/typing.check.ts](src/tests/typing.check.ts)
is the file to keep open while doing this.

Per decision 1, define them here. They are thinner than their reach suggests:

```ts
// panel props — one per view, replacing the four I*PanelProps imports
type PanelProps<Api, ContainerApi, T> = { params: T; api: Api; containerApi: ContainerApi };
// pane panels additionally carry `title: string`
```

Core exports every part: `DockviewPanelApi`, `GridviewPanelApi`, `SplitviewPanelApi`,
`PaneviewPanelApi`, the four container `*Api` classes, and — already framework-agnostic —
`IDockviewPanelProps`, `IDockviewPanelHeaderProps`, `IWatermarkPanelProps`,
`IDockviewHeaderActionsProps`, `IGroupHeaderProps`.

`ReactViewPropsByView` only ever supplied "the options object plus `onReady`", so
`DockviewOptions & { onReady }` (and the `Gridview` / `Splitview` / `Paneview` equivalents,
all exported by core) replaces it directly.

`RawAddPanelOptions` currently reads add-panel options out of the React props' `onReady`
parameter. Point it at the api classes instead: `Parameters<DockviewApi["addPanel"]>[0]`.

Two payoffs beyond correctness: `dockview` leaves the *type* graph entirely, and new core
options start flowing into our props type on their own.

### 3.2 Re-point imports at `dockview`

Per decision 2, `release/` imports from `dockview` everywhere it currently says `dockview-core`
(`createDockview`, `PROPERTY_KEYS_*`, the panel base classes, the renderer interfaces, the themes).
In v8 `dockview` is a pure, side-effect-free re-export, so this is a rename with no behavioural
consequence — but it is the documented path, it is what the React/Vue/Angular bindings do, and
staying on bare `dockview-core` earns a one-time `console.warn`. `dockview-core` then leaves
`package.json` too; the single dependency is `dockview`.

The stylesheet import moves with it: `dockview/dist/styles/dockview.css`
(see `copy:style` in [package.json](package.json)).

### 3.3 Themes

- `themeReplit` was removed in v6 — drop it from [release/utils/themes.ts](release/utils/themes.ts).
  Per decision 4 this is an accepted break: `Theme` is a public union, so `theme="replit"` stops
  compiling rather than silently falling back. [src/tests/Themes.test.svelte](src/tests/Themes.test.svelte)
  iterates `themeOptions`, so the gallery follows the map automatically.
- Eleven themes arrived and should be exposed: `themeNord(+Spaced)`,
  `themeCatppuccinMocha(+Spaced)`, `themeMonokai`, `themeSolarizedLight(+Spaced)`,
  `themeGithubDark(+Spaced)`, `themeGithubLight(+Spaced)`.
- `DockviewTheme` gained `colorScheme`, `tabAnimation`, `edgeGroupCollapsedSize`,
  `dndTabIndicator`, `dndOverlayBorder`, `tabGroupIndicator`. Our `theme` prop takes a *name*
  only, so none of that is reachable — widen it to `Theme | DockviewTheme` while the file is open.
  `tabAnimation` in particular stopped being a top-level option in v6 and is now settable
  *only* this way.
- [release/styles/dockview.css](release/styles/dockview.css) is a vendored copy of the 4.11
  stylesheet and must be re-copied: v6 rebuilt the spaced themes on CSS variables, and the new
  themes ship their own variable blocks.

### 3.4 Dock chrome renderer drift

[release/dock/index.ts](release/dock/index.ts) implements dockview's renderer interfaces directly,
so their signature drift lands here:

- `ITabRenderer.init` now takes `TabPartInitParameters` (`GroupPanelPartInitParameters` **+
  `tabLocation`**). Re-parameterise `SvelteDockHeaderRenderer`; tab components then receive
  `tabLocation` (`"header" | "headerOverflow"`) for free, since `IDockviewPanelHeaderProps` carries it.
- `IHeaderActionsRenderer.init` now takes `IGroupHeaderProps` (`{ api, containerApi, group }`).
  `SvelteDockActionsHeaderRenderer` builds its props object by hand, so it must also supply the
  two fields `IDockviewHeaderActionsProps` gained: `headerPosition` and `location`.
- `IWatermarkPanelProps.group` is now `IDockviewGroupPanel | undefined` rather than the concrete
  `DockviewGroupPanel`. Type-only.

### 3.5 New surface: tab groups

Most of tab groups is api-side and arrives free the moment we upgrade, because `onReady` hands
consumers the real `DockviewApi`: `createTabGroup`, `dissolveTabGroup`, `addPanelToTabGroup`,
`removePanelFromTabGroup`, `moveTabGroup`, `getTabGroups`, `getTabGroupForPanel`, plus six
`onDid*TabGroup*` events. `tabGroupColors` and `tabGroupAccent` are plain options and ride the
existing `PROPERTY_KEYS_DOCKVIEW` forwarding.

What needs wrapper work is the one renderer:

```svelte
<DockView tabGroupChip={{ component: Chip }} … />   <!-- or {{ snippet: chip }} -->
```

`createTabGroupChipComponent?: (tabGroup: ITabGroup) => ITabGroupChipRenderer` mirrors the
watermark exactly — a new renderer class in `dock/index.ts` plus a `mountable(...)` call in
[release/DockView.svelte](release/DockView.svelte). Same for
`createGroupDragGhostComponent?: (group) => IGroupDragGhostRenderer`, which replaces the ghost
that follows the cursor while dragging a group.

**Sharp edge:** both live in `PROPERTY_KEYS_DOCKVIEW`, so today's blanket forwarding loop would
push our `{component|snippet}` objects straight through as if they were factories. They must join
`theme` in the exclusion list at the top of `DockView.svelte` and be mapped instead. That is
precisely the bug the existing `forwardedOptionKeys` comment warns about, one level out.

### 3.6 New surface: edge groups

Also mostly api-side and free on upgrade: `addEdgeGroup(position, options)` (returns a
`DockviewGroupPanelApi`), `getEdgeGroup`, `removeEdgeGroup`, `setEdgeGroupVisible`,
`isEdgeGroupVisible`. Panels are placed into one with `position: { referenceGroup: <id> }`.

The wrapper work is the placement builder: [release/config.ts](release/config.ts) only knows
`reference` → `referencePanel`. It needs a sibling step for `referenceGroup` so an edge group
reads as well as a panel reference does:

```ts
const edge = api.addEdgeGroup("left", { id: "activity-bar", initialSize: 48 });
api.addComponentPanel("Explorer", { … }, panel("dock").group(edge).id("explorer")());
```

`pinEdgeGroup` / `autoHideEdgeGroup` / `peekEdgeGroup` are on the same api but are backed by the
enterprise auto-hide module — they type-check and do nothing on the free package (§7).

### 3.7 Unaffected

Verified against the 8.1.0 type definitions: `createDockview` / `createGridview` /
`createSplitview` / `createPaneview`, the `GridviewPanel` and `SplitviewPanel` constructors we
subclass, `IPanePart`, `PanelUpdateEvent`, `IFrameworkPart`, `Orientation`, the `Dockview*`
disposable/emitter aliases, and `PROPERTY_KEYS_GRIDVIEW` / `_SPLITVIEW` / `_PANEVIEW`
(byte-identical lists) all still hold.

`PROPERTY_KEYS_DOCKVIEW` grew from 17 keys to 41. `DockView.svelte` forwards the list generically,
so every new option becomes settable once the props type is rebuilt — no per-option work.
`rootOverlayModel` simply leaves the list.

---

## 4. Consumer-facing changes

Worth a changelog entry, because none of it is our code:

- `theme="replit"` no longer exists.
- `api.onDidActivePanelChange` emits `{ panel, origin }` instead of the panel.
- `api.onUnhandledDragOverEvent` → `onUnhandledDragOver`; `PaneviewDropEvent` → `PaneviewDidDropEvent`;
  `DockviewGroupPanelFloatingChangeEvent` → `DockviewGroupPanelLocationChangeEvent`;
  `AddComponentOptions` → `AddGridviewComponentOptions`; `Contraints` → `Constraints`.
- `api.moveToNext` / `moveToPrevious` → `activateNext` / `activatePrevious` (old names kept as
  deprecated aliases).
- Panels are now told the size of their **content area**, not the group box: `onDidDimensionsChange`
  no longer includes the tab header along the header's axis. Only matters to panels that size
  themselves from those numbers (canvas, virtualised lists).
- `rootOverlayModel` is gone; use `dropOverlayModel` / `dndEdges`.

---

## 5. What we get, free

- **Tab groups** and **edge groups** — see §3.5 / §3.6.
- **Accessibility** — WAI-ARIA roles and states on tabs and groups, screen-reader live regions,
  keyboard tab navigation and focus management, and an i18n message catalogue for all of it.
  The strongest single argument for the upgrade.
- **Header position** (v5) — tab strips on any edge, per layout or per group.
- **`onShow` / `onHide`** renderer hooks under `renderer: "onlyWhenVisible"` — exactly the seam
  [release/utils/PanelRendererBase.ts](release/utils/PanelRendererBase.ts) has no way to expose today.
- Floating and popout windows as nested multi-group layouts; a dedicated floating drag handle.
- `reuseExistingPanels`, custom scrollbars, strict-CSP `nonce`, `messages`, `announcer`,
  `dropPositionResolver`, `dndStrategy`.
- Layout hot-path performance work (8.1) and a long tail of fixes we currently carry: iframe
  pointer events, sash dragging inside popout windows, panel content lost on extreme drop targets,
  `FocusTracker` desync when adding panels from panel content, floating panels resizing to full width.

---

## 6. What moved behind the enterprise licence

`dockview-enterprise` is a separately licensed package. Its options exist on the free package but
are **inert** — they type-check, nothing happens, and the console names the package to install.
Of these, only two are on our wish list: **tab context menus** and **layout history**.

| Enterprise feature | On our list? |
| --- | --- |
| Tab / chip context menus | **Yes** — see §7.1 |
| Layout history (undo/redo) | **Yes** — see §7.2 |
| Pinned tabs, multi-row tabs, advanced overflow (search / MRU) | No |
| DnD compass, smart guides | No |
| Auto-hide edge groups, dock-to edge groups | No |
| Spatial keyboard navigation, keyboard docking | No |

Note the direction of travel: `getTabContextMenuItems` shipped **free** in v6 and is enterprise in
v8. Features can move; the free surface at the version we pin is what we can rely on.

---

## 7. Rebuilding the two we want

Both are reproducible on the free public API. Neither needs internals, a fork, or a patch.

### 7.1 Tab context menus — straightforward, ~1 day

We render the tabs. `oncontextmenu` on a tab is ours to hook, and every built-in menu action maps
to a public, free api call:

| Built-in item | Free equivalent |
| --- | --- |
| `close` | `panel.api.close()` |
| `closeOthers` / `closeAll` / `closeLeft` / `closeRight` | iterate the ordered `panel.api.group.panels` and close |
| `maximize` | `panel.api.maximize()` / `isMaximized()` / `exitMaximized()` |
| `float` | `api.addFloatingGroup(panel)` |
| `popout` | `api.addPopoutGroup(panel)` (async, resolves `boolean`) |
| `separator` | ours to draw |
| `pin` | **not reproducible** — `api.setPinned` is backed by the enterprise PinnedTabs module |

So we lose exactly one item out of ten, and it is the one belonging to a feature we do not want.

Shape it like the rest of the library: a `tabContextMenu` prop taking a component or snippet
rendered at the pointer, receiving `{ panel, group, api, close }` — deliberately the same argument
shape as upstream's `IContextMenuItemComponentProps`, so a later licence purchase is a swap rather
than a rewrite. [release/dock/DefaultDockTab.svelte](release/dock/DefaultDockTab.svelte) gains the
hook, which also means it should become the default tab whenever a context menu is configured
(dockview's own built-in tab is not ours to instrument).

**Risk: low.** Nothing depends on dockview internals. The menu is a positioned popover with
dismiss-on-outside-click and Escape — the fiddly part is the popover, not the docking.

### 7.2 Layout history (undo/redo) — moderate, 2–4 days, with caveats

Upstream publishes its own blueprint: the `ILayoutHistoryHost` contract in `moduleContracts.d.ts`
lists everything the enterprise service consumes, and **all four are public and free** on
`DockviewApi`:

- `onWillMutateLayout` — bracket the pre-image; nested operations of one gesture fire once.
- `onDidMutateLayout` — capture the post-image.
- `onDidLayoutChange` — coalesced ping, and the *only* signal for a sash resize (which does not
  cross the mutation boundary).
- `popoutRestorationPromise` — settles when popout windows finish reopening; the guard undo/redo
  must hold before applying the next entry.

Mutation events carry `kind` (`'add' | 'remove' | 'move' | 'float' | 'popout' | 'maximize' |
'tab-group' | 'load' | 'clear'`) and `origin` (`'user' | 'api'`), so recording only user gestures —
the usual thing an undo stack wants — is a one-line filter.

The mechanism is then: snapshot `api.toJSON()` on the will-edge, push `{ before, after }` on the
did-edge, restore with `api.fromJSON(snapshot, { reuseExistingPanels: true })`.

Four things to get right, in descending order of nastiness:

1. **Our `reactive()` bindings do not survive a rebuild.** `ReactivePanelUpdater.attach` binds to a
   panel *object* and detaches on `onDidRemovePanel`. If an undo tears panels down and re-adds them,
   the new panel objects have no subscribers and reactive params silently stop updating.
   `reuseExistingPanels: true` (added in 4.12) is the mitigation — it keeps the instances, so the
   subscriber map stays valid — but this needs a test on both paths before anyone relies on it.
   This is the single most likely place for a home-grown history to quietly misbehave.
2. **Panel-internal state is not serialized.** `toJSON` captures `params`, not whatever `$state`
   a panel component holds. With `reuseExistingPanels` the instance survives and so does its state;
   without it, an undo resets components to their initial render.
3. **Popouts are asynchronous.** Await `popoutRestorationPromise` between entries or a fast
   undo/redo sequence will interleave with a window still reopening.
4. **Resizes need coalescing.** Sash drags surface only through `onDidLayoutChange`; debounce them
   into one entry (upstream labels them with a synthetic `'resize'` kind) or skip them entirely.

Ship it as an opt-in module — `release/history.ts`, `createLayoutHistory(api)` returning
`{ undo, redo, canUndo, canRedo, clear }` — rather than wiring it into `DockView.svelte`. Keybindings
stay the app's business, as they are upstream.

**Name it distinctly.** `api.undo()`, `api.redo()`, `api.canUndo`, `api.onDidChangeHistory` all exist
on the free typings and are inert without the enterprise module. A consumer who finds them and calls
them gets silence, so our helper must not shadow those names, and the docs should say why they are there.

---

## 8. Path and verification

1. **Land 4.13.1 first.** No breaking changes; picks up `reuseExistingPanels` (which §7.2 depends on)
   plus the iframe / floating-panel / focus-tracker fixes. Cheap proof that the suite catches drift.
2. **6.6.1 next.** Themes and CSS only (§3.3): drop `themeReplit`, add the new themes, re-copy the
   stylesheet, widen the `theme` prop. Still nothing in the type spine.
3. **8.1.0 last, in one step.** Skip 7.x as a resting point — its only content for us is the package
   realignment, and there is no reason to do that work twice. §3.1, §3.2 and §3.4 happen here.
4. **Then the additive work:** tab groups and edge groups (§3.5, §3.6), each with tests, then the
   two rebuilds (§7) if and when they are wanted.
5. Re-run `npm run report` and `npm run check` at every step. Step 3 is where `npm run check` will
   scream; steps 1, 2 and 4 are where the runtime suite will.

Tests worth adding alongside the port, since they cover exactly what is most likely to break
silently: a reactive-param survival test across `fromJSON` (§7.2 item 1), a `tabLocation` assertion
on custom tabs (§3.4), and a chip renderer test mirroring the existing watermark test (§3.5).
