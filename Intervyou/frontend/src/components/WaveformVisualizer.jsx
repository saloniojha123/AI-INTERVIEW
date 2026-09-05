/**
 * Simple animated bar visualizer. Swap the random heights for real audio
 * amplitude data from the Agora local/remote audio track once wired up
 * (see hooks/useAgoraClient.js).
 */
export default function WaveformVisualizer({ active = false }) {
  const bars = Array.from({ length: 24 });

  return (
    <div className="flex h-16 items-end justify-center gap-1">
      {bars.map((_, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full bg-brand-400 ${active ? "animate-pulse" : "opacity-30"}`}
          style={{
            height: active ? `${20 + Math.round(Math.random() * 44)}px` : "6px",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}
