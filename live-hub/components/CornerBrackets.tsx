type Pos = 'tl' | 'tr' | 'bl' | 'br';

const base = { position: 'absolute' as const, width: 14, height: 14, pointerEvents: 'none' as const };
const styleFor = (p: Pos, color: string): React.CSSProperties => {
  switch (p) {
    case 'tl': return { ...base, top: -1, left: -1, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` };
    case 'tr': return { ...base, top: -1, right: -1, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` };
    case 'bl': return { ...base, bottom: -1, left: -1, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` };
    case 'br': return { ...base, bottom: -1, right: -1, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` };
  }
};

export function CornerBrackets({ positions, color = '#E5372C' }: { positions: Pos[]; color?: string }) {
  return (
    <>
      {positions.map((p) => (
        <div key={p} style={styleFor(p, color)} />
      ))}
    </>
  );
}
