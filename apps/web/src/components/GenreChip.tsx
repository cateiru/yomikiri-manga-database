"use client";

import type { ChangeEvent } from "react";
import styles from "./GenreChip.module.css";

interface GenreChipProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function GenreChip({ label, checked, onChange }: GenreChipProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label className={`${styles.chip} ${checked ? styles.checked : ""}`}>
      <input type="checkbox" checked={checked} onChange={handleChange} className={styles.input} />
      {checked ? "✓ " : ""}
      {label}
    </label>
  );
}
