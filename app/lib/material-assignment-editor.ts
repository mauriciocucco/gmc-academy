import type { AdminStudentMaterialAssignment, MaterialResponse } from "./api/types";

export type AssignmentEditorItem = MaterialResponse & {
  hasAccess: boolean;
  position: number | null;
};

function sortByTitle(items: MaterialResponse[]): MaterialResponse[] {
  return [...items].sort((left, right) =>
    left.title.localeCompare(right.title, "es"),
  );
}

export function syncAssignmentOrder(
  items: AssignmentEditorItem[],
): AssignmentEditorItem[] {
  const unlocked = items
    .filter((item) => item.hasAccess)
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  const locked = items
    .filter((item) => !item.hasAccess)
    .map((item) => ({
      ...item,
      position: null,
    }));

  return [...unlocked, ...locked];
}

export function buildAssignmentEditorItems(
  materials: MaterialResponse[],
  assignments: AdminStudentMaterialAssignment[],
): AssignmentEditorItem[] {
  const assignmentsByMaterialId = new Map(
    assignments.map((assignment) => [assignment.materialId, assignment.position]),
  );
  const unlocked: AssignmentEditorItem[] = [];
  const locked: AssignmentEditorItem[] = [];

  for (const material of sortByTitle(materials)) {
    const position = assignmentsByMaterialId.get(material.id) ?? null;
    const item: AssignmentEditorItem = {
      ...material,
      hasAccess: position !== null,
      position,
    };

    if (item.hasAccess) {
      unlocked.push(item);
      continue;
    }

    locked.push(item);
  }

  unlocked.sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
  locked.sort((left, right) => {
    if (left.published !== right.published) {
      return left.published ? -1 : 1;
    }

    return left.title.localeCompare(right.title, "es");
  });

  return syncAssignmentOrder([...unlocked, ...locked]);
}

export function toAssignmentPayload(items: AssignmentEditorItem[]) {
  return items
    .filter((item) => item.hasAccess)
    .map((item) => ({
      materialId: item.id,
      position: item.position ?? 0,
    }));
}
