import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>© {year} cateiru</p>
      </div>
    </footer>
  );
}
