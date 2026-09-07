/**
 * Safe, iframe-friendly Confetti animation utility.
 * Replaces canvas-confetti library to avoid Worker / OffscreenCanvas constructors
 * that throw "TypeError: Illegal constructor" in sandboxed preview iframes.
 */
export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
}

export const fireConfetti = (options: ConfettiOptions = {}) => {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const particleCount = options.particleCount || 100;
    const originX = options.origin?.x ?? 0.5;
    const originY = options.origin?.y ?? 0.6;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    canvas.width = window.innerWidth || 1000;
    canvas.height = window.innerHeight || 800;

    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      return;
    }

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
      opacity: number;
    }> = [];

    const startX = canvas.width * originX;
    const startY = canvas.height * originY;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5);
      const speed = 8 + Math.random() * 12;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.4),
        vy: (Math.sin(angle) * speed - 6) * (0.8 + Math.random() * 0.4),
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      for (const p of particles) {
        if (p.opacity <= 0) continue;
        activeParticles++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // Gravity
        p.vx *= 0.98; // Drag
        p.rotation += p.vRot;

        if (frame > 40) {
          p.opacity -= 0.02;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (activeParticles > 0 && frame < 180) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    };

    render();
  } catch (err) {
    console.warn('Safe confetti execution caught:', err);
  }
};
