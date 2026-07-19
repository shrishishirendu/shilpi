import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";
import { countContacts } from "@/modules/contacts";
import { countProperties } from "@/modules/properties";
import { getDealStats } from "@/modules/deals";

vi.mock("@/modules/contacts", () => ({ countContacts: vi.fn() }));
vi.mock("@/modules/properties", () => ({ countProperties: vi.fn() }));
vi.mock("@/modules/deals", () => ({ getDealStats: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const mockedContacts = vi.mocked(countContacts);
const mockedProperties = vi.mocked(countProperties);
const mockedStats = vi.mocked(getDealStats);

describe("DashboardPage", () => {
  it("shows real counts and quick links when there is data", async () => {
    mockedStats.mockResolvedValue({ activeDeals: 3, pipelineValue: 5_900_000 });
    mockedContacts.mockResolvedValue(5);
    mockedProperties.mockResolvedValue(4);

    render(await DashboardPage());

    expect(screen.getByText("Active deals")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Jump in")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crm pipeline/i }),
    ).toHaveAttribute("href", "/deals");
  });

  it("shows the empty state when there is no data", async () => {
    mockedStats.mockResolvedValue({ activeDeals: 0, pipelineValue: 0 });
    mockedContacts.mockResolvedValue(0);
    mockedProperties.mockResolvedValue(0);

    render(await DashboardPage());

    expect(screen.getByText("Your workspace is ready")).toBeInTheDocument();
  });
});
