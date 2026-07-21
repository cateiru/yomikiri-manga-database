"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { IoShareOutline } from "react-icons/io5";
import {
  BlueskyIcon,
  BlueskyShareButton,
  HatenaIcon,
  HatenaShareButton,
  LineIcon,
  LineShareButton,
  ThreadsIcon,
  ThreadsShareButton,
  XIcon,
  XShareButton,
} from "react-share";
import styles from "./ShareModal.module.css";

interface ShareModalProps {
  readCount: number;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = 'input, button, [href], [tabindex]:not([tabindex="-1"])';
const ICON_SIZE = 40;

export function ShareModal({ readCount, onClose }: ShareModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const shareUrl = window.location.origin;
  const shareTitle = `読み切り漫画データベースで${readCount}作品の読み切り漫画を読みました！`;

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
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

  const handleNativeShare = () => {
    void navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
  };

  return (
    <div className={styles.overlay}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onKeyDown={trapFocus}
      >
        <p id="share-modal-title" className={styles.title}>
          {readCount}作品読破しました！
        </p>
        <p className={styles.description}>読み切り漫画データベースをシェアしませんか？</p>
        <ul className={styles.shareList}>
          <li>
            <XShareButton url={shareUrl} title={shareTitle} className={styles.shareButton}>
              <XIcon size={ICON_SIZE} round={false} borderRadius={0} />
              <span className={styles.shareLabel}>X</span>
            </XShareButton>
          </li>
          <li>
            <LineShareButton url={shareUrl} title={shareTitle} className={styles.shareButton}>
              <LineIcon size={ICON_SIZE} round={false} borderRadius={0} />
              <span className={styles.shareLabel}>LINE</span>
            </LineShareButton>
          </li>
          <li>
            <ThreadsShareButton url={shareUrl} title={shareTitle} className={styles.shareButton}>
              <ThreadsIcon size={ICON_SIZE} round={false} borderRadius={0} />
              <span className={styles.shareLabel}>Threads</span>
            </ThreadsShareButton>
          </li>
          <li>
            <BlueskyShareButton url={shareUrl} title={shareTitle} className={styles.shareButton}>
              <BlueskyIcon size={ICON_SIZE} round={false} borderRadius={0} />
              <span className={styles.shareLabel}>Bluesky</span>
            </BlueskyShareButton>
          </li>
          <li>
            <HatenaShareButton url={shareUrl} title={shareTitle} className={styles.shareButton}>
              <HatenaIcon size={ICON_SIZE} round={false} borderRadius={0} />
              <span className={styles.shareLabel}>はてブ</span>
            </HatenaShareButton>
          </li>
          {canNativeShare ? (
            <li>
              <button type="button" className={styles.shareButton} onClick={handleNativeShare}>
                <span className={styles.nativeShareIcon}>
                  <IoShareOutline size={24} />
                </span>
                <span className={styles.shareLabel}>その他</span>
              </button>
            </li>
          ) : null}
        </ul>
        <div className={styles.footer}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
