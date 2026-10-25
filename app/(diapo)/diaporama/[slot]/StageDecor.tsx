import styles from "./DiaporamaClient.module.css";

export default function StageDecor() {
  return <div className={styles.decor} aria-hidden="true">
    <div className={styles.aurora} />
    <div className={styles.orbit} />
    <div className={styles.orbitInner} />
    <div className={styles.stageGrid} />
    <div className={styles.lightSweep} />
    <span className={styles.crossOne}>+</span><span className={styles.crossTwo}>+</span>
  </div>;
}
