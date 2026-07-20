import styles from "./ThumbnailPlaceholder.module.css";

export function ThumbnailPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <span>NO IMAGE</span>
    </div>
  );
}
