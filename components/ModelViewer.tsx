import React, { useRef, useEffect, useState } from 'react';
import { X, Rotate3D, Layers } from 'lucide-react';

interface ModelViewerProps {
  onExit: () => void;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Simple Jet Model Vertices (x, y, z)
    const vertices = [
      {x: 0, y: 0, z: 200}, // Nose
      {x: 30, y: 0, z: 50}, // Fuselage Width R
      {x: -30, y: 0, z: 50}, // Fuselage Width L
      {x: 0, y: 40, z: 50}, // Cockpit Top
      {x: 0, y: -20, z: 50}, // Bottom
      {x: 120, y: 0, z: -50}, // Wing Tip R
      {x: -120, y: 0, z: -50}, // Wing Tip L
      {x: 0, y: 0, z: -100}, // Tail Base
      {x: 0, y: 60, z: -120}, // Tail Top
      {x: 50, y: 0, z: -120}, // Stabilizer R
      {x: -50, y: 0, z: -120}, // Stabilizer L
    ];

    // Connections between vertices
    const edges = [
        [0, 1], [0, 2], [0, 3], [0, 4], // Nose cone
        [1, 5], [5, 7], [1, 7], // Right Wing
        [2, 6], [6, 7], [2, 7], // Left Wing
        [3, 7], [4, 7], // Fuselage body
        [1, 3], [3, 2], [2, 4], [4, 1], // Mid section ring
        [7, 8], [3, 8], // Vertical Stab
        [7, 9], [7, 10], // Horizontal Stabs
        [5, 6] // Wingtip to wingtip (span)
    ];

    let angleX = 0;
    let angleY = 0;
    
    // Auto rotation
    const autoRotateSpeed = 0.005;

    const render = () => {
      if (!isDragging.current) {
          angleY += autoRotateSpeed;
      } else {
          // Apply manual rotation smoothing
      }
      
      // Use state for manual overrides
      // We will read straight from variables for loop performance
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid Background
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const w = canvas.width;
      const h = canvas.height;
      for (let x = 0; x < w; x+= gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y+= gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      
      ctx.strokeStyle = '#0071E3';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Project 3D points
      const projected = vertices.map(v => {
        // Rotate Y
        let x = v.x * Math.cos(angleY + rotation.y) - v.z * Math.sin(angleY + rotation.y);
        let z = v.z * Math.cos(angleY + rotation.y) + v.x * Math.sin(angleY + rotation.y);
        
        // Rotate X
        let y = v.y * Math.cos(angleX + rotation.x) - z * Math.sin(angleX + rotation.x);
        z = z * Math.cos(angleX + rotation.x) + v.y * Math.sin(angleX + rotation.x);

        // Perspective
        const scale = 400 / (400 - z);
        return {
            x: x * scale,
            y: y * scale
        };
      });

      // Draw Edges
      edges.forEach(([i, j]) => {
          const p1 = projected[i];
          const p2 = projected[j];
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
      });

      // Draw Vertices (Dots)
      ctx.fillStyle = '#60A5FA';
      projected.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
      });

      ctx.restore();
      requestAnimationFrame(render);
    };
    
    const req = requestAnimationFrame(render);
    
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(req);
    };
  }, [rotation]);

  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = (e.clientX - lastMouse.current.x) * 0.01;
      const deltaY = (e.clientY - lastMouse.current.y) * 0.01;
      
      setRotation(prev => ({
          x: prev.x + deltaY,
          y: prev.y + deltaX
      }));
      
      lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      isDragging.current = false;
  };

  return (
    <div 
        className="fixed inset-0 z-50 bg-slate-900 cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block" />
      
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 font-mono text-white pointer-events-none select-none">
        <div className="flex items-center gap-2 text-primary mb-2">
            <Rotate3D className="w-5 h-5 animate-spin-slow" />
            <span className="text-sm font-bold uppercase tracking-widest">Schematic View: F-Concept</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-400 mt-2">
            <div className="flex items-center gap-1"><Layers className="w-3 h-3"/> Vertices: 11</div>
            <div className="flex items-center gap-1">Edges: 20</div>
        </div>
      </div>

      <button 
        onClick={onExit} 
        className="absolute top-6 right-6 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all flex items-center gap-2 font-bold shadow-lg z-50 hover:scale-105"
      >
        <X className="w-5 h-5" /> EXIT
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono uppercase tracking-[0.2em]">
        Click & Drag to Rotate Model
      </div>
    </div>
  );
};

export default ModelViewer;