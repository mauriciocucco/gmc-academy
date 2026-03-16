import { apiGet, apiPatch, apiPost } from "./client";
import { extractArrayResponse } from "./utils/extract-array-response";
import type {
  AdminExamConfig,
  AdminExamQuestionsPage,
  AdminExamQuestion,
  AdminMaterialsPage,
  PaginationMeta,
  AdminStudentMaterialAssignment,
  AdminStudentMaterialProgressItem,
  AdminStudentNote,
  AdminPerformanceItem,
  AdminStats,
  AdminStudentAttemptItem,
  AdminStudentDetail,
  AdminStudentItem,
  AdminStudentsPage,
  CreateAdminStudentDto,
  CreatedAdminStudent,
  GetAdminExamQuestionsParams,
  GetAdminMaterialsParams,
  GetAdminStudentsParams,
  UpdateAdminStudentNoteDto,
  UpdateAdminStudentMaterialAssignmentsDto,
  UpdateAdminStudentsAccessDto,
  UpdateAdminStudentsAccessResponse,
  UpdateAdminExamDto,
  AttemptDetail,
} from "./types";

export function getAdminStats(): Promise<AdminStats> {
  return apiGet<AdminStats>("/admin/stats");
}

const DEFAULT_ADMIN_STUDENTS_PAGE_SIZE = 100;
const DEFAULT_ADMIN_MATERIALS_PAGE_SIZE = 100;
const DEFAULT_ADMIN_EXAM_QUESTIONS_PAGE_SIZE = 10;

function parsePositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function extractPaginationMeta(
  value: unknown,
  fallbackItemsLength: number,
  fallbackPageSize: number,
): PaginationMeta {
  if (value && typeof value === "object") {
    const maybeWrappedPage = value as {
      page?: unknown;
      pageSize?: unknown;
      total?: unknown;
      totalItems?: unknown;
      totalPages?: unknown;
      meta?: {
        page?: unknown;
        pageSize?: unknown;
        total?: unknown;
        totalItems?: unknown;
        totalPages?: unknown;
      };
    };

    const page =
      parsePositiveNumber(maybeWrappedPage.page) ??
      parsePositiveNumber(maybeWrappedPage.meta?.page) ??
      1;
    const pageSize =
      (parsePositiveNumber(maybeWrappedPage.pageSize) ??
        parsePositiveNumber(maybeWrappedPage.meta?.pageSize) ??
        fallbackItemsLength) ||
      fallbackPageSize;
    const totalItems =
      parsePositiveNumber(maybeWrappedPage.totalItems) ??
      parsePositiveNumber(maybeWrappedPage.total) ??
      parsePositiveNumber(maybeWrappedPage.meta?.totalItems) ??
      parsePositiveNumber(maybeWrappedPage.meta?.total) ??
      fallbackItemsLength;
    const totalPages =
      parsePositiveNumber(maybeWrappedPage.totalPages) ??
      parsePositiveNumber(maybeWrappedPage.meta?.totalPages) ??
      Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  return {
    page: 1,
    pageSize: fallbackItemsLength || fallbackPageSize,
    totalItems: fallbackItemsLength,
    totalPages: 1,
  };
}

function buildAdminStudentsPath(params: GetAdminStudentsParams = {}): string {
  const searchParams = new URLSearchParams();

  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }

  if (typeof params.pageSize === "number") {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params.attemptState && params.attemptState !== "all") {
    searchParams.set("attemptState", params.attemptState);
  }

  if (params.accessStatus && params.accessStatus !== "all") {
    searchParams.set("accessStatus", params.accessStatus);
  }

  const query = searchParams.toString();
  return query ? `/admin/students?${query}` : "/admin/students";
}

function buildAdminMaterialsPath(params: GetAdminMaterialsParams = {}): string {
  const searchParams = new URLSearchParams();

  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }

  if (typeof params.pageSize === "number") {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.categoryId?.trim()) {
    searchParams.set("categoryId", params.categoryId.trim());
  }

  if (params.publishedStatus && params.publishedStatus !== "all") {
    searchParams.set("publishedStatus", params.publishedStatus);
  }

  const query = searchParams.toString();
  return query ? `/admin/materials?${query}` : "/admin/materials";
}

function buildAdminExamQuestionsPath(
  params: GetAdminExamQuestionsParams = {},
): string {
  const searchParams = new URLSearchParams();

  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }

  if (typeof params.pageSize === "number") {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  const query = searchParams.toString();
  return query
    ? `/admin/exam/questions?${query}`
    : "/admin/exam/questions";
}

