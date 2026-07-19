import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";

describe("DashboardPage (empty state)", () => {
  it("renders the empty state with zeroed stats and no errors", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Your workspace is ready")).toBeInTheDocument();
    expect(screen.getByText("Active deals")).toBeInTheDocument();
    expect(screen.getByText("Pipeline value")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
  });
});
