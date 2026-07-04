import Image from "next/image";

import { cn } from "@/shared/lib/cn";

import styles from "./BrandLogo.module.css";

type BrandLogoProps = {
  className?: string | undefined;
  priority?: boolean;
  showText?: boolean;
  size?: "lg" | "md" | "sm" | "xs";
  sublabel?: string | undefined;
};

export function BrandLogo({
  className,
  priority = false,
  showText = true,
  size = "md",
  sublabel,
}: BrandLogoProps) {
  return (
    <span className={cn(styles.root, className)} data-size={size} data-text={showText}>
      <span className={styles.mark} aria-hidden="true">
        <Image
          alt=""
          height={1254}
          priority={priority}
          sizes="52px"
          src="/assets/brand/rounddate-logo.png"
          width={1254}
        />
      </span>
      {showText ? (
        <span className={styles.copy}>
          <strong>RoundDate</strong>
          {sublabel ? <small>{sublabel}</small> : null}
        </span>
      ) : null}
    </span>
  );
}
