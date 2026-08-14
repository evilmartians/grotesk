# Comparison stand

A small web page that shows two builds of Martian Grotesk side by side:

- **main** — the fonts committed on the `main` branch, taken straight from git
- **this branch** — fonts built from the sources in your working tree

Use it to see what a source change does to the glyphs before the change is merged.

## Run it locally

```bash
cd comparison-stand
pnpm install
pnpm fonts     # builds the variable font from sources
pnpm dev
```

`pnpm fonts` fills `public/fonts/` with both sides and writes `manifest.json`,
which tells the page what it is showing. The folder is not in git.

Other ways to fill it:

| Command | What you get | Speed |
|---|---|---|
| `pnpm fonts` | variable font only, built from your sources | about 15 seconds |
| `pnpm fonts:full` | whole family, statics included | many minutes |
| `pnpm fonts:tree` | whatever is already in `fonts/`, nothing is built | instant |

The **Static** tab only appears when static styles are present, so it is hidden
after `pnpm fonts` and shown after `pnpm fonts:full`.

Use `pnpm fonts:tree` when you already ran `sources/build.sh` yourself and only
want to look at the result.

## Previews in pull requests

Every pull request that touches `sources/` or `comparison-stand/` gets its own
preview page on Firebase Hosting. The link is posted as a comment on the pull
request and stays alive for 30 days after the last push.

The preview builds **only the variable font**, because a full family build is
slow and expensive. For a static-by-static comparison, run `pnpm fonts:full`
locally. The built font is cached by the hash of the sources, so a push that
only changes the stand skips the font build.

Nothing is deployed from `main`.

## What the page shows

- **Grid** — every glyph in both fonts, main on the left, this branch on the right
- **Added** — glyphs that exist in this branch but not on main
- **Highlight diffs** — marks glyphs whose metrics or outlines changed; the
  number next to it is the threshold in percent
- Click any glyph for a large view with an overlay mode and bounding boxes
- **Text Preview** — paste your own text and read it in both fonts

## Reading the diff

A fresh build of unchanged sources gives glyph outlines that are byte for byte
the same as the committed fonts on `main`. So any highlighted glyph comes from
your source change, not from the build tools. Tool versions are pinned in
`sources/requirements.txt` to keep it that way.
