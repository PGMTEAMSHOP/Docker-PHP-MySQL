'use client';

import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 32;

export function FloatingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function createParticle() {
      const colors = [
        'rgba(14, 165, 233, 0.22)',   // electric sky blue
        'rgba(56, 189, 248, 0.20)',   // cyan neon
        'rgba(2, 132, 199, 0.16)',    // royal blue
        'rgba(125, 211, 252, 0.14)',  // soft ice blue
      ];
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 1,
        dx: (Math.random() - 0.5) * 0.25,
        dy: -(Math.random() * 0.18 + 0.04),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random() * 250 + 120,
        maxLife: 0,
      };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = createParticle();
      p.maxLife = p.life;
      particles.push(p);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        const fadeIn = Math.min((p.maxLife - p.life) / 40, 1);
        const fadeOut = Math.min(p.life / 40, 1);
        const alpha = Math.max(0, Math.min(fadeIn, fadeOut));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[i] = createParticle();
          particles[i].maxLife = particles[i].life;
          particles[i].y = canvas.height + 10;
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    function onVisChange() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        draw();
      }
    }
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return <canvas ref={canvasRef} id="particles-canvas" />;
}
