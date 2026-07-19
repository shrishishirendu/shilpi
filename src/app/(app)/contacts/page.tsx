import Link from "next/link";
import { listContacts, searchContacts } from "@/modules/contacts";
import styles from "./contacts.module.css";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const contacts = query
    ? await searchContacts(query)
    : await listContacts();

  return (
    <div>
      <div className={styles.header}>
        <form className={styles.searchForm}>
          <input
            className={styles.search}
            name="q"
            defaultValue={query}
            placeholder="Search by name"
            aria-label="Search contacts by name"
          />
        </form>
        <Link className={styles.primaryBtn} href="/contacts/new">
          + New contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <div className={styles.empty}>
          {query
            ? `No contacts match “${query}”.`
            : "No contacts yet. Add your first one."}
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/contacts/${c.id}`} className={styles.nameLink}>
                      {c.fullName}
                    </Link>
                  </td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
