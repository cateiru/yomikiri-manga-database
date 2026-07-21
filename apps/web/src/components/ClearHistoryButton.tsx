"use client";

import { useState } from "react";
import { resetAllStoredState } from "@/lib/clientStorage";
import styles from "./ClearHistoryButton.module.css";

export function ClearHistoryButton() {
  const [cleared, setCleared] = useState(false);

  const handleClick = () => {
    if (
      !window.confirm("既読・お気に入り・投票・スキップの記録をすべて消去します。よろしいですか？")
    ) {
      return;
    }
    resetAllStoredState();
    setCleared(true);
  };

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.button} onClick={handleClick}>
        履歴を消去
      </button>
      {cleared ? <p className={styles.message}>履歴を消去しました。</p> : null}
    </div>
  );
}
