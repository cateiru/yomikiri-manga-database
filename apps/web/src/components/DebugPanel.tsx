"use client";

import { useEffect, useState } from "react";
import {
  addReadOneshotId,
  getAnonymousUserId,
  getFavoriteOneshotIds,
  getPendingRead,
  getReadOneshotIds,
  getSkippedOneshotIds,
  getVotedOneshotIds,
  resetAllStoredState,
} from "@/lib/clientStorage";
import styles from "./DebugPanel.module.css";
import { ShareModal } from "./ShareModal";

const SHARE_MILESTONE_READ_COUNTS = [5, 50, 100];
const DEBUG_READ_ID_BASE = -1_000_000;

interface StorageSnapshot {
  anonymousUserId: string;
  pendingRead: ReturnType<typeof getPendingRead>;
  readCount: number;
  votedCount: number;
  skippedCount: number;
  favoriteCount: number;
}

function takeSnapshot(): StorageSnapshot {
  return {
    anonymousUserId: getAnonymousUserId(),
    pendingRead: getPendingRead(),
    readCount: getReadOneshotIds().length,
    votedCount: getVotedOneshotIds().length,
    skippedCount: getSkippedOneshotIds().length,
    favoriteCount: getFavoriteOneshotIds().length,
  };
}

export function DebugPanel() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  const [previewMilestone, setPreviewMilestone] = useState<number | null>(null);

  useEffect(() => {
    setSnapshot(takeSnapshot());
  }, []);

  const refresh = () => setSnapshot(takeSnapshot());

  const padReadCountTo = (target: number) => {
    let current = getReadOneshotIds().length;
    while (current < target) {
      addReadOneshotId(DEBUG_READ_ID_BASE - current);
      current += 1;
    }
    refresh();
  };

  const handleReset = () => {
    if (!window.confirm("localStorageの内容を全てリセットします。よろしいですか？")) {
      return;
    }
    resetAllStoredState();
    refresh();
  };

  if (!snapshot) {
    return null;
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>デバッグページ</h1>
      <p className={styles.warning}>
        開発確認用のページです。本番環境では表示されません。ここでの操作はブラウザの localStorage
        を直接書き換えます。
      </p>

      <section className={styles.section}>
        <h2 className={styles.subheading}>現在の状態</h2>
        <dl className={styles.stateList}>
          <dt>anonymousUserId</dt>
          <dd>{snapshot.anonymousUserId}</dd>
          <dt>pendingRead</dt>
          <dd>{snapshot.pendingRead ? JSON.stringify(snapshot.pendingRead) : "なし"}</dd>
          <dt>既読数（readOneshotIds）</dt>
          <dd>{snapshot.readCount}</dd>
          <dt>投票済み数</dt>
          <dd>{snapshot.votedCount}</dd>
          <dt>スキップ済み数</dt>
          <dd>{snapshot.skippedCount}</dd>
          <dt>お気に入り数</dt>
          <dd>{snapshot.favoriteCount}</dd>
        </dl>
        <button type="button" className={styles.secondary} onClick={refresh}>
          再取得
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>シェアモーダルのプレビュー</h2>
        <p>
          ジャンル設定モーダルの完了後に表示されるシェアモーダルを、実際のフローを介さず単体で確認できます。
        </p>
        <div className={styles.buttonRow}>
          {SHARE_MILESTONE_READ_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              className={styles.primary}
              onClick={() => setPreviewMilestone(count)}
            >
              {count}件達成として表示
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>実際のフローで確認</h2>
        <p>
          既読数をマイルストーンの1件手前まで進めておくと、トップページで作品をひとつ読むだけで
          「ジャンル設定モーダル→シェアモーダル」の一連の流れを実際の動作で再現できます
          （既に既読数が対象件数以上の場合は何も変わりません。先に下のリセットを行ってください）。
        </p>
        <div className={styles.buttonRow}>
          {SHARE_MILESTONE_READ_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              className={styles.secondary}
              onClick={() => padReadCountTo(count - 1)}
            >
              既読数を{count - 1}件にする
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>状態のリセット</h2>
        <button type="button" className={styles.secondary} onClick={handleReset}>
          localStorageを全てリセット
        </button>
      </section>

      {previewMilestone !== null ? (
        <ShareModal readCount={previewMilestone} onClose={() => setPreviewMilestone(null)} />
      ) : null}
    </main>
  );
}
