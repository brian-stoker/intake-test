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
      autoplay: false,
      path: "/ai-guys-animation.json",
    });

    // The animation fades in then fades back out over its full length.
    // Play only the first half so it lands fully revealed and holds there.
    anim.addEventListener("DOMLoaded", () => {
      const mid = Math.round(anim.totalFrames / 2);
      anim.playSegments([0, mid], true);
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
