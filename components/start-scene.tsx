"use client";

import { useEffect, useRef } from "react";

/**
 * Martin's start scene: YOU at the centre of the sun, with the three labelled
 * rings and ripples spreading out. Decorative, so it is hidden from screen
 * readers, and it holds still under prefers-reduced-motion.
 */
const NAMES = ["Already yours", "Within reach", "On the horizon"] as const;
const RIPPLES = 7;

export function StartScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const scene = sceneRef.current;
    const svg = svgRef.current;
    if (!scene || !svg) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const draw = (time: number) => {
      const w = scene.clientWidth;
      const h = scene.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.5;
      const radii = [R * 0.48, R * 0.72, R * 0.96];

      svg.querySelectorAll<SVGCircleElement>(".scene-main").forEach((circle, i) => {
        circle.setAttribute("cx", String(cx));
        circle.setAttribute("cy", String(cy));
        circle.setAttribute("r", String(radii[i]));
      });

      tagRefs.current.forEach((tag, i) => {
        if (!tag) return;
        const angle = -Math.PI / 2 + (i - 1) * 0.55;
        tag.style.left = `${cx + Math.cos(angle) * radii[i]}px`;
        tag.style.top = `${cy + Math.sin(angle) * radii[i]}px`;
      });

      svg.querySelectorAll<SVGCircleElement>(".scene-ripple").forEach((circle, k) => {
        const p = reduced ? (k + 1) / (RIPPLES + 1) : ((time * 0.00006 + k / RIPPLES) % 1);
        circle.setAttribute("cx", String(cx));
        circle.setAttribute("cy", String(cy));
        circle.setAttribute("r", String(p * R * 1.05));
        circle.style.opacity = String(Math.sin(p * Math.PI) * 0.5);
      });

      if (!reduced) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    const onResize = () => draw(0);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className="start-scene relative min-h-[420px] self-stretch"
    >
      <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible">
        {NAMES.map((name) => (
          <circle key={name} className="scene-main" />
        ))}
        {Array.from({ length: RIPPLES }, (_, k) => (
          <circle key={k} className="scene-ripple" />
        ))}
      </svg>

      <div className="start-sun blob" />
      <p className="display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(36px,4vw,56px)] tracking-[0.02em]">
        You
      </p>

      {NAMES.map((name, i) => (
        <div
          key={name}
          ref={(node) => {
            tagRefs.current[i] = node;
          }}
          className="ring-label absolute -translate-x-1/2 -translate-y-1/2"
        >
          {name}
        </div>
      ))}
    </div>
  );
}
