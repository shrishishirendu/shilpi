import Link from "next/link";
import { listProperties, type Property } from "@/modules/properties";
import styles from "./properties.module.css";

function specs(p: Property): string {
  const parts: string[] = [];
  if (p.bedrooms != null) parts.push(`${p.bedrooms} bd`);
  if (p.bathrooms != null) parts.push(`${p.bathrooms} ba`);
  if (p.parking != null) parts.push(`${p.parking} car`);
  return parts.length ? parts.join(" · ") : "—";
}

function titleCase(s: string | null): string {
  return s ? s[0].toUpperCase() + s.slice(1) : "—";
}

export default async function PropertiesPage() {
  const properties = await listProperties();

  return (
    <div>
      <div className={styles.header}>
        <Link className={styles.primaryBtn} href="/properties/new">
          + New property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className={styles.empty}>
          No properties yet. Add your first listing.
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Address</th>
                <th>Suburb</th>
                <th>Type</th>
                <th>Specs</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/properties/${p.id}`}
                      className={styles.addrLink}
                    >
                      {p.address}
                    </Link>
                  </td>
                  <td>{p.suburb ?? "—"}</td>
                  <td>{titleCase(p.propertyType)}</td>
                  <td>{specs(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
