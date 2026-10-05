import "./styles/main.css";
import { HueClient, loadSettings } from "./hue";
import { showSettingsView } from "./views/settingsView";
import { showGroupsView } from "./views/groupsView";
import { showGroupView } from "./views/groupView";

const root = document.getElementById("app")!;

function showGroups(): void {
  const client = new HueClient(loadSettings());
  showGroupsView(root, client, group => showGroupView(root, client, group, showGroups), showSettings);
}

function showSettings(): void {
  showSettingsView(root, showGroups);
}

const s = loadSettings();
if (s.ip && s.apiKey) showGroups(); else showSettings();
