import html from "../templates/settings.html?raw";
import { loadSettings, saveSettings, requestApiKey, HueClient } from "../hue";

export function showSettingsView(root: HTMLElement, onConnected: () => void): void {
  root.innerHTML = html;
  const ip = root.querySelector<HTMLInputElement>("#bridge-ip")!;
  const key = root.querySelector<HTMLInputElement>("#api-key")!;
  const status = root.querySelector<HTMLElement>("#status")!;
  const connect = root.querySelector<HTMLButtonElement>("#connect")!;
  const getKey = root.querySelector<HTMLButtonElement>("#get-key")!;

  const saved = loadSettings();
  ip.value = saved.ip;
  key.value = saved.apiKey;

  const setStatus = (msg: string, kind: "error" | "ok" | "" = "") => {
    status.textContent = msg;
    status.className = `status ${kind}`;
  };

  connect.onclick = async () => {
    if (!ip.value.trim() || !key.value.trim()) return setStatus("Vul IP-adres en API-sleutel in.", "error");
    connect.disabled = true;
    setStatus("Verbinden...");
    try {
      const settings = { ip: ip.value.trim(), apiKey: key.value.trim() };
      await new HueClient(settings).getGroups();
      saveSettings(settings);
      onConnected();
    } catch (e) {
      setStatus((e as Error).message, "error");
    } finally {
      connect.disabled = false;
    }
  };

  getKey.onclick = async () => {
    if (!ip.value.trim()) return setStatus("Vul eerst het IP-adres in.", "error");
    getKey.disabled = true;
    setStatus("API-sleutel ophalen...");
    try {
      key.value = await requestApiKey(ip.value);
      setStatus("API-sleutel opgehaald. Klik op Verbinden.", "ok");
    } catch (e) {
      setStatus((e as Error).message, "error");
    } finally {
      getKey.disabled = false;
    }
  };
}
