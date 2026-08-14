import { define } from "nanotags";
import { $manifest, shortSha, type Manifest } from "../services/manifest";

function titleFor(manifest: Manifest): string {
  const side =
    manifest.prNumber === null
      ? manifest.current.ref
      : `PR #${manifest.prNumber}`;
  return `Martian Grotesk: main vs ${side}`;
}

function detailsFor(manifest: Manifest): string {
  const parts = [
    `main ${shortSha(manifest.baseline.sha)} ${manifest.baseline.subject}`,
    `${manifest.current.ref} ${shortSha(manifest.current.sha)} ${manifest.current.subject}`,
    manifest.hasStatics ? "all styles" : "variable font only",
  ];

  if (!manifest.current.builtFromSources) {
    parts.push("fonts taken from the working tree, not rebuilt");
  }
  if (manifest.current.sourcesDirty) {
    parts.push("sources have uncommitted changes");
  }

  return parts.join(" · ");
}

define("stand-header")
  .withRefs((r) => ({
    title: r.one("h1"),
    details: r.one("p"),
  }))
  .setup((ctx) => {
    ctx.effect($manifest, (manifest) => {
      if (!manifest) return;
      ctx.refs.title.textContent = titleFor(manifest);
      ctx.refs.details.textContent = detailsFor(manifest);
    });
  });
