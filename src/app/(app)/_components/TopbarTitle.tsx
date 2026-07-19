"use client";

import { usePathname } from "next/navigation";

function titleFor(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/deals") return "CRM pipeline";
  if (pathname === "/deals/new") return "New deal";
  if (pathname.startsWith("/deals/")) return "Deal";
  if (pathname === "/contacts") return "Contacts";
  if (pathname === "/contacts/new") return "New contact";
  if (pathname.startsWith("/contacts/")) return "Contact";
  if (pathname === "/properties") return "Properties";
  if (pathname === "/properties/new") return "New property";
  if (pathname.startsWith("/properties/")) return "Property";
  return "Shilpi";
}

export function TopbarTitle() {
  const pathname = usePathname();
  return <span>{titleFor(pathname)}</span>;
}
