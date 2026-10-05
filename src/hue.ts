export interface Settings { ip: string; apiKey: string; }

export interface LightState { on: boolean; bri?: number; reachable: boolean; }
export interface Light { id: string; name: string; state: LightState; }
export interface Group {
  id: string; name: string; type: string; lights: string[];
  state: { all_on: boolean; any_on: boolean };
  action: { on: boolean; bri?: number };
}

const STORAGE_KEY = "hue-settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Settings;
  } catch { /* negeer */ }
  return { ip: "", apiKey: "" };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function cleanIp(ip: string): string {
  return ip.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

interface HueError { error: { type: number; description: string } }

function throwOnError(data: unknown): void {
  const items = Array.isArray(data) ? data : [];
  for (const item of items as Partial<HueError>[]) {
    if (item.error) throw new Error(item.error.description);
  }
}

async function request<T>(ip: string, path: string, method = "GET", body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`http://${cleanIp(ip)}${path}`, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Bridge niet bereikbaar. Controleer het IP-adres en of de pagina via http wordt geopend.");
  }
  if (!res.ok) throw new Error(`Bridge gaf fout ${res.status}`);
  const data = await res.json();
  throwOnError(data);
  return data as T;
}

/** Vraagt een nieuwe API-sleutel aan; de knop op de bridge moet eerst zijn ingedrukt. */
export async function requestApiKey(ip: string): Promise<string> {
  const data = await request<{ success?: { username: string } }[]>(
    ip, "/api", "POST", { devicetype: "hue-web-app#browser" });
  const key = data[0]?.success?.username;
  if (!key) throw new Error("Geen API-sleutel ontvangen.");
  return key;
}

export class HueClient {
  constructor(private s: Settings) {}

  private path(p: string): string { return `/api/${this.s.apiKey}${p}`; }

  async getGroups(): Promise<Group[]> {
    const data = await request<Record<string, Omit<Group, "id">>>(this.s.ip, this.path("/groups"));
    return Object.entries(data)
      .map(([id, g]) => ({ id, ...g }))
      .filter(g => g.type === "Room" || g.type === "Zone" || g.type === "LightGroup");
  }

  async getGroup(id: string): Promise<Group> {
    const g = await request<Omit<Group, "id">>(this.s.ip, this.path(`/groups/${id}`));
    return { id, ...g };
  }

  async getLights(ids: string[]): Promise<Light[]> {
    const data = await request<Record<string, { name: string; state: LightState }>>(this.s.ip, this.path("/lights"));
    return ids.filter(id => data[id]).map(id => ({ id, name: data[id].name, state: data[id].state }));
  }

  setGroup(id: string, action: { on?: boolean; bri?: number }): Promise<unknown> {
    return request(this.s.ip, this.path(`/groups/${id}/action`), "PUT", action);
  }

  setLight(id: string, state: { on?: boolean; bri?: number }): Promise<unknown> {
    return request(this.s.ip, this.path(`/lights/${id}/state`), "PUT", state);
  }
}
