"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
};

export function TopbarTitle() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Shilpi";
  return <span>{title}</span>;
}