function extractAdminStudentsPage(value: unknown): AdminStudentsPage {
  if (Array.isArray(value)) {
    return {
      items: value as AdminStudentItem[],
      page: 1,
      pageSize: value.length || DEFAULT_ADMIN_STUDENTS_PAGE_SIZE,
      total: value.length,
      totalPages: 1,
    };
  }

  if (value && typeof value === "object") {
    const maybeWrappedPage = value as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
      page?: unknown;
      pageSize?: unknown;
      total?: unknown;
      totalPages?: unknown;
      meta?: {
        page?: unknown;
        pageSize?: unknown;
        total?: unknown;
        totalPages?: unknown;
      };
    };

    const items = extractArrayResponse<AdminStudentItem>(
      value,
      "la lista de alumnos",
    );
    const page =
      parsePositiveNumber(maybeWrappedPage.page) ??
      parsePositiveNumber(maybeWrappedPage.meta?.page) ??
      1;
    const pageSize =
      (parsePositiveNumber(maybeWrappedPage.pageSize) ??
        parsePositiveNumber(maybeWrappedPage.meta?.pageSize) ??
        items.length) ||
      DEFAULT_ADMIN_STUDENTS_PAGE_SIZE;
    const total =
      parsePositiveNumber(maybeWrappedPage.total) ??
      parsePositiveNumber(maybeWrappedPage.meta?.total);
    const totalPages =
      parsePositiveNumber(maybeWrappedPage.totalPages) ??
      parsePositiveNumber(maybeWrappedPage.meta?.totalPages) ??
      (total !== null ? Math.max(1, Math.ceil(total / pageSize)) : null);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  return {
    items: extractArrayResponse<AdminStudentItem>(value, "la lista de alumnos"),
    page: 1,
    pageSize: DEFAULT_ADMIN_STUDENTS_PAGE_SIZE,
    total: null,
    totalPages: null,
  };
}

function extractAdminMaterialsPage(value: unknown): AdminMaterialsPage {
  const items = extractArrayResponse<AdminMaterialsPage["items"][number]>(
    value,
    "la lista de materiales",
  );
  return {
    items,
    meta: extractPaginationMeta(
      value,
      items.length,
      DEFAULT_ADMIN_MATERIALS_PAGE_SIZE,
    ),
  };
}

function extractAdminExamQuestionsPage(value: unknown): AdminExamQuestionsPage {
  const items = extractArrayResponse<AdminExamQuestion>(
    value,
    "la lista de preguntas del examen",
  );

  if (!value || typeof value !== "object") {
    return {
      examId: "",
      title: "",
      description: "",
      passScore: 0,
      updatedAt: null,
      updatedByName: null,
      items,
      meta: extractPaginationMeta(
        value,
        items.length,
        DEFAULT_ADMIN_EXAM_QUESTIONS_PAGE_SIZE,
      ),
    };
  }

  const response = value as {
    examId?: unknown;
    title?: unknown;
    description?: unknown;
    passScore?: unknown;
    updatedAt?: unknown;
    updatedByName?: unknown;
  };

  return {
    examId: typeof response.examId === "string" ? response.examId : "",
    title: typeof response.title === "string" ? response.title : "",
    description:
      typeof response.description === "string" ? response.description : "",
    passScore:
      typeof response.passScore === "number" && Number.isFinite(response.passScore)
        ? response.passScore
        : 0,
    updatedAt: typeof response.updatedAt === "string" ? response.updatedAt : null,
    updatedByName:
      typeof response.updatedByName === "string" ? response.updatedByName : null,
    items,
    meta: extractPaginationMeta(
      value,
      items.length,
      DEFAULT_ADMIN_EXAM_QUESTIONS_PAGE_SIZE,
    ),
  };
}

export async function getAdminStudentsPage(
  params: GetAdminStudentsParams = {},
): Promise<AdminStudentsPage> {
  const response = await apiGet<unknown>(buildAdminStudentsPath(params));
  return extractAdminStudentsPage(response);
}

export async function getAdminStudents(
  params: GetAdminStudentsParams = {},
): Promise<AdminStudentItem[]> {
  if (typeof params.page === "number" || typeof params.pageSize === "number") {
    const response = await getAdminStudentsPage({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? DEFAULT_ADMIN_STUDENTS_PAGE_SIZE,
      search: params.search,
      status: params.status,
      attemptState: params.attemptState,
      accessStatus: params.accessStatus,
    });

    return response.items;
  }

  const firstPage = await getAdminStudentsPage({
    page: 1,
    pageSize: DEFAULT_ADMIN_STUDENTS_PAGE_SIZE,
    search: params.search,
    status: params.status,
    attemptState: params.attemptState,
    accessStatus: params.accessStatus,
  });

  if (!firstPage.totalPages || firstPage.totalPages <= 1) {
    return firstPage.items;
  }

  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await getAdminStudentsPage({
      page,
      pageSize: DEFAULT_ADMIN_STUDENTS_PAGE_SIZE,
      search: params.search,
      status: params.status,
      attemptState: params.attemptState,
      accessStatus: params.accessStatus,
    });

    items.push(...nextPage.items);
  }

  return items;
}

