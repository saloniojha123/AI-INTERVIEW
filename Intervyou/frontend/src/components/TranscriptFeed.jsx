export default function TranscriptFeed({ turns = [] }) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-80 pr-2">
      {turns.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">
          The transcript will appear here as the interview progresses.
        </p>
      )}
      {turns.map((t, i) => {
        const isCandidate = t.speaker === "candidate";
        return (
          <div key={i} className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                isCandidate
                  ? "bg-brand-500 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-100 rounded-bl-sm"
              }`}
            >
              {!isCandidate && <p className="mb-0.5 text-xs font-semibold text-brand-300">{t.speaker}</p>}
              <p>{t.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
