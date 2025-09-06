
'use client';
import React, { useEffect, useRef, useState } from 'react';

const Sparkles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const sparkles: { x: number; y: number; size: number; speed: number, opacity: number, shape: 'circle' | 'star' }[] = [];
    const sparkleCount = 100;

    const createSparkles = () => {
      for (let i = 0; i < sparkleCount; i++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1, // Increased size
          speed: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.5 + 0.4, // Increased opacity
          shape: Math.random() > 0.5 ? 'star' : 'circle',
        });
      }
    };
    
    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius)
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y)
            rot += step

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y)
            rot += step
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }

    const drawSparkles = () => {
      ctx.clearRect(0, 0, width, height);
      sparkles.forEach(sparkle => {
        ctx.fillStyle = `hsla(39, 80%, 53%, ${sparkle.opacity})`;
        
        if (sparkle.shape === 'star') {
            drawStar(sparkle.x, sparkle.y, 4, sparkle.size * 2, sparkle.size);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
            ctx.fill();
        }
      });
      updateSparkles();
    };

    const updateSparkles = () => {
      sparkles.forEach(sparkle => {
        sparkle.y -= sparkle.speed;
        if (sparkle.y < 0) {
          sparkle.y = height;
          sparkle.x = Math.random() * width;
        }
      });
    };
    
    createSparkles();
    const animationFrame = setInterval(drawSparkles, 50);

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        sparkles.length = 0;
        createSparkles();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div className="sparkle-container">
        <canvas ref={canvasRef} />
    </div>
  );
};

export default Sparkles;
