import {
  DockviewCompositeDisposable,
  DockviewEmitter,
  DockviewEvent,
  DockviewMutableDisposable,
} from "dockview";
import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
  IDockviewPanelProps,
  IDockviewPanelHeaderProps,
  ITabRenderer,
  TabPartInitParameters,
  IWatermarkRenderer,
  IWatermarkPanelProps,
  WatermarkRendererInitParameters,
  IDockviewHeaderActionsProps,
  IGroupHeaderProps,
  IHeaderActionsRenderer,
  DockviewGroupPanel,
} from "dockview";
import PanelRendererBase, {
  type ConstructorConfigWithout,
} from "../utils/PanelRendererBase.js";
import type { PropsUpdater } from "../utils/PropsUpdater.svelte.js";

export class SvelteDockComponentRenderer<Props extends IDockviewPanelProps>
  extends PanelRendererBase<Props, GroupPanelPartInitParameters>
  implements IContentRenderer
{
  private readonly _onDidFocus = new DockviewEmitter<void>();
  readonly onDidFocus: DockviewEvent<void> = this._onDidFocus.event;

  private readonly _onDidBlur = new DockviewEmitter<void>();
  readonly onDidBlur: DockviewEvent<void> = this._onDidBlur.event;

  constructor(
    config: ConstructorConfigWithout<Props, GroupPanelPartInitParameters>
  ) {
    super({
      ...config,
      panelTarget: "dock",
      initOptionsToProps: ({ params, api, containerApi }) =>
        ({ params, api, containerApi } as Props),
    });
  }

  public dispose(): void {
    super.dispose();
    this._onDidFocus.dispose();
    this._onDidBlur.dispose();
  }
}

export class SvelteDockHeaderRenderer<Props extends IDockviewPanelHeaderProps>
  extends PanelRendererBase<Props, TabPartInitParameters>
  implements ITabRenderer
{
  constructor(
    config: ConstructorConfigWithout<Props, TabPartInitParameters>
  ) {
    super({
      ...config,
      panelTarget: "dockheader",
      initOptionsToProps: ({ params, api, containerApi, tabLocation }) =>
        ({ params, api, containerApi, tabLocation } as Props),
    });
  }
}

export class SvelteWatermarkRenderer<Props extends IWatermarkPanelProps>
  extends PanelRendererBase<Props, WatermarkRendererInitParameters>
  implements IWatermarkRenderer
{
  constructor(
    config: ConstructorConfigWithout<Props, WatermarkRendererInitParameters>
  ) {
    super({
      ...config,
      propsHasParams: false,
      panelTarget: "dockwatermark",
      initOptionsToProps: ({ group, containerApi }) =>
        ({ group, containerApi } as Props),
    });
  }
}

/** The header action props that track their group rather than sitting still. */
const liveHeaderActionProps = (group: DockviewGroupPanel) => ({
  panels: group.model.panels,
  activePanel: group.model.activePanel,
  isGroupActive: group.api.isActive,
  headerPosition: group.api.getHeaderPosition(),
  location: group.api.location,
});

type LiveHeaderActionProps = ReturnType<typeof liveHeaderActionProps>;

export class SvelteDockActionsHeaderRenderer<
    Props extends IDockviewHeaderActionsProps
  >
  extends PanelRendererBase<Props, IGroupHeaderProps>
  implements IHeaderActionsRenderer
{
  private readonly mutableDisposable = new DockviewMutableDisposable();
  private readonly group: DockviewGroupPanel;

  constructor(
    group: DockviewGroupPanel,
    config: ConstructorConfigWithout<Props, IGroupHeaderProps>
  ) {
    super({
      ...config,
      propsHasParams: false,
      panelTarget: "dockactions",
      initOptionsToProps: ({ api, containerApi }) =>
        ({
          api,
          containerApi,
          group,
          ...liveHeaderActionProps(group),
        } as Props),
    });

    this.group = group;
  }

  init(parameters: IGroupHeaderProps): void {
    const { model, api } = this.group;

    this.mutableDisposable.value = new DockviewCompositeDisposable(
      model.onDidAddPanel(this.refresh("panels")),
      model.onDidRemovePanel(this.refresh("panels")),
      model.onDidActivePanelChange(this.refresh("activePanel")),
      api.onDidActiveChange(this.refresh("isGroupActive")),
      api.onDidHeaderDirectionChange(this.refresh("headerPosition")),
      api.onDidLocationChange(this.refresh("location"))
    );

    super.init(parameters);
  }

  dispose(): void {
    super.dispose();
    this.mutableDisposable.dispose();
  }

  private refresh =
    <Key extends keyof LiveHeaderActionProps>(key: Key) =>
    (): void => {
      (
        this.propsUpdater as unknown as PropsUpdater<IDockviewHeaderActionsProps>
      )?.updateSingle(key, liveHeaderActionProps(this.group)[key]);
    };
}
