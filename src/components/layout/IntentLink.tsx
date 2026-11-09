"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

// Do not download every navigation destination on a narrow/slow connection.
// Keep Next's prefetch when the student indicates intent with pointer or keyboard.
export default function IntentLink({
  onMouseEnter,
  onFocus,
  prefetch,
  ...props
}: ComponentProps<typeof NextLink>) {
  const [intended, setIntended] = useState(false);
  return (
    <NextLink
      {...props}
      prefetch={prefetch ?? (intended ? null : false)}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        setIntended(true);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setIntended(true);
      }}
    />
  );
}
