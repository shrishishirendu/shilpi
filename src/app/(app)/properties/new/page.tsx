import Link from "next/link";
import { PROPERTY_TYPES } from "@/modules/properties";
import { createPropertyAction } from "../actions";
import { PropertyForm } from "../_components/PropertyForm";
import styles from "../properties.module.css";

export default function NewPropertyPage() {
  return (
    <div className={styles.formWrap}>
      <Link href="/properties" className={styles.backLink}>
        ← Properties
      </Link>
      <PropertyForm
        action={createPropertyAction}
        submitLabel="Create property"
        propertyTypes={PROPERTY_TYPES}
      />
    </div>
  );
}
