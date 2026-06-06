import jsPDF from "jspdf";
import type { Medicine } from "@/lib/ai";

export interface PrescriptionVitalsPDF {
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  weightKg?: number | null;
  temperatureF?: number | null;
  pulseRate?: number | null;
  spo2?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
}

export interface PrescriptionImageAsset {
  /** base64 data URL, e.g. "data:image/png;base64,..." */
  dataUrl: string;
  /** jsPDF format hint */
  format: "PNG" | "JPEG";
}

export interface PrescriptionPDFData {
  doctorName: string;
  qualification?: string | null;
  degree?: string | null;
  registrationNo?: string | null;
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  /** Optional branding (wired from clinics.logo_url / doctor_profiles.signature_url) */
  clinicLogo?: PrescriptionImageAsset | null;
  signature?: PrescriptionImageAsset | null;
  prescriptionHeader?: string | null;
  prescriptionFooter?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  allergies?: string[] | null;
  vitals?: PrescriptionVitalsPDF | null;
  date: string;
  diagnosis: string;
  chiefComplaint?: string;
  medicines: Medicine[];
  labTests?: string[];
  advice?: string;
  followUpDate?: string | null;
}

const MARGIN_X = 15;
const HEADER_H = 40;
const FOOTER_RESERVED = 30;

