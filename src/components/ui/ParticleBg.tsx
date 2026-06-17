import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  speed: number;
}

export default function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    let animId: number;
    let mouseX = 0;
    let mouseY = 0;

    const getAccent = (): { r: number; g: number; b: number } => {
      const root = document.documentElement;
      const color = getComputedStyle(root).getPropertyValue("--accent").trim();
      if (color.startsWith("#")) {
        const hex = color.slice(1);
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
      return { r: 249, g: 115, b: 22 };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 20000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.2 - Math.random() * 0.3,
          size: 2 + Math.random() * 4,
          alpha: 0.2 + Math.random() * 0.4,
          speed: 0.3 + Math.random() * 0.5,
        });
      }
    };

    const draw = () => {
      const { r, g, b } = getAccent();
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Slight attraction to mouse
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 200 && dist > 0) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.02;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.sin(Date.now() * 0.001 + p.x * 0.01) * 0.005);

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.y > h + 20) { p.y = -20; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        // Draw particle
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.5})`;
        ctx!.fill();

        // Draw connections (nearby particles)
        for (const other of particles) {
          if (other === p) continue;
          const dx2 = other.x - p.x;
          const dy2 = other.y - p.y;
          const dist2 = Math.hypot(dx2, dy2);
          if (dist2 < 120) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(other.x, other.y);
            ctx!.strokeStyle = `rgba(${r},${g},${b},${0.08 * (1 - dist2 / 120)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();

    window.addEventListener("resize", () => {
      resize();
      initParticles();
    });
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
