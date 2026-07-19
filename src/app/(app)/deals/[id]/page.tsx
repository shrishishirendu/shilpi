import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEAL_ROLES,
  MAX_STAGE,
  getDealDetail,
  listStages,
} from "@/modules/deals";
import { listContacts } from "@/modules/contacts";
import { addContactAction, advanceStageAction } from "../actions";
import styles from "../deals.module.css";

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, stages, contacts] = await Promise.all([
    getDealDetail(id),
    listStages(),
    listContacts(),
  ]);
  if (!detail) notFound();

  const { deal, stage, property, contacts: linked, stageHistory } = detail;
  const stageName = new Map(stages.map((s) => [s.stageNumber, s.name]));
  const nextStage = deal.currentStage < MAX_STAGE ? deal.currentStage + 1 : null;

  return (
    <div className={styles.detailWrap}>
      <Link href="/deals" className={styles.backLink}>
        ← Pipeline
      </Link>

      <div className={styles.detailHead}>
        <div>
          <div className={styles.detailTitle}>
            {property?.address ?? "Deal (no property yet)"}
          </div>
          <div className={styles.detailMeta}>
            <span className={styles.stagePill}>
              Stage {deal.currentStage} · {stage?.name ?? ""}
            </span>
            <span className={styles.statusPill}>{deal.status}</span>
          </div>
        </div>
        {nextStage && (
          <form action={advanceStageAction.bind(null, deal.id)}>
            <button className={styles.advanceBtn} type="submit">
              Advance → {nextStage}. {stageName.get(nextStage)}
            </button>
          </form>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionTitle}>Contacts</div>
        {linked.length === 0 ? (
          <div className={styles.muted}>No contacts linked yet.</div>
        ) : (
          linked.map((cv) => (
            <div key={cv.link.id} className={styles.contactRow}>
              <span>{cv.contact?.fullName ?? "Unknown contact"}</span>
              <span className={styles.roleTag}>{roleLabel(cv.link.role)}</span>
              {cv.link.isPrimary && (
                <span className={styles.primaryTag}>Primary</span>
              )}
            </div>
          ))
        )}

        {contacts.length === 0 ? (
          <p className={styles.muted} style={{ marginTop: 12 }}>
            <Link href="/contacts/new">Add a contact</Link> first, then link them
            here.
          </p>
        ) : (
          <form
            action={addContactAction.bind(null, deal.id)}
            className={styles.addForm}
          >
            <div className={styles.addField}>
              <span className={styles.addLabel}>Contact</span>
              <select
                className={styles.addSelect}
                name="contact_id"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select…
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.addField}>
              <span className={styles.addLabel}>Role</span>
              <select
                className={styles.addSelect}
                name="role"
                defaultValue="buyer"
              >
                {DEAL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <label className={styles.checkRow}>
              <input type="checkbox" name="is_primary" /> Primary
            </label>
            <button className={styles.addBtn} type="submit">
              Link
            </button>
          </form>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionTitle}>Stage history</div>
        <ul className={styles.history}>
          {stageHistory.map((h) => (
            <li key={h.id} className={styles.historyItem}>
              <span className={styles.historyDot} />
              <span>
                {h.fromStage == null
                  ? "Created at stage"
                  : `Stage ${h.fromStage} →`}{" "}
                {h.toStage} · {stageName.get(h.toStage) ?? ""}
              </span>
              <span className={styles.historyWhen}>
                {new Date(h.changedAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
