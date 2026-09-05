import { Info } from "lucide-react";

export default function DisclosureBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-brand-900/60 border border-brand-500/40 px-4 py-2 text-sm text-brand-100">
      <Info size={16} className="shrink-0" />
      <span>You are speaking with an AI interviewer panel. This session is for practice purposes.</span>
    </div>
  );
}
