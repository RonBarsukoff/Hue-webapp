import "./styles/main.css";
import { Group, HueClient, loadSettings } from "./hue";
import { showSettingsView } from "./views/settingsView";
import { showGroupsView } from "./views/groupsView";
import { showGroupEditView } from "./views/groupEditView";
import { showGroupView } from "./views/groupView";

const root = document.getElementById("app")!;

function showGroups(): void {
  const client = new HueClient(loadSettings());
  const open = (group: Group): void => {
    showGroupView(root, client, group, showGroups, () => edit(group));
  };
  const edit = (group?: Group): void => {
    showGroupEditView(root, client, group, () => (group ? open(group) : showGroups()), showGroups);
  };
  showGroupsView(root, client, open, showSettings, () => edit());
}

function showSettings(): void {
  showSettingsView(root, showGroups);
}

const s = loadSettings();
if (s.ip && s.apiKey) showGroups(); else showSettings();
