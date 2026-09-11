type LoadingStateProps = {
  message?: string;
};

const DOT_DELAYS_MS = [0, 150, 300];

export function LoadingState({ message = "레시피를 확인하는 중이에요" }: LoadingStateProps) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-[var(--bg-cream)] px-4 py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/loading/mom-reading-final.png"
        alt=""
        width={220}
        height={220}
        className="h-[220px] w-[220px] object-contain"
      />
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {DOT_DELAYS_MS.map((delay) => (
          <span
            key={delay}
            className="loading-dot h-2 w-2 rounded-full bg-[var(--olive-600)]"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="text-sm text-[var(--ink-600)]">{message}</p>
    </div>
  );
}
