import Link from "next/link";
import { listDealCards, listStages, type DealCard } from "@/modules/deals";
import styles from "./deals.module.css";

export default async function DealsPage() {
  const [stages, cards] = await Promise.all([listStages(), listDealCards()]);

  const byStage = new Map<number, DealCard[]>();
  for (const s of stages) byStage.set(s.stageNumber, []);
  for (const c of cards) byStage.get(c.currentStage)?.push(c);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.count}>
          {cards.length} {cards.length === 1 ? "deal" : "deals"}
        </div>
        <Link className={styles.primaryBtn} href="/deals/new">
          + New deal
        </Link>
      </div>

      <div className={styles.board}>
        {stages.map((s) => {
          const col = byStage.get(s.stageNumber) ?? [];
          return (
            <div key={s.stageNumber} className={styles.column}>
              <div className={styles.colHead}>
                <span className={styles.colNum}>{s.stageNumber}</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name}
                </span>
                <span className={styles.colCount}>{col.length}</span>
              </div>
              <div className={styles.colBody}>
                {col.length === 0 ? (
                  <div className={styles.emptyCol}>—</div>
                ) : (
                  col.map((card) => (
                    <Link
                      key={card.id}
                      href={`/deals/${card.id}`}
                      className={styles.dealCard}
                    >
                      <div className={styles.cardAddr}>
                        {card.propertyAddress ?? "No property"}
                      </div>
                      <div className={styles.cardContact}>
                        {card.primaryContactName ?? "No contact linked"}
                      </div>
                      {card.status !== "active" && (
                        <span className={styles.badge}>{card.status}</span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
