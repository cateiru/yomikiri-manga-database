import Link from "next/link";
import styles from "./DebugBanner.module.css";

export function DebugBanner() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className={styles.container}>
      <Link href="/debug" className={styles.label}>
        DEBUG
      </Link>
    </div>
  );
}
