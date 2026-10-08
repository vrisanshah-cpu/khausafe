export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#EA580C" />
      <path d="M20 6.5C13.1 6.5 7.5 12.1 7.5 19c0 8.2 12.5 15.4 12.5 15.4S32.5 27.2 32.5 19C32.5 12.1 26.9 6.5 20 6.5Z" fill="white" />
      <circle cx="20" cy="18.5" r="6.3" fill="#EA580C" />
      <path d="M17.4 15.5v6.2m2.5-6.2v2.7c0 1.5-1.1 2.3-2.5 2.3m5.1-5v6.2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
