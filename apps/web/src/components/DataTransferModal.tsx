"use client";

import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  exportTransferState,
  importTransferState,
  type TransferPayload,
} from "@/lib/clientStorage";
import styles from "./DataTransferModal.module.css";

interface DataTransferModalProps {
  onClose: () => void;
}

type Screen = "select" | "issue" | "redeemInput" | "redeemMode" | "redeemDone";

const FOCUSABLE_SELECTOR = 'input, button, [href], [tabindex]:not([tabindex="-1"])';
const CODE_LENGTH = 8;

const expiresAtFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function DataTransferModal({ onClose }: DataTransferModalProps) {
  const [screen, setScreen] = useState<Screen>("select");
  const dialogRef = useRef<HTMLDivElement>(null);

  const [agreed, setAgreed] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
  }, []);

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }
    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusableElements.length === 0) {
      return;
    }
    const first = focusableElements.item(0);
    const last = focusableElements.item(focusableElements.length - 1);
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleIssue = async () => {
    setIssuing(true);
    setIssueError(false);
    try {
      const response = await fetch("/api/data-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportTransferState()),
      });
      if (!response.ok) {
        throw new Error("コード発行に失敗しました");
      }
      const data = (await response.json()) as { code: string; expiresAt: string };
      setIssuedCode(data.code);
      setIssuedExpiresAt(new Date(data.expiresAt));
    } catch {
      setIssueError(true);
    } finally {
      setIssuing(false);
    }
  };

  const handleCopyCode = async () => {
    if (!issuedCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(issuedCode);
      setCopied(true);
    } catch {
      // クリップボードへのアクセスが許可されていない場合は何もしない（コードは画面上に表示済み）
    }
  };

  const handleCodeInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = event.target.value
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, CODE_LENGTH);
    setCodeInput(normalized);
  };

  const handleRedeem = async (mode: "overwrite" | "merge") => {
    setRedeeming(true);
    setRedeemError(null);
    try {
      const response = await fetch(`/api/data-transfer/${codeInput}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (response.status === 404) {
        setRedeemError("コードが無効です。入力内容と有効期限をご確認ください。");
        return;
      }
      if (!response.ok) {
        throw new Error("引き継ぎに失敗しました");
      }
      const data = (await response.json()) as { payload: TransferPayload; mode: typeof mode };
      importTransferState(data.payload, data.mode);
      setScreen("redeemDone");
    } catch {
      setRedeemError("引き継ぎに失敗しました。もう一度お試しください。");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-transfer-modal-title"
        onKeyDown={trapFocus}
      >
        <h2 id="data-transfer-modal-title" className={styles.title}>
          データ引き継ぎ
        </h2>

        {screen === "select" ? (
          <>
            <p className={styles.description}>
              この端末の既読・お気に入り・投票・スキップの記録を、引き継ぎコードを使って別の端末に移すことができます。
              まずこの端末で「コード発行」を行い、表示されたコードを引き継ぎ先の端末の「コード入力」に入力してください。
              コードは発行から24時間だけ有効で、一度使用すると失効します。
            </p>
            <div className={styles.footer}>
              <button type="button" className={styles.secondary} onClick={() => setScreen("issue")}>
                コード発行
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => setScreen("redeemInput")}
              >
                コード入力
              </button>
            </div>
          </>
        ) : null}

        {screen === "issue" ? (
          issuedCode ? (
            <>
              <p className={styles.description}>
                以下のコードを引き継ぎ先の端末で入力してください。コードの有効期限は発行から24時間です。
              </p>
              <p className={styles.code}>{issuedCode}</p>
              <p className={styles.description}>
                有効期限: {expiresAtFormatter.format(issuedExpiresAt ?? new Date())}
              </p>
              <div className={styles.footer}>
                <button type="button" className={styles.secondary} onClick={handleCopyCode}>
                  {copied ? "コピーしました" : "コードをコピー"}
                </button>
                <button type="button" className={styles.primary} onClick={onClose}>
                  閉じる
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.description}>
                既読・お気に入り・投票・スキップの記録を、24時間だけ有効な引き継ぎコードと引き換えに一時的にサーバーへ保存します。
              </p>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                />
                <span className={styles.checkboxLabel}>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    プライバシーポリシー
                  </a>
                  に同意します
                </span>
              </label>
              {issueError ? (
                <p className={styles.error} role="alert">
                  コード発行に失敗しました。もう一度お試しください。
                </p>
              ) : null}
              <div className={styles.footer}>
                <button type="button" className={styles.secondary} onClick={onClose}>
                  戻る
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={handleIssue}
                  disabled={!agreed || issuing}
                >
                  コード発行
                </button>
              </div>
            </>
          )
        ) : null}

        {screen === "redeemInput" ? (
          <>
            <p className={styles.description}>
              引き継ぎ元の端末で発行した8桁のコードを入力してください。
            </p>
            <input
              type="text"
              className={styles.codeInput}
              value={codeInput}
              onChange={handleCodeInputChange}
              placeholder="XXXXXXXX"
              maxLength={CODE_LENGTH}
              autoComplete="off"
              inputMode="text"
            />
            <div className={styles.footer}>
              <button type="button" className={styles.secondary} onClick={onClose}>
                戻る
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => setScreen("redeemMode")}
                disabled={codeInput.length !== CODE_LENGTH}
              >
                次へ
              </button>
            </div>
          </>
        ) : null}

        {screen === "redeemMode" ? (
          <>
            <p className={styles.description}>
              現在この端末にある記録を、引き継いだデータで「上書き」するか「追記」するか選んでください。
            </p>
            <p className={styles.note}>
              ※ジャンル投票の記録は「上書き」を選んだ場合のみ引き継がれます。
            </p>
            {redeemError ? (
              <p className={styles.error} role="alert">
                {redeemError}
              </p>
            ) : null}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => handleRedeem("merge")}
                disabled={redeeming}
              >
                追記
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => handleRedeem("overwrite")}
                disabled={redeeming}
              >
                上書き
              </button>
            </div>
          </>
        ) : null}

        {screen === "redeemDone" ? (
          <>
            <p className={styles.description}>
              データを引き継ぎました。反映のため、ページを再読み込みします。
            </p>
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => window.location.reload()}
              >
                再読み込み
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
