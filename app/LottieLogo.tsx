"use client";

import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

export function LottieLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const anim: AnimationItem = lottie.loadAnimation({
      container: ref.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: "/ai-guys-animation.json",
    });
    return () => anim.destroy();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      role="img"
      aria-label="A.I. Guys animated logo"
    />
  );
}
