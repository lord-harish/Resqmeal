import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
      {icon ? <div className="text-[#16A34A]">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-[#12372A]">{title}</h3>
      {description ? <p className="max-w-md text-sm text-[#64748B]">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
