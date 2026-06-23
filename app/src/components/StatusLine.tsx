import type { Status } from "../types.ts";

export function StatusLine({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  return <p className={`status ${status.kind}`}>{status.msg}</p>;
}
