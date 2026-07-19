import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty, PROPERTY_TYPES } from "@/modules/properties";
import { updatePropertyAction } from "../actions";
import { PropertyForm } from "../_components/PropertyForm";
import styles from "../properties.module.css";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const action = updatePropertyAction.bind(null, id);

  return (
    <div className={styles.formWrap}>
      <Link href="/properties" className={styles.backLink}>
        ← Properties
      </Link>
      <PropertyForm
        action={action}
        defaults={property}
        submitLabel="Save changes"
        propertyTypes={PROPERTY_TYPES}
      />
    </div>
  );
}
