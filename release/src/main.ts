import { mount } from "svelte";
import Dock from "./Dock.svelte";

const app = mount(Dock, {
  target: document.getElementById("app")!,
});

export default app;
