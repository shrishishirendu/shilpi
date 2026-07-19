import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../Sidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));
vi.mock("../../actions", () => ({ signOut: vi.fn() }));

describe("Sidebar", () => {
  it("renders the nav, the signed-in user, and a logout button", () => {
    render(
      <Sidebar userName="Ada Vendor" role="principal" agencyName="Harbour Realty" />,
    );
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText("CRM pipeline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contacts/i })).toHaveAttribute(
      "href",
      "/contacts",
    );
    expect(screen.getByRole("link", { name: /properties/i })).toHaveAttribute(
      "href",
      "/properties",
    );
    expect(screen.getByText("Ada Vendor")).toBeInTheDocument();
    expect(
      screen.getByText(/principal · harbour realty/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("derives avatar initials from the user's name", () => {
    render(
      <Sidebar userName="Ada Vendor" role="agent" agencyName="Harbour Realty" />,
    );
    expect(screen.getByText("AV")).toBeInTheDocument();
  });
});
