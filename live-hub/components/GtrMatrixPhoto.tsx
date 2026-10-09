'use client';
import type { CSSProperties } from 'react';

export function GtrMatrixPhoto({ id, srcs, interval = 7000, style }: { id: string; srcs: string; interval?: number; style?: CSSProperties }) {
  return <gtr-matrix-photo id={id} srcs={srcs} interval={interval} style={{ position: 'absolute', inset: 0, ...style }} />;
}
