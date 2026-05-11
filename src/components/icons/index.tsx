import type { SVGProps } from 'react'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'd'> {
  size?: number
  d?: string | React.ReactNode
}

function Icon({ d, size = 16, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  )
}

type IconComponent = (props: Omit<IconProps, 'd'>) => React.ReactElement

export const I: Record<string, IconComponent> = {
  brand: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M12 3l9 4.5v9L12 21 3 16.5v-9z" />
          <path d="M12 12l9-4.5" />
          <path d="M12 12L3 7.5" />
          <path d="M12 12v9" />
        </>
      }
    />
  ),
  home: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2z" />
        </>
      }
    />
  ),
  users: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M22 19c0-2-1.5-4-4-4" />
        </>
      }
    />
  ),
  partners: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M3 7l9-4 9 4-9 4z" />
          <path d="M3 12l9 4 9-4" />
          <path d="M3 17l9 4 9-4" />
        </>
      }
    />
  ),
  upload: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </>
      }
    />
  ),
  download: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </>
      }
    />
  ),
  map: (p) => (
    <Icon
      {...p}
      d={
        <>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </>
      }
    />
  ),
  globe: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </>
      }
    />
  ),
  code: (p) => (
    <Icon
      {...p}
      d={
        <>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </>
      }
    />
  ),
  settings: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3 1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </>
      }
    />
  ),
  shield: (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  building: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="4" y="2" width="16" height="20" rx="1" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
        </>
      }
    />
  ),
  card: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </>
      }
    />
  ),
  search: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </>
      }
    />
  ),
  bell: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </>
      }
    />
  ),
  menu: (p) => (
    <Icon
      {...p}
      d={
        <>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      }
    />
  ),
  panelLeft: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </>
      }
    />
  ),
  chevDown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  chevUp: (p) => <Icon {...p} d="M18 15l-6-6-6 6" />,
  chevRight: (p) => <Icon {...p} d="M9 18l6-6-6-6" />,
  chevLeft: (p) => <Icon {...p} d="M15 18l-6-6 6-6" />,
  plus: (p) => (
    <Icon
      {...p}
      d={
        <>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </>
      }
    />
  ),
  x: (p) => (
    <Icon
      {...p}
      d={
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      }
    />
  ),
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  more: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </>
      }
    />
  ),
  edit: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.1 2.1 0 113 3L12 15l-4 1 1-4z" />
        </>
      }
    />
  ),
  trash: (p) => (
    <Icon
      {...p}
      d={
        <>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M10 6V4a1 1 0 011-1h2a1 1 0 011 1v2" />
        </>
      }
    />
  ),
  copy: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </>
      }
    />
  ),
  filter: (p) => <Icon {...p} d="M22 3H2l8 9.5V19l4 2v-8.5z" />,
  arrowRight: (p) => (
    <Icon
      {...p}
      d={
        <>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </>
      }
    />
  ),
  arrowUp: (p) => <Icon {...p} d="M5 12l7-7 7 7M12 5v14" />,
  arrowDown: (p) => <Icon {...p} d="M19 12l-7 7-7-7M12 19V5" />,
  externalLink: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </>
      }
    />
  ),
  refresh: (p) => (
    <Icon
      {...p}
      d={
        <>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.5 9a9 9 0 0114.85-3.36L23 10M1 14l4.65 4.36A9 9 0 0020.5 15" />
        </>
      }
    />
  ),
  eye: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      }
    />
  ),
  eyeOff: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      }
    />
  ),
  mail: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </>
      }
    />
  ),
  lock: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </>
      }
    />
  ),
  user: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      }
    />
  ),
  alert: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </>
      }
    />
  ),
  info: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </>
      }
    />
  ),
  check2: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 12 15 17 10" />
        </>
      }
    />
  ),
  zap: (p) => <Icon {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  trending: (p) => (
    <Icon
      {...p}
      d={
        <>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </>
      }
    />
  ),
  pin: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M12 22s7-7 7-12a7 7 0 00-14 0c0 5 7 12 7 12z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      }
    />
  ),
  fileSheet: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
        </>
      }
    />
  ),
  zoomIn: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="11" cy="11" r="7" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </>
      }
    />
  ),
  zoomOut: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="11" cy="11" r="7" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </>
      }
    />
  ),
  layers: (p) => (
    <Icon {...p} d="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  ),
  qr: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM20 14v7M14 20h7" />
        </>
      }
    />
  ),
  smartphone: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </>
      }
    />
  ),
  logout: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </>
      }
    />
  ),
  key: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="7" cy="14" r="4" />
          <line x1="9.5" y1="11.5" x2="21" y2="0" />
          <line x1="14" y1="6" x2="18" y2="10" />
          <line x1="17" y1="3" x2="21" y2="7" />
        </>
      }
    />
  ),
  link: (p) => (
    <Icon
      {...p}
      d={
        <>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </>
      }
    />
  ),
  command: (p) => (
    <Icon
      {...p}
      d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"
    />
  ),
  star: (p) => (
    <Icon {...p} d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
  ),
  pause: (p) => (
    <Icon
      {...p}
      d={
        <>
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </>
      }
    />
  ),
  play: (p) => <Icon {...p} d="M5 3l14 9-14 9z" />,
  loader: (p) => (
    <Icon
      {...p}
      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
    />
  ),
  clock: (p) => (
    <Icon
      {...p}
      d={
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      }
    />
  ),
}
