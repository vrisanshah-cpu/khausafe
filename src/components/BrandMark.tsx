export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="42" height="42" rx="14" fill="#E23744" />
      <path
        d="M22 7.5c-7.1 0-12.8 5.4-12.8 12.2 0 8.9 12.8 17.1 12.8 17.1s12.8-8.2 12.8-17.1C34.8 12.9 29.1 7.5 22 7.5Z"
        fill="white"
      />
      <path d="M15.2 23.6h13.6c-.7 3.2-3.4 5.4-6.8 5.4s-6.1-2.2-6.8-5.4Z" fill="#E23744" />
      <path d="M17.4 21.2h9.2" stroke="#E23744" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.8 18.8c-1.5-1.5.9-2.1-.2-3.5M22 18.8c-1.5-1.5.9-2.1-.2-3.5M25.2 18.8c-1.5-1.5.9-2.1-.2-3.5" stroke="#E23744" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
