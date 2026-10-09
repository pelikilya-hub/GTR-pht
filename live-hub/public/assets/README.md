# Binary assets (not committed)

Drop the design bundle's `project/assets/*` here before building:

```
public/assets/
  audio/midnight-circuit.mp3
  scales/themis.png
  ilia/night-lounge-graded.png
  places/phuket/01-big-buddha.png … 05-neon-night.png
  places/{samui,phangan,chiangmai,ayutthaya,bangkok}/01-scene.png … 03-scene.png
```

Paths are referenced from `lib/i18n.ts` (`PLACE_SRCS`), `components/Crew.tsx`,
`components/Scales.tsx` and `lib/useAudioPlayer.ts`. Missing files degrade gracefully
(empty matrix-photo frames, silent player) — the site still builds and runs.
