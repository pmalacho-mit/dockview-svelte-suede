import type { Snippet } from "svelte";
import type { PanelProps, ViewAPI } from "../../release";
import type { Params } from "./fixtures/Label.svelte";
import type DockLabel from "./fixtures/DockLabel.svelte";
import type DockCounter from "./fixtures/DockCounter.svelte";
import type GridLabel from "./fixtures/GridLabel.svelte";
import type PaneLabel from "./fixtures/PaneLabel.svelte";

declare const dock: ViewAPI<
  "dock",
  {
    Label: typeof DockLabel;
    Counter: typeof DockCounter;
    label: Snippet<[PanelProps<"dock", Params>]>;
  }
>;

declare const grid: ViewAPI<"grid", { Label: typeof GridLabel }>;

declare const pane: ViewAPI<"pane", { Label: typeof PaneLabel }>;

const namedComponentsAndSnippetsAreAccepted = () => {
  dock.addComponentPanel("Label", { text: "hello" });
  dock.addComponentPanel("Counter", { start: 0 });
  dock.addSnippetPanel("label", { text: "hello" });
};

const unknownNamesAreRejected = () => {
  // @ts-expect-error "Missing" is not one of the view's components
  dock.addComponentPanel("Missing", { text: "hello" });
  // @ts-expect-error "missing" is not one of the view's snippets
  dock.addSnippetPanel("missing", { text: "hello" });
};

const componentsAndSnippetsDoNotSwap = () => {
  // @ts-expect-error "label" is a snippet, not a component
  dock.addComponentPanel("label", { text: "hello" });
  // @ts-expect-error "Label" is a component, not a snippet
  dock.addSnippetPanel("Label", { text: "hello" });
};

const paramsFollowTheRenderable = () => {
  // @ts-expect-error `text` is a string
  dock.addComponentPanel("Label", { text: 1 });
  // @ts-expect-error `start` is a number, and `Counter` has no `text`
  dock.addComponentPanel("Counter", { text: "hello" });
  // @ts-expect-error `text` is a string
  dock.addSnippetPanel("label", { text: 1 });
};

const placementIsCheckedAgainstTheView = () => {
  grid.addComponentPanel(
    "Label",
    { text: "hello" },
    { id: "second", position: { referencePanel: "first", direction: "right" } }
  );
  const sideways = { position: { referencePanel: "first", direction: "sideways" } } as const;
  // @ts-expect-error "sideways" is not a direction
  grid.addComponentPanel("Label", { text: "hello" }, sideways);
};

const viewSpecificOptionsStayOnTheirView = () => {
  pane.addComponentPanel("Label", { text: "hello" }, { title: "A section" });
  // @ts-expect-error `title` belongs to pane panels, not grid panels
  grid.addComponentPanel("Label", { text: "hello" }, { title: "A section" });
};

const reactiveParamsKeepTheirType = () => {
  dock.addComponentPanel("Label", { text: dock.reactive(() => "hello") });
  // @ts-expect-error a reactive number is still not a string
  dock.addComponentPanel("Label", { text: dock.reactive(() => 1) });
};

export const typingChecks = {
  namedComponentsAndSnippetsAreAccepted,
  unknownNamesAreRejected,
  componentsAndSnippetsDoNotSwap,
  paramsFollowTheRenderable,
  placementIsCheckedAgainstTheView,
  viewSpecificOptionsStayOnTheirView,
  reactiveParamsKeepTheirType,
};
