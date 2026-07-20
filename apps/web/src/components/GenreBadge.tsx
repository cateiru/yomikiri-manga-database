import styles from "./GenreBadge.module.css";

interface GenreBadgeProps {
  label: string;
  rank: number;
}

export function GenreBadge({ label, rank }: GenreBadgeProps) {
  return <span className={rank === 1 ? styles.inverted : styles.standard}>{label}</span>;
}
