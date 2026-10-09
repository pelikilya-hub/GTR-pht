'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ls, setLs } from '@/lib/storage';

// Lightweight reimplementation of the prototype's <image-slot> (drag-drop /
// click-to-upload placeholder) with plain localStorage persistence.
export function ImageSlot({
  id, shape = 'rect', fit = 'cover', placeholder = 'Drop an image',
}: { id: string; shape?: 'rect' | 'circle'; fit?: 'cover' | 'contain'; placeholder?: string }) {
  const key = 'gtrpht_imgslot_' + id;
  const [src, setSrc] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Hydration-safe: persisted upload lives in localStorage, unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(ls<string | null>(key, null));
  }, [key]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 900 / img.width);
        const c = document.createElement('canvas');
        c.width = img.width * scale;
        c.height = img.height * scale;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL('image/jpeg', 0.82);
          setLs(key, dataUrl);
          setSrc(dataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [key]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
      style={{ position: 'absolute', inset: 0, cursor: 'pointer', overflow: 'hidden', borderRadius: shape === 'circle' ? '50%' : 0, outline: over ? '1px solid #E5372C' : 'none', outlineOffset: -1 }}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }} />
      {src ? (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${src}')`, backgroundSize: fit === 'contain' ? 'contain' : 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: fit === 'contain' ? '#0D0D0F' : undefined }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12, border: '1px dashed #2E2E34', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.12em', color: '#4A4950', background: '#0D0D0F' }}>
          {placeholder}
        </div>
      )}
    </div>
  );
}
