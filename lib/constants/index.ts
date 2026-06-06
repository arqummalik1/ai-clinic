export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export type GenderType = typeof GENDERS[keyof typeof GENDERS];

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CLINIC_ADMIN: "clinic_admin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const PATHS = {
  RECEPTION_PATIENTS: "/reception/patients",
  DOCTOR_PATIENTS: "/doctor/patients",
} as const;

export const ERROR_MESSAGES = {
  REQUIRED_NAME_PHONE: "Name and phone are required",
  NOT_AUTHENTICATED: "Not authenticated",
  NO_CLINIC_ASSIGNED: "No clinic assigned",
  CREATE_PATIENT_FAILED: "Failed to create patient",
  LOAD_PATIENTS_FAILED: "Failed to load patients",
  GENERIC_ERROR: "An unexpected error occurred",
} as const;
