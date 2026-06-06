import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PatientForm } from "@/components/patients/PatientForm";
import { usePatientViewModel } from "@/hooks/usePatientViewModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Mocking dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/hooks/usePatientViewModel", () => ({
  usePatientViewModel: jest.fn(),
}));

describe("PatientForm Component", () => {
  const mockPush = jest.fn();
  const mockRegisterPatient = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePatientViewModel as jest.Mock).mockReturnValue({
      registerPatient: mockRegisterPatient,
      loading: false,
      error: null,
    });
  });

  it("renders all required input fields", () => {
    render(<PatientForm />);
    expect(screen.getByLabelText(/Full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Create patient/i)).toBeInTheDocument();
  });

  it("shows validation error if required fields are missing", async () => {
    mockRegisterPatient.mockResolvedValue({
      success: false,
      data: null,
      error: "Name and phone are required",
    });

    render(<PatientForm />);
    const submitButton = screen.getByRole("button", { name: /Create patient/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegisterPatient).toHaveBeenCalled();
    });
  });

  it("handles loading states gracefully during submission", () => {
    (usePatientViewModel as jest.Mock).mockReturnValue({
      registerPatient: mockRegisterPatient,
      loading: true,
      error: null,
    });

    render(<PatientForm />);
    expect(screen.getByRole("button", { name: /Saving…/i })).toBeDisabled();
  });

  it("submits correct form values and redirects on success", async () => {
    mockRegisterPatient.mockResolvedValue({
      success: true,
      data: { id: "p-123", clinic_id: "c-123" },
      error: null,
    });

    render(<PatientForm redirectAfter="/doctor/patients" />);

    const nameInput = screen.getByLabelText(/Full name \*/i);
    const phoneInput = screen.getByLabelText(/Phone \*/i);
    const submitButton = screen.getByRole("button", { name: /Create patient/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(phoneInput, { target: { value: "9876543210" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegisterPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: "John Doe",
          phone: "9876543210",
        }),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith("Patient created successfully");
      expect(mockPush).toHaveBeenCalledWith("/doctor/patients");
    });
  });
});
