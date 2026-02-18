import { apiGet, apiPost } from "./client";
import type {
  CertificateResponse,
  GeneratedCertificatePdfResponse,
} from "./types";

export function getLatestCertificate(): Promise<CertificateResponse | null> {
  return apiGet<CertificateResponse | null>("/certificates/me/latest");
}

export function generateCertificatePdf(): Promise<GeneratedCertificatePdfResponse> {
  return apiPost<GeneratedCertificatePdfResponse>(
    "/certificates/me/latest/generate-pdf",
  );
}
