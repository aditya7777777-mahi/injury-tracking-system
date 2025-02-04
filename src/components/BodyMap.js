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

  const drawInjuryPath = (ctx, path, bodyPart) => {
    // Draw the injury outline
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    // Calculate center point
    const centerX = path.reduce((sum, p) => sum + p.x, 0) / path.length;
    const centerY = path.reduce((sum, p) => sum + p.y, 0) / path.length;
    
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

  const drawInjuryMarker = (ctx, x, y, bodyPart) => {
    // Draw circle
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = '/assets/body-map.jpg';
    
    redrawCanvas(ctx, img, injuries);
    
    ctx.beginPath();
    ctx.moveTo(currentPath[0].x, currentPath[0].y);
    currentPath.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      // Calculate center point of the drawn path
      const centerX = currentPath.reduce((sum, p) => sum + p.x, 0) / currentPath.length;
      const centerY = currentPath.reduce((sum, p) => sum + p.y, 0) / currentPath.length;
      
      // Detect body part from the center point
      const bodyPart = detectBodyPart([{ 
        x: centerX, 
        y: centerY,
        canvas: canvasRef.current 
      }]);
      
      // Store only the rectangle coordinates for the detected body part
      const newInjury = {
        id: injuries.length + 1,
        location: JSON.stringify({
          x: centerX,
          y: centerY
        }),
        bodyPart: bodyPart,
        // Keep path only for drawing
        drawPath: currentPath
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
            objectFit: 'contain'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
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
