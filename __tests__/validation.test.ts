import { describe, it, expect } from "vitest";
import { validatePatientInput, validateVitalsInput } from "@/lib/domain/models/patient";

describe("validatePatientInput", () => {
  it("requires a name", () => {
    expect(validatePatientInput({ phone: "9876543210" })).toMatch(/name/i);
  });

  it("requires a phone", () => {
    expect(validatePatientInput({ full_name: "John Doe" })).toMatch(/phone/i);
  });

  it("rejects phone numbers shorter than 10 digits", () => {
    expect(validatePatientInput({ full_name: "John", phone: "12345" })).toMatch(/10 digits/i);
  });

  it("rejects an invalid email", () => {
    expect(
      validatePatientInput({ full_name: "John", phone: "9876543210", email: "not-an-email" }),
    ).toMatch(/email/i);
  });

  it("rejects an out-of-range age", () => {
    expect(
      validatePatientInput({ full_name: "John", phone: "9876543210", age: 200 }),
    ).toMatch(/age/i);
  });

  it("accepts a valid patient (returns null)", () => {
    expect(
      validatePatientInput({
        full_name: "John Doe",
        phone: "+91 98765 43210",
        email: "john@example.com",
        age: 35,
      }),
    ).toBeNull();
  });
});

describe("validateVitalsInput", () => {
  it("rejects non-positive BP systolic", () => {
    expect(validateVitalsInput({ bp_systolic: 0 })).toMatch(/systolic/i);
  });

  it("rejects temperature outside the plausible Fahrenheit range", () => {
    expect(validateVitalsInput({ temperature_f: 200 })).toMatch(/temperature/i);
  });

  it("rejects SpO2 above 100", () => {
    expect(validateVitalsInput({ spo2: 120 })).toMatch(/spo2/i);
  });

  it("accepts valid vitals (returns null)", () => {
    expect(
      validateVitalsInput({
        bp_systolic: 120,
        bp_diastolic: 80,
        weight_kg: 70,
        temperature_f: 98.6,
        pulse_rate: 72,
        spo2: 98,
        height_cm: 175,
        bmi: 22.9,
      }),
    ).toBeNull();
  });

  it("accepts empty vitals (all optional)", () => {
    expect(validateVitalsInput({})).toBeNull();
  });
});
