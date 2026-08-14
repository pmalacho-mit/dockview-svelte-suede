<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import {
    createLayoutHistory,
    DockView,
    type LayoutHistory,
    type ViewAPI,
  } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import { labels, rendered, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  class Historied extends ViewPocket<Api> {
    history = $state.raw<LayoutHistory>();
    text = $state("before");
    private added = 0;

    /**
     * Buttons drive the api, so this records api-origin mutations too. Left at
     * the default an undo stack follows user gestures only.
     */
    ready = ({ api }: { api: Api }) => {
      this.history = createLayoutHistory(api, { origins: ["user", "api"] });
      return (this.api = api);
    };

    add = async (options?: { reactive: true }) => {
      const id = `panel ${++this.added}`;
      await this.api?.addComponentPanel(
        "Label",
        { text: options ? this.api.reactive(() => this.text) : id },
        panel("dock").id(id).title(id)()
      );
    };

    closeActive = () => this.api?.activePanel?.api.close();
  }

  const click = (container: HTMLElement, testId: string) =>
    rendered.only(container, testId).click();

  const button = (container: HTMLElement, testId: string) =>
    rendered.only(container, testId) as HTMLButtonElement;

  const ids = (api: Api) => api.panels.map(({ id }) => id);
</script>

<Sweater config category="Layout history" orientation="vertical" />

<Sweater
  name="undo steps back over the last change, redo returns to it"
  body={async (harness) => {
    const pocket = harness.set(new Historied());
    const { api } = await harness.definition("api");

    click(harness.container, "add");
    await harness.delay({ frames: 2 });
    click(harness.container, "add");
    await harness.delay({ frames: 2 });
    harness.expect(ids(api)).toEqual(["panel 1", "panel 2"]);

    click(harness.container, "undo");
    await harness.delay({ frames: 2 });
    harness.expect(ids(api)).toEqual(["panel 1"]);
    harness.expect(pocket.history?.canRedo).toBe(true);

    click(harness.container, "redo");
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(ids(api)).toEqual(["panel 1", "panel 2"]);
    harness.expect(pocket.history?.canRedo).toBe(false);
  }}
>
  {#snippet vest(pocket: Historied)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

<Sweater
  name="the buttons follow what is on the stacks"
  body={async (harness) => {
    harness.set(new Historied());
    await harness.definition("api");

    harness.expect(button(harness.container, "undo").disabled).toBe(true);
    harness.expect(button(harness.container, "redo").disabled).toBe(true);

    click(harness.container, "add");
    await harness.delay({ frames: 2 });

    harness.note("`canUndo` is reactive, so the button binds straight to it");
    harness.expect(button(harness.container, "undo").disabled).toBe(false);
    harness.expect(button(harness.container, "undo")).toHaveTextContent(
      "Undo (1)"
    );

    click(harness.container, "undo");
    await harness.delay({ frames: 2 });

    harness.expect(button(harness.container, "undo").disabled).toBe(true);
    harness.expect(button(harness.container, "redo").disabled).toBe(false);
  }}
>
  {#snippet vest(pocket: Historied)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

<Sweater
  name="closing a panel is undone too"
  body={async (harness) => {
    harness.set(new Historied());
    const { api } = await harness.definition("api");

    click(harness.container, "add");
    await harness.delay({ frames: 2 });
    click(harness.container, "close");
    await harness.delay({ frames: 2 });
    harness.expect(api.panels).toHaveLength(0);

    click(harness.container, "undo");
    await harness.delay({ frames: 2 });

    harness.expect(ids(api)).toEqual(["panel 1"]);
  }}
>
  {#snippet vest(pocket: Historied)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

<Sweater
  name="reactive params survive an undo"
  body={async (harness) => {
    const pocket = harness.set(new Historied());
    await harness.definition("api");

    await pocket.add({ reactive: true });
    click(harness.container, "add");
    await harness.delay({ frames: 2 });

    click(harness.container, "undo");
    await harness.delay({ frames: 2 });

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.note(
      "`reuseExistingPanels` kept the panel instance, so its subscribers are still attached"
    );
    harness.expect(labels(harness.container)).toEqual(["after"]);
  }}
>
  {#snippet vest(pocket: Historied)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

<Sweater
  name="reactive params do not survive a rebuild that replaces panels"
  body={async (harness) => {
    const pocket = harness.set(new Historied());
    const { api } = await harness.definition("api");

    await pocket.add({ reactive: true });
    api.fromJSON(api.toJSON());
    await harness.delay({ frames: 2 });

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.note(
      "without `reuseExistingPanels` the panel is rebuilt, and the new instance has no subscribers"
    );
    harness.expect(labels(harness.container)).toEqual(["before"]);
  }}
>
  {#snippet vest(pocket: Historied)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

{#snippet dock(pocket: Historied)}
  <div
    style:display="flex"
    style:flex-direction="column"
    style:width="100%"
    style:height="100%"
  >
    <div class="toolbar">
      <button type="button" data-testid="add" onclick={() => pocket.add()}>
        Add a panel
      </button>
      <button type="button" data-testid="close" onclick={pocket.closeActive}>
        Close the active panel
      </button>
      <button
        type="button"
        data-testid="undo"
        disabled={!pocket.history?.canUndo}
        onclick={() => pocket.history?.undo()}
      >
        Undo ({pocket.history?.undoCount ?? 0})
      </button>
      <button
        type="button"
        data-testid="redo"
        disabled={!pocket.history?.canRedo}
        onclick={() => pocket.history?.redo()}
      >
        Redo ({pocket.history?.redoCount ?? 0})
      </button>
    </div>

    <div style:flex="1" style:min-height="0">
      <DockView
        theme="dark"
        components={{ Label: DockLabel }}
        onReady={pocket.ready}
      />
    </div>
  </div>
{/snippet}

<style>
  .toolbar {
    display: flex;
    gap: 6px;
    padding: 6px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
  }

  .toolbar button {
    padding: 3px 8px;
    border: 1px solid #444;
    border-radius: 3px;
    background: #262626;
    color: #ddd;
    font-size: 12px;
    cursor: pointer;
  }

  .toolbar button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .toolbar button:hover:not(:disabled) {
    background: #333;
  }
</style>
