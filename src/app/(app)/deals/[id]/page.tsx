import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEAL_ROLES,
  MAX_STAGE,
  getDealDetail,
  listStages,
} from "@/modules/deals";
import { listContacts } from "@/modules/contacts";
import { listOffersForDeal, TERMINAL_STATUSES } from "@/modules/offers";
import { addContactAction, advanceStageAction } from "../actions";
import {
  acceptOfferAction,
  counterOfferAction,
  rejectOfferAction,
  submitOfferAction,
  withdrawOfferAction,
} from "../offer-actions";
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
  const [detail, stages, contacts, offers] = await Promise.all([
    getDealDetail(id),
    listStages(),
    listContacts(),
    listOffersForDeal(id),
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
        <div className={styles.sectionTitle}>Offers</div>
        {offers.length === 0 ? (
          <div className={styles.muted}>No offers yet.</div>
        ) : (
          offers.map(({ offer, buyerName }) => {
            const terminal = (TERMINAL_STATUSES as readonly string[]).includes(
              offer.status,
            );
            return (
              <div key={offer.id} className={styles.offer}>
                <div className={styles.offerTop}>
                  <span className={styles.offerAmount}>
                    ${offer.amount.toLocaleString()}
                  </span>
                  <span className={styles.offerBuyer}>
                    {buyerName ?? "No buyer set"}
                  </span>
                  <span
                    className={`${styles.oStatus} ${styles[`oStatus_${offer.status}`]}`}
                  >
                    {offer.status}
                  </span>
                </div>
                {(offer.isConditional || offer.settlementDays != null) && (
                  <div className={styles.offerMeta}>
                    {offer.isConditional
                      ? `Conditional${offer.conditions ? `: ${offer.conditions}` : ""}`
                      : "Unconditional"}
                    {offer.settlementDays != null
                      ? ` · ${offer.settlementDays}-day settlement`
                      : ""}
                  </div>
                )}
                {!terminal && (
                  <div className={styles.offerActions}>
                    <form action={acceptOfferAction.bind(null, deal.id, offer.id)}>
                      <button
                        className={`${styles.oBtn} ${styles.oBtnAccept}`}
                        type="submit"
                      >
                        Accept
                      </button>
                    </form>
                    <form action={counterOfferAction.bind(null, deal.id, offer.id)}>
                      <button className={styles.oBtn} type="submit">
                        Counter
                      </button>
                    </form>
                    <form action={rejectOfferAction.bind(null, deal.id, offer.id)}>
                      <button className={styles.oBtn} type="submit">
                        Reject
                      </button>
                    </form>
                    <form action={withdrawOfferAction.bind(null, deal.id, offer.id)}>
                      <button className={styles.oBtn} type="submit">
                        Withdraw
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}

        <form
          action={submitOfferAction.bind(null, deal.id)}
          className={styles.submitOffer}
        >
          <div className={styles.offerFormRow}>
            <div className={styles.offerField}>
              <span className={styles.offerLabel}>Buyer</span>
              <select
                className={styles.offerInput}
                name="buyer_contact_id"
                defaultValue=""
              >
                <option value="">— No buyer —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.offerField}>
              <span className={styles.offerLabel}>Amount (AUD)</span>
              <input
                className={styles.offerInput}
                name="amount"
                type="number"
                min={1}
                step="any"
                required
                placeholder="1450000"
              />
            </div>
          </div>
          <div className={styles.offerFormRow}>
            <div className={styles.offerField}>
              <span className={styles.offerLabel}>Settlement (days)</span>
              <input
                className={styles.offerInput}
                name="settlement_days"
                type="number"
                min={0}
                step={1}
                placeholder="42"
              />
            </div>
            <label
              className={styles.checkRow}
              style={{ alignSelf: "flex-end", height: 34 }}
            >
              <input type="checkbox" name="is_conditional" /> Conditional
              (finance / B&amp;P)
            </label>
          </div>
          <div className={styles.offerField}>
            <span className={styles.offerLabel}>Conditions (optional)</span>
            <textarea
              className={styles.offerTextarea}
              name="conditions"
              rows={2}
              placeholder="Subject to finance approval by…"
            />
          </div>
          <button className={styles.submitOfferBtn} type="submit">
            Submit offer
          </button>
        </form>
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
