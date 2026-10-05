import html from "../templates/group.html?raw";
import { Group, HueClient } from "../hue";

export async function showGroupView(
  root: HTMLElement,
  client: HueClient,
  group: Group,
  onBack: () => void,
): Promise<void> {
  root.innerHTML = html;
  root.querySelector<HTMLElement>("#title")!.textContent = group.name;
  root.querySelector<HTMLButtonElement>("#back")!.onclick = onBack;
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
      toggle.onchange = () => client.setLight(light.id, { on: toggle.checked }).catch(showError);

      if (light.state.bri !== undefined) {
        const slider = document.createElement("input");
        slider.type = "range";
        slider.className = "slider";
        slider.min = "1";
        slider.max = "254";
        slider.value = String(light.state.bri);
        slider.oninput = () => {
          toggle.checked = true;
          client.setLight(light.id, { on: true, bri: Number(slider.value) }).catch(showError);
        };
        card.appendChild(slider);
      }
      list.appendChild(card);
    }
    if (!lights.length) status.textContent = "Geen lampen in deze groep.";
  } catch (e) {
    showError(e);
  }
}
