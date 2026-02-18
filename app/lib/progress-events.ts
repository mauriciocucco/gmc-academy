const STUDENT_PROGRESS_UPDATED_EVENT = "gmc:student-progress-updated";

export function notifyStudentProgressUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STUDENT_PROGRESS_UPDATED_EVENT));
}

export function onStudentProgressUpdated(
  callback: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(STUDENT_PROGRESS_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener(STUDENT_PROGRESS_UPDATED_EVENT, callback);
  };
}
