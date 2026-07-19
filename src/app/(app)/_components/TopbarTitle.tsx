"use client";

import { usePathname } from "next/navigation";

function titleFor(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/contacts") return "Contacts";
  if (pathname === "/contacts/new") return "New contact";
  if (pathname.startsWith("/contacts/")) return "Contact";
  return "Shilpi";
}

export function TopbarTitle() {
  const pathname = usePathname();
  return <span>{titleFor(pathname)}</span>;
}
