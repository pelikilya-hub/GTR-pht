'use client';
import type { CSSProperties } from 'react';

export function GtrDeity({ variant, style }: { variant: string; style?: CSSProperties }) {
  return <gtr-deity variant={variant} style={{ position: 'absolute', inset: 0, ...style }} />;
}
