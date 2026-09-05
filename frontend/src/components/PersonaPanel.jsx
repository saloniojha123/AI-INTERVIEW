const PERSONAS = [
  { id: "technical", name: "Alex Chen", role: "Technical" },
  { id: "hiring_manager", name: "Priya Nair", role: "Hiring Manager" },
  { id: "product_manager", name: "Jordan Lee", role: "Product" },
  { id: "behavioural", name: "Maria Santos", role: "Behavioural" },
  { id: "customer", name: "Sam", role: "Customer" },
];

export default function PersonaPanel({ activePersonaId }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {PERSONAS.map((p) => {
        const active = p.id === activePersonaId;
        return (
          <div
            key={p.id}
            className={`rounded-xl border p-3 text-center transition-all ${
              active
                ? "border-brand-400 bg-brand-500/20 scale-105 shadow-lg shadow-brand-500/20"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            <div
              className={`mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                active ? "bg-brand-400 text-brand-900" : "bg-slate-800 text-slate-400"
              }`}
            >
              {p.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <p className="text-xs font-medium text-slate-100">{p.name}</p>
            <p className="text-[11px] text-slate-400">{p.role}</p>
            {active && <p className="mt-1 text-[10px] text-brand-300">speaking…</p>}
          </div>
        );
      })}
    </div>
  );
}
