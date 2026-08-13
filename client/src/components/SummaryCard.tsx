import { LucideIcon } from "lucide-react";

export function SummaryCard({
  icon: Icon,
  label,
  value,
  supporting,
  emphasized = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  supporting?: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`min-h-35 rounded-sm border p-4 shadow-[0_12px_28px_rgba(30,68,41,0.05)] ${emphasized ? "border-[#52A660] bg-[#174C2B] text-white" : "border-[#D5E6D8] bg-[#F2F8F3] text-[#173C25]"}`}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${emphasized ? "text-white/70" : "text-[#5E7964]"}`}>{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${emphasized ? "text-[#9EDAA8]" : "text-[#52A660]"}`} strokeWidth={1.7} />
      </div>
      <p className={`line-clamp-3 text-lg font-bold leading-[1.15] tracking-tight ${emphasized ? "text-white" : "text-[#174C2B]"}`}>{value}</p>
      {supporting ? <p className={`mt-2 text-xs font-medium ${emphasized ? "text-white/70" : "text-[#65816B]"}`}>{supporting}</p> : null}
    </div>
  );
}
