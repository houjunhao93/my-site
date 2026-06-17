import { useEffect, useRef, useCallback } from "react";

interface Stamp {
  x: number;
  y: number;
  born: number;
  seed: number;
  rmax: number;
  color: string;
}

export default function InkReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampsRef = useRef<Stamp[]>([]);
  const runningRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const dimsRef = useRef({ w: 0, h: 0 });
  const inkColorRef = useRef("rgba(249,115,22,0.5)");

  const getInkColor = useCallback(() => {
    const root = document.documentElement;
    const color = getComputedStyle(root).getPropertyValue("--ink-color").trim();
    return color || "#f97316";
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    dimsRef.current = { w, h };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const addStamp = useCallback((x: number, y: number) => {
    const stamps = stampsRef.current;
    if (stamps.length >= 200) stamps.shift();

    const hex = getInkColor();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    stamps.push({
      x,
      y,
      born: performance.now(),
      seed: Math.random() * Math.PI * 2,
      rmax: 60 + Math.random() * 40,
      color: `${r},${g},${b}`,
    });
  }, [getInkColor]);

  const stampAlong = useCallback(
    (x: number, y: number) => {
      const last = lastPosRef.current;
      if (!last) {
        addStamp(x, y);
      } else {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / 12));
        for (let i = 1; i <= steps; i++) {
          addStamp(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
        }
      }
      lastPosRef.current = { x, y };
    },
    [addStamp]
  );

  const drawStamp = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      seed: number,
      color: string,
      alpha: number
    ) => {
      const segments = 24;
      const wobble = [0.12, 0.06, 0.04];

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const wob =
          0.82 +
          wobble[0] * Math.sin(a * 3 + seed) +
          wobble[1] * Math.sin(a * 5 + seed * 2.1) +
          wobble[2] * Math.sin(a * 7 + seed * 0.7);
        const px = x + Math.cos(a) * r * wob;
        const py = y + Math.sin(a) * r * wob;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${color},${alpha * 0.6})`;
      ctx.fill();

      // Inner glow
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.5);
      g.addColorStop(0, `rgba(${color},${alpha * 0.3})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = dimsRef.current;
    const now = performance.now();
    const stamps = stampsRef.current;
    const lifetime = 800;

    ctx.clearRect(0, 0, w, h);

    for (let i = stamps.length - 1; i >= 0; i--) {
      const t = (now - stamps[i].born) / lifetime;
      if (t >= 1) {
        stamps.splice(i, 1);
        continue;
      }
      const ease = 1 - Math.pow(1 - t, 3);
      const r = 5 + (stamps[i].rmax - 5) * ease;
      const alpha = 1 - t * t;
      drawStamp(ctx, stamps[i].x, stamps[i].y, r, stamps[i].seed, stamps[i].color, alpha);
    }

    if (stamps.length) {
      requestAnimationFrame(loop);
    } else {
      runningRef.current = false;
    }
  }, [drawStamp]);

  const startLoop = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true;
      requestAnimationFrame(loop);
    }
  }, [loop]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  useEffect(() => {
    // Update ink color when theme changes
    const observer = new MutationObserver(() => {
      inkColorRef.current = getInkColor();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [getInkColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
      onMouseMove={(e) => {
        stampAlong(e.clientX, e.clientY);
        startLoop();
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) {
          stampAlong(touch.clientX, touch.clientY);
          startLoop();
        }
      }}
    />
  );
}
