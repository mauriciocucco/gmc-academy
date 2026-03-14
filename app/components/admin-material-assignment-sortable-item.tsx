import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type AssignmentCardItem = {
  id: string;
  title: string;
  description: string;
  hasAccess: boolean;
  position: number | null;
  published: boolean;
  linksCount: number;
  categoryName: string;
};

type AdminMaterialAssignmentSortableItemProps = {
  item: AssignmentCardItem;
  unlockedCount: number;
  onToggleAssignment: (materialId: string) => void;
  onMoveAssignment: (materialId: string, direction: "up" | "down") => void;
};

export function AdminMaterialAssignmentSortableItem({
  item,
  unlockedCount,
  onToggleAssignment,
  onMoveAssignment,
}: AdminMaterialAssignmentSortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.id,
    });
  const isFirst = item.position === 1;
  const isLast = item.position === unlockedCount;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-2xl border p-4 text-sm transition ${
        isDragging
          ? "border-[#0066cc]/40 bg-white shadow-[0_16px_32px_-18px_rgba(2,32,72,0.45)]"
          : "border-[#0066cc]/25 bg-[#0066cc]/5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label={`Arrastrar ${item.title}`}
              className="cursor-grab rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 shadow-sm active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              ≡
            </button>
            <p className="font-semibold text-slate-900">{item.title}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {item.categoryName}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Orden {item.position}
            </span>
          </div>
          <p className="mt-2 text-slate-600">{item.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            {item.linksCount} enlace
            {item.linksCount === 1 ? "" : "s"} disponibles para este alumno.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleAssignment(item.id)}
            className="cursor-pointer rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-300"
          >
            Bloquear
          </button>
          <button
            type="button"
            onClick={() => onMoveAssignment(item.id, "up")}
            disabled={isFirst}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Subir
          </button>
          <button
            type="button"
            onClick={() => onMoveAssignment(item.id, "down")}
            disabled={isLast}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bajar
          </button>
        </div>
      </div>
    </li>
  );
}
