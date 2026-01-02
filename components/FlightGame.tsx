import React, { useRef, useEffect, useState } from 'react';
import { X, Trophy, Wind } from 'lucide-react';

interface FlightGameProps {
  onExit: () => void;
}

const FlightGame: React.FC<FlightGameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const requestRef = useRef<number>(0);
  
  // Game State
  const planePos = useRef({ x: 100, y: 300 });
  const velocity = useRef({ y: 0 });
  const obstacles = useRef<{x: number, y: number, w: number, h: number, type: 'cloud' | 'coin'}[]>([]);
  const particles = useRef<{x: number, y: number, speed: number, size: number}[]>([]);
  const gameSpeed = useRef(5);

  const spawnObstacle = (canvasWidth: number, canvasHeight: number) => {
    const type = Math.random() > 0.7 ? 'coin' : 'cloud';
    const size = type === 'coin' ? 30 : Math.random() * 60 + 40;
    obstacles.current.push({
      x: canvasWidth + 100,
      y: Math.random() * (canvasHeight - 100) + 50,
      w: size,
      h: size,
      type
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Controls
    const handleMouseMove = (e: MouseEvent) => {
      // Smooth follow
      const targetY = e.clientY;
      velocity.current.y = (targetY - planePos.current.y) * 0.1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initial stars/particles
    for (let i = 0; i < 50; i++) {
        particles.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 5 + 1,
            size: Math.random() * 2 + 1
        });
    }

    let frameCount = 0;

    const animate = () => {
      if (gameOver) return;

      frameCount++;
      // Clear
      ctx.fillStyle = '#1a1a1a'; // Dark sky
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient Sky
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw/Update Particles (Stars/Wind)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      particles.current.forEach(p => {
        p.x -= p.speed;
        if (p.x < 0) p.x = canvas.width;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update Plane
      planePos.current.y += velocity.current.y;
      
      // Draw Plane (Triangle)
      ctx.save();
      ctx.translate(planePos.current.x, planePos.current.y);
      // Tilt based on velocity
      ctx.rotate(Math.min(Math.max(velocity.current.y * 0.05, -0.5), 0.5));
      
      // Fuselage
      ctx.beginPath();
      ctx.fillStyle = '#0071E3';
      ctx.moveTo(20, 0);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-10, -10);
      ctx.fill();
      
      // Wings
      ctx.beginPath();
      ctx.fillStyle = '#60A5FA';
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 20);
      ctx.lineTo(-5, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, -20);
      ctx.lineTo(-5, 0);
      ctx.fill();

      // Engine Trail
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 100, 50, 0.6)';
      ctx.lineWidth = 2;
      ctx.moveTo(-12, 0);
      ctx.lineTo(-30 - Math.random() * 20, 0);
      ctx.stroke();

      ctx.restore();

      // Spawn Obstacles
      if (frameCount % 60 === 0) spawnObstacle(canvas.width, canvas.height);

      // Update/Draw Obstacles
      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        const obs = obstacles.current[i];
        obs.x -= gameSpeed.current;

        // Collision Check
        const dist = Math.hypot(planePos.current.x - obs.x, planePos.current.y - obs.y);
        
        if (obs.type === 'coin') {
            // Draw Coin
            ctx.beginPath();
            ctx.fillStyle = '#FBBF24'; // Amber
            ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Text effect
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText('DATA', obs.x - 12, obs.y - 15);

            if (dist < 30) {
                setScore(s => s + 100);
                obstacles.current.splice(i, 1);
            }
        } else {
            // Draw Cloud (Obstacle)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.w / 2, 0, Math.PI * 2);
            ctx.fill();
            // Danger indicator
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (dist < obs.w / 2 + 10) {
                setGameOver(true);
            }
        }

        if (obs.x < -100) obstacles.current.splice(i, 1);
      }

      gameSpeed.current += 0.001; // Accelerate slowly
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', handleMouseMove);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameOver]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      <canvas ref={canvasRef} className="block cursor-none" />
      
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 font-mono text-white pointer-events-none select-none">
        <div className="flex items-center gap-2 text-primary mb-2">
            <Wind className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">Flight Simulation Active</span>
        </div>
        <div className="text-4xl font-bold">{score.toString().padStart(6, '0')}</div>
        <div className="text-xs text-gray-400 mt-1">PKT CAPTURE</div>
      </div>

      <button 
        onClick={onExit} 
        className="absolute top-6 right-6 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all flex items-center gap-2 font-bold shadow-lg z-50 hover:scale-105"
      >
        <X className="w-5 h-5" /> EXIT SIMULATION
      </button>

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white text-contrast p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-takeoff" style={{ animationName: 'land' }}>
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Simulation Ended</h2>
                <p className="text-secondary mb-6 font-mono">Final Score: {score}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => { 
                        setGameOver(false); 
                        setScore(0); 
                        planePos.current = { x: 100, y: 300 };
                        obstacles.current = [];
                        gameSpeed.current = 5;
                    }} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors">
                        Reboot System
                    </button>
                    <button onClick={onExit} className="px-6 py-3 bg-gray-100 text-contrast rounded-xl font-bold hover:bg-gray-200 transition-colors">
                        Exit
                    </button>
                </div>
            </div>
        </div>
      )}
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono uppercase tracking-[0.2em]">
        Mouse to navigate &middot; Avoid Clouds &middot; Collect Data
      </div>
    </div>
  );
};

export default FlightGame;