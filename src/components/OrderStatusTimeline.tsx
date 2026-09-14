import { ORDER_STATUS_FLOW, type OrderStatus } from "@/lib/orders";
import { statusLabel } from "@/lib/format";

export default function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--danger)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]" />
        Order {statusLabel(status)}
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);

  return (
    <div className="flex items-start overflow-x-auto py-2">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = i <= currentIdx;
        return (
          <div key={s} className="flex items-center flex-1 min-w-[90px] last:flex-none last:min-w-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  done ? "bg-[var(--success)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-faint)] border border-[var(--border-subtle)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-[11px] text-center whitespace-nowrap ${done ? "font-medium" : "text-[var(--text-faint)]"}`}>
                {statusLabel(s)}
              </span>
            </div>
            {i < ORDER_STATUS_FLOW.length - 1 && (
              <span className={`h-0.5 flex-1 mx-1 mb-4 ${i < currentIdx ? "bg-[var(--success)]" : "bg-[var(--border-subtle)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
