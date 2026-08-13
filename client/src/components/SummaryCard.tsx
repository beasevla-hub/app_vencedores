import { LucideIcon } from "lucide-react";

export function SummaryCard({
  label,
  value,
  supporting,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  supporting?: string;
  emphasized?: boolean;
}) {
  return (
    <div className="min-h-31 border border-[#D6E8D8] bg-[#F2F8F3] px-3 py-3 text-[#173C25] shadow-none">
      <span className="text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-[#5E7964]">{label}</span>
      <p className="mt-4 line-clamp-3 text-sm font-bold leading-[1.1] tracking-tight text-[#173C25]">{value}</p>
      {supporting ? <p className="mt-1 text-[11px] font-medium text-[#65816B]">{supporting}</p> : null}
    </div>
  );
}
