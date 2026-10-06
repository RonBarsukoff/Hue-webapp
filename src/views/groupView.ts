import html from "../templates/group.html?raw";
import { Group, HueClient, throttleLatest } from "../hue";

export async function showGroupView(
  root: HTMLElement,
  client: HueClient,
  group: Group,
  onBack: () => void,
  onEdit: () => void,
): Promise<void> {
  root.innerHTML = html;
  root.querySelector<HTMLElement>("#title")!.textContent = group.name;
  root.querySelector<HTMLButtonElement>("#back")!.onclick = onBack;
  root.querySelector<HTMLButtonElement>("#edit")!.onclick = onEdit;
  const status = root.querySelector<HTMLElement>("#status")!;
  const list = root.querySelector<HTMLElement>("#lights")!;
  const showError = (e: unknown) => { status.textContent = (e as Error).message; status.className = "status error"; };

  try {
    const lights = await client.getLights(group.lights);
    for (const light of lights) {
      const card = document.createElement("div");
      card.className = "card" + (light.state.reachable ? "" : " unreachable");
      card.innerHTML = `
        <div class="row">
          <div><div class="name"></div><div class="sub"></div></div>
          <label class="switch"><input type="checkbox" /><span></span></label>
        </div>`;
      card.querySelector(".name")!.textContent = light.name;
      card.querySelector(".sub")!.textContent = light.state.reachable ? "" : "Niet bereikbaar";
      const toggle = card.querySelector<HTMLInputElement>("input")!;
      toggle.checked = light.state.on;
      let slider: HTMLInputElement | undefined;
      toggle.onchange = () => {
        const state = toggle.checked && slider ? { on: true, bri: Number(slider.value) } : { on: toggle.checked };
        client.setLight(light.id, state).catch(showError);
      };

      if (light.state.bri !== undefined) {
        slider = document.createElement("input");
        slider.type = "range";
        slider.className = "slider";
        slider.min = "1";
        slider.max = "254";
        slider.value = String(light.state.bri);
        const s = slider;
        const sendBri = throttleLatest((bri: number) => client.setLight(light.id, { bri, transitiontime: 1 }), showError);
        s.oninput = () => {
          if (toggle.checked) sendBri(Number(s.value));
        };
        card.appendChild(s);
      }
      list.appendChild(card);
    }
    if (!lights.length) status.textContent = "Geen lampen in deze groep.";
  } catch (e) {
    showError(e);
  }
}
