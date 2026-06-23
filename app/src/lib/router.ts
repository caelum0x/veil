import { useEffect, useState } from "react";

/** Hash-based route, e.g. "#/pools/1000000000" -> "/pools/1000000000". */
export function useRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export interface ParsedRoute {
  page: string;
  params: string[];
}

export function parseRoute(route: string): ParsedRoute {
  const parts = route.replace(/^\//, "").split("/").filter(Boolean);
  return { page: parts[0] ?? "dashboard", params: parts.slice(1) };
}

export function isActive(route: string, page: string): boolean {
  return parseRoute(route).page === page;
}
