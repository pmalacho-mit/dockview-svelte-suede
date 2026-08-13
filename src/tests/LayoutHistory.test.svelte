<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { createLayoutHistory, DockView, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import { labels, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  class Renamed extends ViewPocket<Api> {
    text = $state("before");
  }

  const at = (id: string) => panel("dock").id(id)();

  /**
   * A test drives the api, so it records what a user gesture would produce by
   * recording api-origin mutations too.
   */
  const history = (api: Api) =>
    createLayoutHistory(api, { origins: ["user", "api"] });

  const twoPanels = async (api: Api) => {
    await api.addComponentPanel("Label", { text: "first" }, at("first"));
    await api.addComponentPanel("Label", { text: "second" }, at("second"));
  };
</script>

<Sweater config category="Layout history" orientation="vertical" />

<Sweater
  name="undo steps back over the last layout change, redo returns to it"
  body={async (harness) => {
    harness.set(new Renamed());
    const { api } = await harness.definition("api");

    const layout = history(api);
    await twoPanels(api);
    harness.expect(api.panels).toHaveLength(2);

    await layout.undo();
    await harness.delay({ frames: 2 });

    harness.expect(layout.canRedo).toBe(true);
    harness.expect(api.panels.map(({ id }) => id)).toEqual(["first"]);

    await layout.redo();
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(api.panels.map(({ id }) => id)).toEqual(["first", "second"]);
    harness.expect(layout.canRedo).toBe(false);

    layout.dispose();
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="reactive params survive an undo"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    const layout = history(api);
    await api.addComponentPanel(
      "Label",
      { text: api.reactive(() => pocket.text) },
      at("first")
    );
    await api.addComponentPanel("Label", { text: "second" }, at("second"));

    await layout.undo();
    await harness.delay({ frames: 2 });

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.note("the rebuilt layout kept the panel instance, so its params still update");
    harness.expect(labels(harness.container)).toEqual(["after"]);

    layout.dispose();
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="reactive params do not survive a rebuild that replaces panels"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: api.reactive(() => pocket.text) },
      at("first")
    );
    const snapshot = api.toJSON();

    api.fromJSON(snapshot);
    await harness.delay({ frames: 2 });

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.note(
      "without `reuseExistingPanels` the panel is rebuilt, and the new instance has no subscribers"
    );
    harness.expect(labels(harness.container)).toEqual(["before"]);
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

{#snippet dock(onReady: Renamed["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView theme="dark" components={{ Label: DockLabel }} {onReady} />
  </div>
{/snippet}
