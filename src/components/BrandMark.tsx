export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="13" fill="#171714" />
      <path d="M12 10.5v19M12.2 22.4l8.1-7.5M12.3 21.4l8.5 8.1" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="11.5" r="4.5" fill="#DFFF55" />
    </svg>
  );
}
