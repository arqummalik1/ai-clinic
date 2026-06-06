import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PatientForm } from "@/components/patients/PatientForm";
import { createPatientAction } from "@/app/actions/patients";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// The current PatientForm submits via the `createPatientAction` server action
// (NOT the usePatientViewModel hook the old test assumed). Mock that boundary.
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/actions/patients", () => ({
  createPatientAction: vi.fn(),
}));

const mockedAction = vi.mocked(createPatientAction);
const mockedToast = vi.mocked(toast);
const mockedUseRouter = vi.mocked(useRouter);
const mockPush = vi.fn();

describe("PatientForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the required fields and submit button", () => {
    render(<PatientForm />);
    expect(screen.getByLabelText(/Full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone \*/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create patient/i })).toBeInTheDocument();
  });

  it("submits entered values to createPatientAction and redirects on success", async () => {
    mockedAction.mockResolvedValue({ success: true, patientId: "p-123" });

    render(<PatientForm redirectAfter="/doctor/patients" />);

    fireEvent.change(screen.getByLabelText(/Full name \*/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/Phone \*/i), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: /Create patient/i }));

    await waitFor(() => {
      expect(mockedAction).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: "John Doe", phone: "9876543210" }),
        expect.any(Object),
      );
      expect(mockedToast.success).toHaveBeenCalledWith("Patient created successfully");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/doctor/patients");
    });
  });

  it("shows an error and does not redirect when the action fails", async () => {
    mockedAction.mockResolvedValue({ success: false, error: "Phone number is required" });

    render(<PatientForm />);

    fireEvent.change(screen.getByLabelText(/Full name \*/i), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText(/Phone \*/i), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /Create patient/i }));

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Phone number is required");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