export function updateAdminStudentsAccess(
  dto: UpdateAdminStudentsAccessDto,
): Promise<UpdateAdminStudentsAccessResponse> {
  return apiPatch<UpdateAdminStudentsAccessResponse>("/admin/students/access", dto);
}

export function createAdminStudent(
  dto: CreateAdminStudentDto,
): Promise<CreatedAdminStudent> {
  return apiPost<CreatedAdminStudent>("/admin/students", dto);
}

export function getAdminStudentDetail(
  studentId: string,
): Promise<AdminStudentDetail> {
  return apiGet<AdminStudentDetail>(`/admin/students/${studentId}`);
}

export async function getAdminStudentAttempts(
  studentId: string,
): Promise<AdminStudentAttemptItem[]> {
  const response = await apiGet<unknown>(`/admin/students/${studentId}/attempts`);
  return extractArrayResponse<AdminStudentAttemptItem>(
    response,
    "el historial de intentos",
  );
}

export function getAdminStudentAttemptDetail(
  studentId: string,
  attemptId: string,
): Promise<AttemptDetail> {
  return apiGet<AttemptDetail>(`/admin/students/${studentId}/attempts/${attemptId}`);
}

export function updateAdminStudentNote(
  studentId: string,
  dto: UpdateAdminStudentNoteDto,
): Promise<AdminStudentNote> {
  return apiPatch<AdminStudentNote>(`/admin/students/${studentId}/note`, dto);
}

export async function getAdminPerformance(): Promise<AdminPerformanceItem[]> {
  const response = await apiGet<unknown>("/admin/performance");
  return extractArrayResponse<AdminPerformanceItem>(
    response,
    "la serie de performance",
  );
}

export function getAdminExamConfig(): Promise<AdminExamConfig> {
  return apiGet<AdminExamConfig>("/admin/exam");
}

export async function getAdminMaterialsPage(
  params: GetAdminMaterialsParams = {},
): Promise<AdminMaterialsPage> {
  const response = await apiGet<unknown>(buildAdminMaterialsPath(params));
  return extractAdminMaterialsPage(response);
}

export async function getAdminMaterials(
  params: GetAdminMaterialsParams = {},
): Promise<AdminMaterialsPage["items"]> {
  if (typeof params.page === "number" || typeof params.pageSize === "number") {
    const response = await getAdminMaterialsPage({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? DEFAULT_ADMIN_MATERIALS_PAGE_SIZE,
      search: params.search,
      categoryId: params.categoryId,
      publishedStatus: params.publishedStatus,
    });

    return response.items;
  }

  const firstPage = await getAdminMaterialsPage({
    page: 1,
    pageSize: DEFAULT_ADMIN_MATERIALS_PAGE_SIZE,
    search: params.search,
    categoryId: params.categoryId,
    publishedStatus: params.publishedStatus,
  });

  if (firstPage.meta.totalPages <= 1) {
    return firstPage.items;
  }

  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const nextPage = await getAdminMaterialsPage({
      page,
      pageSize: DEFAULT_ADMIN_MATERIALS_PAGE_SIZE,
      search: params.search,
      categoryId: params.categoryId,
      publishedStatus: params.publishedStatus,
    });

    items.push(...nextPage.items);
  }

  return items;
}

export function getAdminExamQuestionsPage(
  params: GetAdminExamQuestionsParams = {},
): Promise<AdminExamQuestionsPage> {
  return apiGet<unknown>(buildAdminExamQuestionsPath(params)).then(
    extractAdminExamQuestionsPage,
  );
}

export function updateAdminExam(
  dto: UpdateAdminExamDto,
): Promise<AdminExamConfig> {
  return apiPatch<AdminExamConfig>("/admin/exam", dto);
}

export async function getAdminStudentMaterialAssignments(
  studentId: string,
): Promise<AdminStudentMaterialAssignment[]> {
  const response = await apiGet<unknown>(
    `/admin/students/${studentId}/material-assignments`,
  );
  return extractArrayResponse<AdminStudentMaterialAssignment>(
    response,
    "las asignaciones de materiales",
  );
}

export async function updateAdminStudentMaterialAssignments(
  studentId: string,
  dto: UpdateAdminStudentMaterialAssignmentsDto,
): Promise<AdminStudentMaterialAssignment[]> {
  const response = await apiPatch<unknown>(
    `/admin/students/${studentId}/material-assignments`,
    dto,
  );
  return extractArrayResponse<AdminStudentMaterialAssignment>(
    response,
    "las asignaciones de materiales",
  );
}

export async function getAdminStudentMaterialsProgress(
  studentId: string,
): Promise<AdminStudentMaterialProgressItem[]> {
  const response = await apiGet<unknown>(
    `/admin/students/${studentId}/materials-progress`,
  );
  return extractArrayResponse<AdminStudentMaterialProgressItem>(
    response,
    "el progreso de materiales",
  );
}
