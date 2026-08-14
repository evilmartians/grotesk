import { atom } from "nanostores";

export type ManifestSide = {
  ref: string;
  sha: string;
  subject: string;
};

export type Manifest = {
  generatedAt: string;
  hasStatics: boolean;
  prNumber: number | null;
  baseline: ManifestSide;
  current: ManifestSide & {
    builtFromSources: boolean;
    sourcesDirty: boolean;
  };
};

export const $manifest = atom<Manifest | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSide(value: unknown): value is ManifestSide {
  return (
    isRecord(value) &&
    typeof value.ref === "string" &&
    typeof value.sha === "string" &&
    typeof value.subject === "string"
  );
}

function isCurrentSide(value: unknown): value is Manifest["current"] {
  return (
    isRecord(value) &&
    typeof value.builtFromSources === "boolean" &&
    typeof value.sourcesDirty === "boolean" &&
    isSide(value)
  );
}

function isManifest(value: unknown): value is Manifest {
  return (
    isRecord(value) &&
    typeof value.generatedAt === "string" &&
    typeof value.hasStatics === "boolean" &&
    (value.prNumber === null || typeof value.prNumber === "number") &&
    isSide(value.baseline) &&
    isCurrentSide(value.current)
  );
}

export async function loadManifest(): Promise<Manifest> {
  const response = await fetch("/fonts/manifest.json");
  if (!response.ok) {
    throw new Error(`manifest.json: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  if (!isManifest(data)) {
    throw new Error("manifest.json has an unexpected shape");
  }
  return data;
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}
