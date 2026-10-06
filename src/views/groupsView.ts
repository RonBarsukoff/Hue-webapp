import html from "../templates/groups.html?raw";
import { Group, HueClient, throttleLatest } from "../hue";

export async function showGroupsView(
  root: HTMLElement,
  client: HueClient,
  onSelect: (group: Group) => void,
  onSettings: () => void,
  onAdd: () => void,
): Promise<void> {
  root.innerHTML = html;
  root.querySelector<HTMLButtonElement>("#settings")!.onclick = onSettings;
  root.querySelector<HTMLButtonElement>("#add")!.onclick = onAdd;
  const status = root.querySelector<HTMLElement>("#status")!;
  const list = root.querySelector<HTMLElement>("#groups")!;
  const showError = (e: unknown) => { status.textContent = (e as Error).message; status.className = "status error"; };

  let groups: Group[];
  try {
    groups = await client.getGroups();
  } catch (e) {
    return showError(e);
  }
  if (!groups.length) status.textContent = "Geen groepen gevonden.";

  for (const group of groups) {
    const card = document.createElement("div");
    card.className = "card clickable";
    card.innerHTML = `
      <div class="row">
        <div><div class="name"></div><div class="sub"></div></div>
        <label class="switch"><input type="checkbox" /><span></span></label>
      </div>
      <input class="slider" type="range" min="1" max="254" />`;
    card.querySelector(".name")!.textContent = group.name;
    card.querySelector(".sub")!.textContent = `${group.lights.length} lampen`;
    const toggle = card.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    const slider = card.querySelector<HTMLInputElement>(".slider")!;
    toggle.checked = group.state.any_on;
    slider.value = String(group.action.bri ?? 254);

    // Bediening mag de navigatie naar de groep niet triggeren
    for (const el of [toggle.parentElement!, slider]) el.addEventListener("click", e => e.stopPropagation());
    // Bij aanzetten geldt de huidige sliderpositie; bij uitstaan wordt de slider genegeerd
    toggle.onchange = () => client.setGroup(group.id, toggle.checked ? { on: true, bri: Number(slider.value) } : { on: false }).catch(showError);
    const sendBri = throttleLatest((bri: number) => client.setGroup(group.id, { bri, transitiontime: 1 }), showError);
    slider.oninput = () => {
      if (toggle.checked) sendBri(Number(slider.value));
    };
    card.onclick = () => onSelect(group);
    list.appendChild(card);
  }
}
