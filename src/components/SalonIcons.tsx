export function ServiceIcon({ service }: { service: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      {service === 'Haircut & shaving' && (
        <>
          <path d="M18 55c2-7 1-11-3-16-3-4-4-10-2-17 2-10 10-17 21-17 8 0 14 4 16 11 2 5 0 9-4 12l-1 11-8 2-3 14" />
          <path d="M13 27c1-10 9-18 20-18 7 0 12 3 15 8-6-2-10-1-14 2-4 4-10 5-20 5m21-6c5-2 9-1 12 2l-3 5 5 3-5 3-1 5-7 2m-9-7h.2m-4 4 3 2 3-2m-6 6c3 2 6 2 9 0m-9 5c2 1 4 1 6 0m-8 7 7-2 3 5" />
          <path d="M18 18c3-5 8-8 14-8m-14 13c5 0 9-2 12-5m-4 20c1 3 3 5 6 6m7-2 5-2m-24 9 6-1" />
        </>
      )}
      {service === 'Hair dye / hair color' && (
        <>
          <path d="M15 55c3-7 2-12-2-17-4-6-3-15 1-22C18 8 26 5 34 6c9 1 15 8 15 18 0 5-2 9-5 12l-1 10-8 2-3 7" />
          <path d="M13 29c0-13 8-21 18-22 8-1 14 3 18 9-7-3-12-1-16 3-5 6-11 9-20 10m5-6c4-1 8-5 11-10m-8 17c2-2 4-3 6-3m-2 11h.2m-3 5c2 1 4 1 6 0m-13-20c-1 8 0 14 4 19m25-27c-1 6-4 10-8 13m5 6-2 5m-20 8 6-1" />
          <path d="M43 50c4 0 8 2 11 5l-2 4H39l1-5zm-1 4h12m-8-3 2-4 3 4m-32-38-4-5m7 3-1-6m28 9 5-4" />
        </>
      )}
      {service === 'Shaving' && (
        <>
          <path d="m11 43 30-28c2-2 5-2 7 0l3 3c2 2 2 5 0 7L22 52c-2 2-5 2-7 0l-4-4c-2-2-2-4 0-5Z" />
          <path d="m16 48 32-30m-36 27 7 7m27-36 6 6m-9-4 8 8" />
          <path d="m19 48 31 6c3 1 5 3 4 5l-1 2c-1 2-3 2-6 1l-30-10m4-1 30 7m-28-6 5-4m3 5 4-4m3 5 4-4m3 5 4-4" />
          <circle cx="17" cy="47" r="2" />
        </>
      )}
      {service === 'Baby haircut' && (
        <>
          <path d="M14 35c0-12 7-20 18-20s18 8 18 20-7 18-18 18-18-6-18-18Zm0 0c-5-1-7 2-6 6s4 6 8 4m34-10c5-1 7 2 6 6s-4 6-8 4" />
          <path d="M21 30c-2-5-1-10 2-13 1-5 5-7 9-5 4-3 9-1 10 4 4 2 4 8 1 13-3-5-7-7-12-7-4 0-7 3-10 8Zm3-11c3-3 8-4 13-2m-11 18h.2m12 0h.2m-9 7c2 2 5 2 7 0m-18-9-5-3m32 3 5-3m-26 18c1 2 3 3 5 4m14-4c-1 2-3 3-5 4" />
          <path d="M31 12c-1-4 1-7 4-8 2 0 3 2 2 4m-3-1 6-1m-29 32-3 4m47-4 3 4" />
        </>
      )}
    </svg>
  )
}

export function ScissorsIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="8" cy="8" r="4" />
      <circle cx="8" cy="24" r="4" />
      <path d="m11 11 17 17M11 21 28 4M14 16l8 0" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12M10 4l6 6-6 6" />
    </svg>
  )
}

export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
