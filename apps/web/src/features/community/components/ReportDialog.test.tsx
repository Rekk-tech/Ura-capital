import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReportDialog } from "./ReportDialog";

describe("ReportDialog Component (AC-008)", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ReportDialog postId="post-1" isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal dialog with accessibility attributes when isOpen is true", () => {
    render(<ReportDialog postId="post-1" isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByTestId("report-dialog");
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Report Content")).toBeDefined();
    expect(screen.getByTestId("report-reason-select")).toBeDefined();
    expect(screen.getByTestId("report-notes-textarea")).toBeDefined();
  });

  it("handles reason selection and displays submission confirmation", () => {
    render(<ReportDialog postId="post-1" isOpen={true} onClose={vi.fn()} />);

    const select = screen.getByTestId("report-reason-select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "MISINFORMATION" } });
    expect(select.value).toBe("MISINFORMATION");

    const notes = screen.getByTestId("report-notes-textarea");
    fireEvent.change(notes, { target: { value: "Spammy financial scheme" } });

    const submitBtn = screen.getByTestId("report-submit-btn");
    fireEvent.click(submitBtn);

    expect(screen.getByTestId("report-success-state")).toBeDefined();
    expect(screen.getByText("Report Submitted")).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<ReportDialog postId="post-1" isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("report-close-btn"));
    expect(onClose).toHaveBeenCalled();
  });
});
