import { useState } from "react";
import { getSettings, saveSettings, resetSettings, defaultSettings, type AppSettings } from "../lib/settings.ts";

export function SettingsPage() {
  const [form, setForm] = useState<AppSettings>(() => ({ ...getSettings() }));
  const [saved, setSaved] = useState(false);

  function update(key: keyof AppSettings, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function onSave() {
    saveSettings(form);
    setSaved(true);
  }

  function onReset() {
    const d = resetSettings();
    setForm({ ...d });
    setSaved(true);
  }

  const fields: { key: keyof AppSettings; label: string; placeholder: string }[] = [
    { key: "network", label: "Network", placeholder: "testnet" },
    { key: "rpcUrl", label: "Soroban RPC URL", placeholder: defaultSettings().rpcUrl },
    { key: "relayerUrl", label: "Relayer URL", placeholder: defaultSettings().relayerUrl },
    { key: "indexerUrl", label: "Indexer URL", placeholder: defaultSettings().indexerUrl },
  ];

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="muted">Point the dapp at your relayer, indexer, and RPC endpoint. Stored in this browser.</p>

      <div className="card">
        {fields.map((f) => (
          <div key={f.key} className="field">
            <label>{f.label}</label>
            <input value={form[f.key]} placeholder={f.placeholder} onChange={(e) => update(f.key, e.target.value)} />
          </div>
        ))}
        <div className="row-actions">
          <button className="primary" onClick={onSave}>Save</button>
          <button onClick={onReset}>Reset to defaults</button>
        </div>
        {saved && <p className="status ok">Saved. Reload the page to re-fetch pools with the new endpoints.</p>}
      </div>
    </div>
  );
}
