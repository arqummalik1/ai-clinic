import jsPDF from "jspdf";
import type { Medicine } from "@/lib/ai";

export interface PrescriptionPDFData {
  doctorName: string;
  qualification?: string | null;
  degree?: string | null;
  registrationNo?: string | null;
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  date: string;
  diagnosis: string;
  chiefComplaint?: string;
  medicines: Medicine[];
  labTests?: string[];
  advice?: string;
  followUpDate?: string | null;
}

export function generatePrescriptionPDF(data: PrescriptionPDFData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  // Header band
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Dr. ${data.doctorName}`, 15, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (data.qualification || data.degree) {
    doc.text([data.qualification, data.degree].filter(Boolean).join(" | "), 15, 24);
  }
  if (data.registrationNo) doc.text(`Reg: ${data.registrationNo}`, 15, 31);
  doc.text(data.clinicName, pageWidth - 15, 16, { align: "right" });
  if (data.clinicAddress) doc.text(data.clinicAddress, pageWidth - 15, 24, { align: "right" });
  if (data.clinicPhone) doc.text(`Ph: ${data.clinicPhone}`, pageWidth - 15, 31, { align: "right" });

  doc.setTextColor(0, 0, 0);
  y = 55;

  // Patient strip
  doc.setFillColor(248, 248, 248);
  doc.rect(10, y - 5, pageWidth - 20, 20, "F");
  doc.setFontSize(10);
  doc.text(`Patient: ${data.patientName}`, 15, y + 5);
  doc.text(`Age: ${data.patientAge ?? "—"} | Gender: ${data.patientGender ?? "—"}`, pageWidth / 2, y + 5);
  doc.text(`Date: ${data.date}`, pageWidth - 15, y + 5, { align: "right" });
  y += 28;

  // Chief complaint
  if (data.chiefComplaint) {
    doc.setFont("helvetica", "bold");
    doc.text("Complaint:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.chiefComplaint, 50, y);
    y += 10;
  }

  // Diagnosis
  doc.setFont("helvetica", "bold");
  doc.text("Diagnosis:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.diagnosis || "—", 50, y);
  y += 14;

  // Medicines
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("\u211e", 15, y);
  y += 8;
  doc.setFontSize(10);
  data.medicines.forEach((m, i) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${m.name}${m.dosage ? ` ${m.dosage}` : ""}`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${m.frequency} × ${m.duration} — ${m.instructions || "as directed"}`, 25, y + 6);
    doc.setFontSize(10);
    y += 14;
  });

  // Lab tests
  if (data.labTests && data.labTests.length) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Lab Tests:", 15, y);
    y += 8;
    data.labTests.forEach((t) => {
      doc.setFont("helvetica", "normal");
      doc.text(`\u2022 ${t}`, 20, y);
      y += 6;
    });
  }

  // Advice
  if (data.advice) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Advice:", 15, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.advice, pageWidth - 45);
    doc.text(lines, 40, y);
    y += lines.length * 6 + 4;
  }

  if (data.followUpDate) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text(`Follow-up: ${data.followUpDate}`, 15, y);
  }

  // Signature line
  const sigY = doc.internal.pageSize.getHeight() - 25;
  doc.line(pageWidth - 70, sigY, pageWidth - 15, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Doctor's Signature", pageWidth - 43, sigY + 5, { align: "center" });

  return doc;
}
