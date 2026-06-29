"use client";

import { useEffect, useRef } from "react";

type VortexParticle = {
  angle: number;
  distance: number;
  speed: number;
  radius: number;
  wobble: number;
  hue: number;
  alpha: number;
};

type VortexBackgroundProps = {
  className?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
};

export function VortexBackground({
  className = "",
  particleCount = 700,
  rangeY = 100,
  baseHue = 6,
  baseSpeed = 0,
  rangeSpeed = 1.5,
  baseRadius = 1,
  rangeRadius = 2,
  backgroundColor = "#050505",
}: VortexBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<VortexParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;
    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };
    mediaQuery.addEventListener("change", handleReducedMotionChange);

    const createParticles = (width: number, height: number) => {
      const maxRadius = Math.min(width, height) * 0.48;
      const currentHue = baseHue;

      particlesRef.current = Array.from({ length: particleCount }, () => {
        const distance = Math.pow(Math.random(), 0.58) * maxRadius;
        return {
          angle: Math.random() * Math.PI * 2,
          distance,
          speed: (baseSpeed + Math.random() * rangeSpeed) * (Math.random() > 0.5 ? 1 : -1),
          radius: baseRadius + Math.random() * rangeRadius,
          wobble: Math.random() * Math.PI * 2,
          hue: currentHue + (Math.random() * 14 - 7),
          alpha: 0.1 + Math.random() * 0.6,
        };
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const { width, height } = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { width, height, dpr };
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles(width, height);
    };

    const draw = (time: number) => {
      const { width, height } = sizeRef.current;
      if (!width || !height) {
        animationFrameRef.current = window.requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.38;
      const particles = particlesRef.current;

      const bgGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6);
      bgGlow.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      bgGlow.addColorStop(0.16, "rgba(225, 6, 0, 0.1)");
      bgGlow.addColorStop(0.38, "rgba(225, 6, 0, 0.04)");
      bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = bgGlow;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = "lighter";

      for (const particle of particles) {
        const speed = particle.speed * 0.0006;
        const angle = particle.angle + time * speed;
        const sway = Math.sin(angle * 1.8 + particle.wobble) * rangeY * 0.15;
        const orbit = particle.distance + Math.sin(angle * 2.2 + particle.wobble) * rangeY * 0.34;
        const x = centerX + Math.cos(angle) * orbit;
        const y = centerY + Math.sin(angle * 0.72 + particle.wobble) * rangeY * 0.8 + sway;
        const radius = particle.radius;
        const alpha = particle.alpha * (0.6 + (1 - particle.distance / Math.max(width, height)) * 0.7);

        context.beginPath();
        context.fillStyle = `hsla(${particle.hue}, 100%, ${particle.distance < width * 0.18 ? 70 : 62}%, ${alpha})`;
        context.shadowBlur = 10;
        context.shadowColor = `hsla(${particle.hue}, 100%, 60%, ${alpha})`;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        if (particle.distance < Math.min(width, height) * 0.22) {
          context.beginPath();
          context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
          context.arc(x, y, radius * 0.58, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.restore();

      const coreGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.28);
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.18)");
      coreGradient.addColorStop(0.18, "rgba(255, 255, 255, 0.06)");
      coreGradient.addColorStop(0.42, "rgba(225, 6, 0, 0.08)");
      coreGradient.addColorStop(0.7, "rgba(0, 0, 0, 0)");
      context.fillStyle = coreGradient;
      context.fillRect(0, 0, width, height);

      animationFrameRef.current = window.requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement ?? canvas);
    animationFrameRef.current = window.requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleReducedMotionChange);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [backgroundColor, baseHue, baseRadius, baseSpeed, particleCount, rangeRadius, rangeSpeed, rangeY]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas
        aria-hidden="true"
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
