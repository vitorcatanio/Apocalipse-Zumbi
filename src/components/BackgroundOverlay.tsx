import React, { useEffect, useRef } from 'react';

export const BackgroundOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class for ash/smoke/spores
    interface Spore {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      alphaSpeed: number;
      color: string;
    }

    const spores: Spore[] = [];
    const sporeCount = 45;

    for (let i = 0; i < sporeCount; i++) {
      spores.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        speedX: Math.random() * 0.4 - 0.2,
        speedY: Math.random() * 0.6 - 0.9, // float upwards mostly
        alpha: Math.random() * 0.5 + 0.1,
        alphaSpeed: Math.random() * 0.01 + 0.002,
        color: Math.random() > 0.8 ? 'rgba(255, 51, 51, ' : 'rgba(0, 255, 102, ', // green with occasional red danger spore
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Radar scanner lines
    let radarAngle = 0;

    const drawGrid = (context: CanvasRenderingContext2D) => {
      context.strokeStyle = 'rgba(0, 255, 102, 0.025)';
      context.lineWidth = 1;

      // Draw grid lines
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      // Add small tactical crosshairs in corners
      const borderSize = 30;
      const margin = 20;
      
      context.strokeStyle = 'rgba(0, 255, 102, 0.15)';
      context.lineWidth = 1.5;

      // Top Left Corner
      context.beginPath();
      context.moveTo(margin, margin + borderSize);
      context.lineTo(margin, margin);
      context.lineTo(margin + borderSize, margin);
      context.stroke();

      // Top Right Corner
      context.beginPath();
      context.moveTo(width - margin - borderSize, margin);
      context.lineTo(width - margin, margin);
      context.lineTo(width - margin, margin + borderSize);
      context.stroke();

      // Bottom Left Corner
      context.beginPath();
      context.moveTo(margin, height - margin - borderSize);
      context.lineTo(margin, height - margin);
      context.lineTo(margin + borderSize, height - margin);
      context.stroke();

      // Bottom Right Corner
      context.beginPath();
      context.moveTo(width - margin - borderSize, height - margin);
      context.lineTo(width - margin, height - margin);
      context.lineTo(width - margin, height - margin - borderSize);
      context.stroke();
    };

    const drawRadarSweep = (context: CanvasRenderingContext2D) => {
      // Semi-transparent radar source in top right or center
      const centerX = width * 0.85;
      const centerY = 120;
      const radius = 180;

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(0, 255, 102, 0.04)';
      context.stroke();

      // Sweep line
      context.beginPath();
      context.moveTo(centerX, centerY);
      const sweepX = centerX + Math.cos(radarAngle) * radius;
      const sweepY = centerY + Math.sin(radarAngle) * radius;
      context.lineTo(sweepX, sweepY);
      context.strokeStyle = 'rgba(0, 255, 102, 0.1)';
      context.stroke();

      // Overlay radar rings
      context.beginPath();
      context.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      context.stroke();

      context.restore();
      radarAngle += 0.005;
    };

    const render = () => {
      // Clear with dark terminal color
      ctx.fillStyle = '#050806';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw sci-fi green/red atmospheric grid background
      drawGrid(ctx);
      drawRadarSweep(ctx);

      // 2. Draw spores/smoke particles
      spores.forEach((spore) => {
        spore.x += spore.speedX;
        spore.y += spore.speedY;

        // Wrap around borders
        if (spore.x < 0) spore.x = width;
        if (spore.x > width) spore.x = 0;
        if (spore.y < 0) spore.y = height;
        if (spore.y > height) spore.y = height;

        // Oscillate alpha
        spore.alpha += spore.alphaSpeed;
        if (spore.alpha > 0.6 || spore.alpha < 0.1) {
          spore.alphaSpeed = -spore.alphaSpeed;
        }

        // Clip alpha safety
        const currentAlpha = Math.max(0.01, Math.min(0.6, spore.alpha));

        ctx.beginPath();
        ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2);
        ctx.fillStyle = `${spore.color}${currentAlpha.toFixed(2)})`;
        // Soft outer glow for red spores
        if (spore.color.includes('255, 51')) {
          ctx.shadowColor = '#ff3333';
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      });

      // Reset shadow blur
      ctx.shadowBlur = 0;

      // 3. Draw ambient static scanlines
      ctx.fillStyle = 'rgba(0, 255, 102, 0.005)';
      for (let i = 0; i < height; i += 6) {
        ctx.fillRect(0, i, width, 1.5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="block w-full h-full opacity-70" />
      <div className="absolute inset-0 crt-overlay opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/90 pointer-events-none" />
    </div>
  );
};
