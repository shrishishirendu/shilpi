import Link from "next/link";
import { createContactAction } from "../actions";
import { ContactForm } from "../_components/ContactForm";
import styles from "../contacts.module.css";

export default function NewContactPage() {
  return (
    <div className={styles.formWrap}>
      <Link href="/contacts" className={styles.backLink}>
        ← Contacts
      </Link>
      <ContactForm action={createContactAction} submitLabel="Create contact" />
    </div>
  );
}
