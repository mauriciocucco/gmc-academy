import type { StudentProgress } from "./api/types";

export type StudentProgressStats = {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
};

export function getStudentProgressStats(
  progress: StudentProgress,
): StudentProgressStats {
  const materialsTotal = Math.max(progress.materialsTotal, 0);
  const materialsViewed = Math.min(
    Math.max(progress.materialsViewed, 0),
    materialsTotal,
  );

  const totalTasks = materialsTotal + 2;
  const completedTasks =
    materialsViewed +
    (progress.examPassed ? 1 : 0) +
    (progress.certificateIssued ? 1 : 0);

  const percentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    completedTasks,
    totalTasks,
    percentage,
  };
}
