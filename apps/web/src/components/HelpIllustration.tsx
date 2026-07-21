import type { ReactNode } from "react";
import styles from "./HelpIllustration.module.css";

type HelpIllustrationVariant = "browse" | "filter" | "read" | "favorite" | "about";

interface HelpIllustrationProps {
  variant: HelpIllustrationVariant;
}

const ICONS: Record<HelpIllustrationVariant, { viewBox: string; content: ReactNode }> = {
  browse: {
    viewBox: "0 0 64 64",
    content: (
      <>
        <rect x="14" y="6" width="36" height="40" stroke="currentColor" strokeWidth="3" />
        <rect
          x="17.5"
          y="9.5"
          width="29"
          height="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="var(--color-ink-5)"
        />
        <path d="M14 33h36" stroke="currentColor" strokeWidth="2" />
        <path d="M20 38h14M20 42h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M24 54l8 7 8-7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  filter: {
    viewBox: "0 0 64 64",
    content: (
      <>
        <rect x="4" y="25" width="17" height="15" stroke="currentColor" strokeWidth="2.5" />
        <rect
          x="24"
          y="25"
          width="17"
          height="15"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M28 32.5l3 3 6-6"
          stroke="var(--color-bg)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="44" y="25" width="17" height="15" stroke="currentColor" strokeWidth="2.5" />
      </>
    ),
  },
  read: {
    viewBox: "0 0 64 64",
    content: (
      <>
        <rect x="12" y="6" width="36" height="40" stroke="currentColor" strokeWidth="3" />
        <rect
          x="15.5"
          y="9.5"
          width="29"
          height="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="var(--color-ink-15)"
        />
        <path d="M12 33h36" stroke="currentColor" strokeWidth="2" />
        <path d="M18 38h14M18 42h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle
          cx="46"
          cy="42"
          r="12"
          fill="var(--color-bg)"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M40.5 42.5l4 4 8-8.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  favorite: {
    viewBox: "0 0 24 24",
    content: (
      <path
        d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.7z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  about: {
    viewBox: "0 0 64 64",
    content: (
      <>
        <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="3" />
        <path d="M32 28v17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="32" cy="19" r="3" fill="currentColor" />
      </>
    ),
  },
};

export function HelpIllustration({ variant }: HelpIllustrationProps) {
  const icon = ICONS[variant];

  return (
    <div className={styles.panel} aria-hidden="true">
      <svg className={styles.icon} viewBox={icon.viewBox} fill="none" role="img" aria-hidden="true">
        {icon.content}
      </svg>
    </div>
  );
}
