"use client";

import { useState } from "react";
import styles from "./DataTransferButton.module.css";
import { DataTransferModal } from "./DataTransferModal";

export function DataTransferButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        データ引き継ぎ
      </button>
      {open ? <DataTransferModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
