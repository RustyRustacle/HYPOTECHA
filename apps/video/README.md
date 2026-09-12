# HYPOTECHA — programmatic demo video (Remotion)

Remotion workspace that renders the HYPOTECHA pitch/demo video entirely from code (React components, 30 fps). Part of the HYPOTECHA monorepo (`apps/video`).

- Composition: `HYPOTECHA` — 1920x1080, 30 fps, 900 frames (30 s)
- Stack: Remotion 4.0.524, React 19, TypeScript, Tailwind CSS v4 (via `@remotion/tailwind-v4`, enabled in `remotion.config.ts`)

## Commands

From this folder (`apps/video`):

**Install dependencies**

```console
npm install
```

**Preview in Remotion Studio**

```console
npm run dev
```

Studio opens at `http://localhost:3000` (use `npm run dev -- --port 3500` to pick another port). Timeline scrubbing, per-frame preview, and rendering from the side panel.

**Render the final MP4**

```console
npm run render
```

Writes `out/HYPOTECHA.mp4` (JPEG-encoded frames, overwrite enabled). Equivalent: `npx remotion render HYPOTECHA out/HYPOTECHA.mp4`.

**Bundle**

```console
npm run build
```

Builds the composition bundle (no render). Output in `build/`.

**Lint + typecheck**

```console
npm run lint
```

Runs ESLint on `src/` and `tsc`.

> All of the above were verified on this machine (Windows, Node 25). The MP4 renders and Studio serves HTTP 200.

## Where to put your assets

- **Voice-over:** `public/audio/voiceover.mp3` — referenced as `audio/voiceover.mp3` by `src/audio/Voiceover.tsx` (`VOICEOVER_FILE`, `VOICEOVER_START_IN_FRAME`, `VOICEOVER_DURATION_IN_FRAMES`).
- **Background music:** `public/music/bgmusic.mp3` — referenced as `music/bgmusic.mp3` by `src/audio/Music.tsx` (`MUSIC_FILE`, `MUSIC_VOLUME = 0.18`).
- **Images / screenshots / stock footage:** `public/images/`, `public/videos/`, `public/screenshots/` (keep `.gitkeep` in mind — untracked files are fine to add).

Both audio components exist but are **not mounted** in `src/Composition.tsx` yet, so a render works even before the files exist. Mount them once the files are dropped in:

```tsx
import { Sequence } from "remotion";
import { Voiceover } from "./audio/Voiceover";
import { Music } from "./audio/Music";

<Sequence name="Voiceover">
  <Voiceover />
</Sequence>
<Music />
```

## Editing the composition

- `src/Composition.tsx` — composition metadata (id `HYPOTECHA`, size, fps, duration) and the scene tree.
- `src/video/HypothecaTitle.tsx` — initial dark "technical" title placeholder (grid, orbs, market chips, segment bar, timecode). Replace with the real directed scenes and whatever on-chain footage/figures you want to show from the live app.
- `src/Root.tsx` — registers compositions for Studio.
- `remotion.config.ts` — Rspack bundler, JPEG video codec, Tailwind enabled.

## Notes

- `out/` and `build/` are gitignored — only source + assets are tracked.
- The scaffold's demo composition was removed; `HYPOTECHA` is the only registered composition.