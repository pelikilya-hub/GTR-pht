import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type CustomEl<T = HTMLElement> = DetailedHTMLProps<HTMLAttributes<T>, T>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'gtr-deity': CustomEl & { variant?: string };
      'gtr-matrix-photo': CustomEl & { id?: string; srcs?: string; interval?: string | number };
      'gtr-multiview': CustomEl & { room?: string; fill?: string; mode?: string };
      'gtr-director': CustomEl & { room?: string };
      'gtr-camera': CustomEl & { room?: string };
    }
  }
}

export {};
