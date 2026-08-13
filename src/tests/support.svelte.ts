export class ViewPocket<Api> {
  api = $state<Api>();
  ready = ({ api }: { api: Api }) => (this.api = api);
}

export const rendered = {
  all: (container: HTMLElement, testId: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)
    ),
  texts: (container: HTMLElement, testId: string) =>
    rendered
      .all(container, testId)
      .map((element) => element.textContent?.trim() ?? ""),
  rects: (container: HTMLElement, testId: string) =>
    rendered
      .all(container, testId)
      .map((element) => element.getBoundingClientRect()),
  only: (container: HTMLElement, testId: string) => {
    const [element, ...rest] = rendered.all(container, testId);
    if (!element)
      throw new Error(`No element matching [data-testid="${testId}"]`);
    if (rest.length)
      throw new Error(
        `Expected a single [data-testid="${testId}"], found ${rest.length + 1}`
      );
    return element;
  },
};

export const labels = (container: HTMLElement) =>
  rendered.texts(container, "label");

/** Every view mounts its panels into an element tagged with what it renders. */
export const mounted = {
  parts: (container: HTMLElement, target: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        `[data-dockview-svelte^="${target}-"]`
      )
    ),
  rects: (container: HTMLElement, target: string) =>
    mounted.parts(container, target).map((part) => part.getBoundingClientRect()),
};
