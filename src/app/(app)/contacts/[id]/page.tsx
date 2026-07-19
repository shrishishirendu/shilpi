import Link from "next/link";
import { notFound } from "next/navigation";
import { getContact } from "@/modules/contacts";
import { updateContactAction } from "../actions";
import { ContactForm } from "../_components/ContactForm";
import styles from "../contacts.module.css";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();

  // Bind the contact id so the form's action matches the (prev, formData) shape.
  const action = updateContactAction.bind(null, id);

  return (
    <div className={styles.formWrap}>
      <Link href="/contacts" className={styles.backLink}>
        ← Contacts
      </Link>
      <ContactForm
        action={action}
        defaults={contact}
        submitLabel="Save changes"
      />
    </div>
  );
}
