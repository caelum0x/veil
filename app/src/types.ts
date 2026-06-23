export type Tab = "deposit" | "withdraw" | "pools";

export type Status = { kind: "idle" | "busy" | "ok" | "err"; msg?: string };
