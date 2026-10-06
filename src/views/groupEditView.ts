import html from "../templates/groupEdit.html?raw";
import { Group, HueClient } from "../hue";

/** Toevoegen (group is undefined) of bewerken van een groep. */
export async function showGroupEditView(
  root: HTMLElement,
  client: HueClient,
  group: Group | undefined,
  onCancel: () => void,
  onDone: () => void,
): Promise<void> {
  root.innerHTML = html;
  root.querySelector<HTMLElement>("#title")!.textContent = group ? "Groep bewerken" : "Nieuwe groep";
  root.querySelector<HTMLButtonElement>("#back")!.onclick = onCancel;
  const name = root.querySelector<HTMLInputElement>("#name")!;
  const list = root.querySelector<HTMLElement>("#lights")!;
  const status = root.querySelector<HTMLElement>("#status")!;
  const save = root.querySelector<HTMLButtonElement>("#save")!;
  const del = root.querySelector<HTMLButtonElement>("#delete")!;
  const showError = (e: unknown) => { status.textContent = (e as Error).message; status.className = "status error"; };

  name.value = group?.name ?? "";
  del.hidden = !group;
  save.disabled = true;

  const boxes: { id: string; box: HTMLInputElement }[] = [];
  try {
    for (const light of await client.getAllLights()) {
      const row = document.createElement("label");
      row.className = "row check";
      row.innerHTML = `<span class="name"></span><input type="checkbox" />`;
      row.querySelector(".name")!.textContent = light.name;
      const box = row.querySelector<HTMLInputElement>("input")!;
      box.checked = group?.lights.includes(light.id) ?? false;
      boxes.push({ id: light.id, box });
      list.appendChild(row);
    }
    save.disabled = false;
  } catch (e) {
    return showError(e);
  }

  const run = async (action: () => Promise<unknown>) => {
    save.disabled = del.disabled = true;
    try {
      await action();
      onDone();
    } catch (e) {
      showError(e);
      save.disabled = del.disabled = false;
    }
  };

  save.onclick = () => {
    const n = name.value.trim();
    if (!n) return showError(new Error("Vul een naam in."));
    const lights = boxes.filter(b => b.box.checked).map(b => b.id);
    if (!lights.length) return showError(new Error("Kies minstens één lamp."));
    void run(() => (group ? client.updateGroup(group.id, n, lights) : client.createGroup(n, lights)));
  };

  del.onclick = () => {
    if (!group || !confirm(`Groep "${group.name}" verwijderen?`)) return;
    void run(() => client.deleteGroup(group.id));
  };
}
