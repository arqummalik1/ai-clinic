import { PatientService } from "@/lib/services/patientService";
import { PatientInput, VitalsInput, Patient, PatientVitals } from "@/lib/domain/models/patient";

export interface IPatientRepository {
  getAll(search?: string): Promise<Patient[]>;
  create(patient: PatientInput): Promise<Patient>;
  saveVitals(patientId: string, clinicId: string, vitals: VitalsInput): Promise<PatientVitals>;
  getReceptionStats(clinicId: string, today: string): Promise<{ todayAppointments: number; patientCount: number }>;
  getDoctorStats(doctorId: string, today: string): Promise<{ todayAppointments: number; totalPrescriptions: number }>;
}

export class PatientRepository implements IPatientRepository {
  private service: PatientService;

  constructor(service: PatientService = new PatientService()) {
    this.service = service;
  }

  async getAll(search?: string): Promise<Patient[]> {
    return this.service.fetchPatients(search);
  }

  async create(patient: PatientInput): Promise<Patient> {
    return this.service.createPatient(patient);
  }

  async saveVitals(patientId: string, clinicId: string, vitals: VitalsInput): Promise<PatientVitals> {
    return this.service.createVitals(patientId, clinicId, vitals);
  }

  async getReceptionStats(clinicId: string, today: string): Promise<{ todayAppointments: number; patientCount: number }> {
    return this.service.fetchReceptionStats(clinicId, today);
  }

  async getDoctorStats(doctorId: string, today: string): Promise<{ todayAppointments: number; totalPrescriptions: number }> {
    return this.service.fetchDoctorStats(doctorId, today);
  }
}
