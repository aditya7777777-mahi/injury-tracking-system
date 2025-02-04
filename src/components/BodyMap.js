'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Space, Card } from 'antd';
import dynamic from 'next/dynamic';
import { detectBodyPart } from '@/lib/bodyPartDetection';

const BodyMap = ({ onChange, initialInjuries = [] }) => {
  const [injuries, setInjuries] = useState(initialInjuries);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const getCanvasSize = () => {
    const width = window.innerWidth;
    if (width < 768) { // mobile
      return { width: 300, height: 450 };
    } else if (width < 1024) { // tablet/laptop
      return { width: 400, height: 600 };
    } else { // desktop
      return { width: 500, height: 750 };
    }
  };

  const [canvasSize, setCanvasSize] = useState(getCanvasSize());

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize(getCanvasSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Load the image and draw the initial injuries
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/body-map.jpg'; 
    imageRef.current = img;
    
    img.onload = () => {
      setIsCanvasReady(true);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        redrawCanvas(ctx, img, injuries);
      }
    };
  }, [canvasSize]);

  useEffect(() => {
    if (!isCanvasReady || !canvasRef.current || !imageRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    redrawCanvas(ctx, imageRef.current, injuries);
  }, [injuries, isCanvasReady]);

  // Add these helper functions
  const normalizeCoordinates = (x, y, canvas) => {
    return {
      x: x / canvas.width,
      y: y / canvas.height
    };
  };

  const denormalizeCoordinates = (normalizedX, normalizedY, canvas) => {
    return {
      x: normalizedX * canvas.width,
      y: normalizedY * canvas.height
    };
  };

  // Update the redrawCanvas function to handle normalized coordinates
  const redrawCanvas = (ctx, img, injuries) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    
    injuries.forEach((injury) => {
      if (injury.drawPath) {
        drawInjuryPath(ctx, injury.drawPath, injury.bodyPart);
      } else {
        const location = JSON.parse(injury.location);
        drawInjuryMarker(ctx, location.x, location.y, injury.bodyPart);
      }
    });
  };

  // Update drawInjuryPath function
  const drawInjuryPath = (ctx, path, bodyPart) => {
    // Transform the stored normalized coordinates back to canvas coordinates
    const denormalizedPath = path.map(point => 
      denormalizeCoordinates(point.normalizedX, point.normalizedY, ctx.canvas)
    );

    ctx.beginPath();
    ctx.moveTo(denormalizedPath[0].x, denormalizedPath[0].y);
    denormalizedPath.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    // Calculate center point using denormalized coordinates
    const centerX = denormalizedPath.reduce((sum, p) => sum + p.x, 0) / denormalizedPath.length;
    const centerY = denormalizedPath.reduce((sum, p) => sum + p.y, 0) / denormalizedPath.length;
    
    // Draw label background
    const labelWidth = ctx.measureText(bodyPart).width + 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(centerX - labelWidth/2, centerY - 10, labelWidth, 20);
    
    // Draw text
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bodyPart, centerX, centerY);
  };

  // Update drawInjuryMarker function
  const drawInjuryMarker = (ctx, normalizedX, normalizedY, bodyPart) => {
    const { x, y } = denormalizeCoordinates(normalizedX, normalizedY, ctx.canvas);
    
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    
    // Draw label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const labelWidth = ctx.measureText(bodyPart).width + 10;
    ctx.fillRect(x - labelWidth/2, y - 20, labelWidth, 20);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(bodyPart, x, y - 5);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get proper coordinates for both touch and mouse events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate scale factors based on canvas's display size vs actual size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate coordinates with proper scaling
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const handleMouseMove = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (!isDrawing) return;
    
    const coords = getCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    redrawCanvas(ctx, imageRef.current, injuries);
    
    // Draw current path
    ctx.beginPath();
    ctx.moveTo(currentPath[0].x, currentPath[0].y);
    currentPath.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
  };

  // Update handleMouseUp function
  const handleMouseUp = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      const canvas = canvasRef.current;
      
      // Normalize the path coordinates
      const normalizedPath = currentPath.map(point => {
        const normalized = normalizeCoordinates(point.x, point.y, canvas);
        return {
          ...point,
          normalizedX: normalized.x,
          normalizedY: normalized.y
        };
      });

      // Calculate center point using normalized coordinates
      const centerX = normalizedPath.reduce((sum, p) => sum + p.normalizedX, 0) / normalizedPath.length;
      const centerY = normalizedPath.reduce((sum, p) => sum + p.normalizedY, 0) / normalizedPath.length;
      
      const bodyPart = detectBodyPart([{ 
        x: centerX * canvas.width, // Convert back to pixels for detection
        y: centerY * canvas.height,
        canvas: canvas 
      }]);
      
      const newInjury = {
        id: injuries.length + 1,
        location: JSON.stringify({
          x: centerX, // Store normalized coordinates
          y: centerY
        }),
        bodyPart: bodyPart,
        drawPath: normalizedPath // Store normalized path
      };
      
      const newInjuries = [...injuries, newInjury];
      setInjuries(newInjuries);
      onChange(newInjuries.map(({ id, location, bodyPart }) => ({
        id,
        location,
        bodyPart
      })));
    }
    setCurrentPath([]);
  };

  const handleUndo = () => {
    const newInjuries = injuries.slice(0, -1);
    setInjuries(newInjuries);
    onChange(newInjuries);
  };

  const handleClear = () => {
    setInjuries([]);
    onChange([]);
  };

  if (!isCanvasReady) {
    return <div className="loading">Loading body map...</div>;
  }

  return (
    <Card className="w-full">
      <div className="relative flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ 
            border: '1px solid #ccc',
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            touchAction: 'none' // Prevent default touch actions
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onTouchCancel={handleMouseUp}
        />
      </div>
      <Space className="mt-4 w-full justify-center">
        <Button onClick={handleUndo} disabled={injuries.length === 0}>
          Undo
        </Button>
        <Button onClick={handleClear} disabled={injuries.length === 0}>
          Clear
        </Button>
      </Space>
    </Card>
  );
};

// Export as client-only component
export default dynamic(() => Promise.resolve(BodyMap), {
  ssr: false,
});