export function generatePrescriptionPDF(data: PrescriptionPDFData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentBottom = pageHeight - FOOTER_RESERVED;

  // ---- Header band (drawn on every page) ----
  const drawHeader = () => {
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, HEADER_H, "F");

    // Optional clinic logo (top-right corner, inside the band)
    let textRightEdge = pageWidth - MARGIN_X;
    if (data.clinicLogo) {
      try {
        const logoW = 22;
        const logoH = 22;
        const logoX = pageWidth - MARGIN_X - logoW;
        doc.addImage(data.clinicLogo.dataUrl, data.clinicLogo.format, logoX, 9, logoW, logoH);
        textRightEdge = logoX - 4;
      } catch {
        /* skip logo on decode failure */
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr. ${data.doctorName}`, MARGIN_X, 16);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (data.qualification || data.degree) {
      doc.text([data.qualification, data.degree].filter(Boolean).join(" | "), MARGIN_X, 24);
    }
    if (data.registrationNo) doc.text(`Reg: ${data.registrationNo}`, MARGIN_X, 31);

    doc.text(data.clinicName, textRightEdge, 16, { align: "right" });
    if (data.clinicAddress) {
      const addrLines = doc.splitTextToSize(data.clinicAddress, 80);
      doc.text(addrLines, textRightEdge, 24, { align: "right" });
    }
    if (data.clinicPhone) doc.text(`Ph: ${data.clinicPhone}`, textRightEdge, 31, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  // ---- Footer (drawn on every page) ----
  const drawFooter = (pageNo: number, pageCount: number) => {
    const footerY = pageHeight - 22;
    doc.setDrawColor(220, 220, 220);
    doc.line(MARGIN_X, footerY - 4, pageWidth - MARGIN_X, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footerText = data.prescriptionFooter?.trim()
      ? data.prescriptionFooter.trim()
      : "This is a computer-generated prescription verified by the attending doctor.";
    const footerLines = doc.splitTextToSize(footerText, pageWidth - 2 * MARGIN_X - 25);
    doc.text(footerLines, MARGIN_X, footerY);
    doc.text(`Page ${pageNo} of ${pageCount}`, pageWidth - MARGIN_X, footerY, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  let y = 0;

  // Page-break helper: if the next block won't fit, start a new page.
  const ensureSpace = (needed: number) => {
    if (y + needed > contentBottom) {
      doc.addPage();
      drawHeader();
      y = HEADER_H + 15;
    }
  };

  // ---- First page header + body start ----
  drawHeader();
  y = HEADER_H + 15;

  // Optional custom header text block
  if (data.prescriptionHeader?.trim()) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    const hLines = doc.splitTextToSize(data.prescriptionHeader.trim(), pageWidth - 2 * MARGIN_X);
    doc.text(hLines, MARGIN_X, y);
    y += hLines.length * 5 + 3;
    doc.setTextColor(0, 0, 0);
  }

  // Patient strip
  doc.setFillColor(248, 248, 248);
  doc.rect(10, y - 5, pageWidth - 20, 20, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Patient: ${data.patientName}`, MARGIN_X, y + 5);
  doc.text(`Age: ${data.patientAge ?? "—"} | Gender: ${data.patientGender ?? "—"}`, pageWidth / 2, y + 5, { align: "center" });
  doc.text(`Date: ${data.date}`, pageWidth - MARGIN_X, y + 5, { align: "right" });
  y += 24;

  // Allergy safety strip (red) — high clinical value
  const allergyList = (data.allergies ?? []).filter(Boolean);
  if (allergyList.length > 0) {
    const text = `ALLERGIES: ${allergyList.join(", ")}`;
    const lines = doc.splitTextToSize(text, pageWidth - 2 * MARGIN_X - 6);
    const boxH = lines.length * 5 + 6;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.rect(10, y - 4, pageWidth - 20, boxH, "FD");
    doc.setTextColor(185, 28, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(lines, MARGIN_X, y + 2);
    doc.setTextColor(0, 0, 0);
    y += boxH + 4;
  }

  // Vitals row (only if any recorded)
  const v = data.vitals;
  const vitalsParts: string[] = [];
  if (v) {
    if (v.bpSystolic != null && v.bpDiastolic != null) vitalsParts.push(`BP ${v.bpSystolic}/${v.bpDiastolic}`);
    if (v.pulseRate != null) vitalsParts.push(`Pulse ${v.pulseRate}`);
    if (v.temperatureF != null) vitalsParts.push(`Temp ${v.temperatureF}F`);
    if (v.spo2 != null) vitalsParts.push(`SpO2 ${v.spo2}%`);
    if (v.weightKg != null) vitalsParts.push(`Wt ${v.weightKg}kg`);
    if (v.heightCm != null) vitalsParts.push(`Ht ${v.heightCm}cm`);
    if (v.bmi != null) vitalsParts.push(`BMI ${v.bmi}`);
  }
  if (vitalsParts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Vitals:", MARGIN_X, y);
    doc.setFont("helvetica", "normal");
    const vLines = doc.splitTextToSize(vitalsParts.join("   ·   "), pageWidth - 2 * MARGIN_X - 18);
    doc.text(vLines, MARGIN_X + 18, y);
    y += vLines.length * 5 + 6;
  }

  // Chief complaint
  if (data.chiefComplaint) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Complaint:", MARGIN_X, y);
    doc.setFont("helvetica", "normal");
    const cc = doc.splitTextToSize(data.chiefComplaint, pageWidth - 60);
    doc.text(cc, 45, y);
    y += Math.max(10, cc.length * 5 + 4);
  }

  // Diagnosis
  ensureSpace(14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Diagnosis:", MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  const dx = doc.splitTextToSize(data.diagnosis || "—", pageWidth - 60);
  doc.text(dx, 45, y);
  y += Math.max(14, dx.length * 5 + 6);

  // Medicines (Rx)
  ensureSpace(16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("\u211e", MARGIN_X, y);
  y += 8;
  doc.setFontSize(10);
  data.medicines.forEach((m, i) => {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${m.name}${m.dosage ? ` ${m.dosage}` : ""}`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const detail = `${m.frequency}${m.duration ? ` × ${m.duration}` : ""} — ${m.instructions || "as directed"}`;
    const dLines = doc.splitTextToSize(detail, pageWidth - 50);
    doc.text(dLines, 25, y + 6);
    doc.setFontSize(10);
    y += 8 + dLines.length * 5 + 2;
  });

  // Lab tests
  if (data.labTests && data.labTests.length) {
    ensureSpace(14);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Lab Tests:", MARGIN_X, y);
    y += 8;
    data.labTests.forEach((t) => {
      ensureSpace(8);
      doc.setFont("helvetica", "normal");
      doc.text(`\u2022 ${t}`, 20, y);
      y += 6;
    });
  }

  // Advice
  if (data.advice) {
    ensureSpace(14);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Advice:", MARGIN_X, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.advice, pageWidth - 50);
    doc.text(lines, 40, y);
    y += lines.length * 6 + 4;
  }

  // Follow-up
  if (data.followUpDate) {
    ensureSpace(12);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text(`Follow-up: ${data.followUpDate}`, MARGIN_X, y);
    y += 8;
  }

  // Signature (image if present, else a line) — bottom-right of the LAST page
  ensureSpace(30);
  const sigBaseY = Math.max(y + 6, contentBottom - 18);
  if (data.signature) {
    try {
      doc.addImage(data.signature.dataUrl, data.signature.format, pageWidth - 70, sigBaseY - 16, 50, 16);
    } catch {
      /* fall through to line */
    }
  }
  doc.setDrawColor(120, 120, 120);
  doc.line(pageWidth - 70, sigBaseY, pageWidth - MARGIN_X, sigBaseY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Dr. ${data.doctorName}`, pageWidth - 42, sigBaseY + 5, { align: "center" });

  // ---- Footers on all pages (now that page count is known) ----
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    drawFooter(p, pageCount);
  }

  return doc;
}
