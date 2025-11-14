import type { IView } from "dockview-core";
import type { AddedPanelByView } from "./index.js";

export default class ReactivePanelUpdater<T> {
  #value?: T;

  private readonly effect: () => void;
  private readonly subscribers = new Map<
    AddedPanelByView,
    (value: T) => void
  >();
  private cleanup?: () => void;

  get value() {
    return this.#value;
  }

  constructor(getter: () => T) {
    this.#value = getter();
    this.effect = () => {
      const value = getter();
      this.#value = value;
      for (const subscriber of this.subscribers.values()) subscriber(value);
    };
  }

  attach(panel: AddedPanelByView, path: string[]) {
    const root = path.reduce((acc, curr, index, { length }) => {
      const isLast = index === length - 1;
      acc[curr] = isLast ? this.#value : {};
      return acc;
    }, {} as Record<string, any>);

    this.subscribers.set(panel, (value: T) => {
      path.reduce((acc, curr, index, { length }) => {
        const isLast = index === length - 1;
        if (isLast) {
          acc[curr] = value;
        } else return acc[curr];
      }, root!);

      panel.update(root as any);
    });

    this.track(panel);
    this.cleanup ??= $effect.root(() => {
      $effect(this.effect);
    });
  }

  detach(panel: AddedPanelByView) {
    this.subscribers.delete(panel);
    if (this.subscribers.size > 0) return;
    this.cleanup?.();
    this.cleanup = undefined;
  }

  private track(panel: AddedPanelByView) {
    const { ByPanel } = ReactivePanelUpdater;
    ByPanel.get(panel)?.push(this) ?? ByPanel.set(panel, [this]);
  }

  static Detach = (panel: AddedPanelByView | IView) =>
    ReactivePanelUpdater.ByPanel.get(panel as AddedPanelByView)?.forEach(
      (effect) => effect.detach(panel as AddedPanelByView)
    );

  private static readonly ByPanel = new Map<
    AddedPanelByView,
    ReactivePanelUpdater<any>[]
  >();
}
