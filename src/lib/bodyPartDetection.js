const BODY_REGIONS = {
  head: { x: [150, 250], y: [0, 100] },
  face: { x: [160, 240], y: [20, 80] },
  neck: { x: [160, 240], y: [80, 110] },
  leftShoulder: { x: [100, 150], y: [100, 150] },
  rightShoulder: { x: [250, 300], y: [100, 150] },
  leftUpperArm: { x: [80, 150], y: [150, 250] },
  rightUpperArm: { x: [250, 320], y: [150, 250] },
  leftLowerArm: { x: [60, 130], y: [250, 350] },
  rightLowerArm: { x: [270, 340], y: [250, 350] },
  chest: { x: [150, 250], y: [110, 200] },
  abdomen: { x: [150, 250], y: [200, 300] },
  leftHip: { x: [130, 180], y: [300, 350] },
  rightHip: { x: [220, 270], y: [300, 350] },
  leftThigh: { x: [130, 200], y: [350, 450] },
  rightThigh: { x: [200, 270], y: [350, 450] },
  leftKnee: { x: [130, 200], y: [450, 480] },
  rightKnee: { x: [200, 270], y: [450, 480] },
  leftLowerLeg: { x: [130, 200], y: [480, 580] },
  rightLowerLeg: { x: [200, 270], y: [480, 580] },
  leftFoot: { x: [130, 200], y: [580, 600] },
  rightFoot: { x: [200, 270], y: [580, 600] }
};

export function detectBodyPart(point) {
  // Get canvas size from the point's context
  const canvasWidth = point[0].canvas?.width || 400;
  const canvasHeight = point[0].canvas?.height || 600;
  
  // Scale factors
  const scaleX = canvasWidth / 400;
  const scaleY = canvasHeight / 600;

  // Scale the point back to base coordinates
  const normalizedX = point[0].x / scaleX;
  const normalizedY = point[0].y / scaleY;

  let bestMatch = 'unknown';
  let smallestDistance = Infinity;

  for (const [part, region] of Object.entries(BODY_REGIONS)) {
    const regionCenterX = (region.x[0] + region.x[1]) / 2;
    const regionCenterY = (region.y[0] + region.y[1]) / 2;
    
    const distance = Math.sqrt(
      Math.pow(normalizedX - regionCenterX, 2) + 
      Math.pow(normalizedY - regionCenterY, 2)
    );

    const withinBounds = 
      normalizedX >= region.x[0] && 
      normalizedX <= region.x[1] && 
      normalizedY >= region.y[0] && 
      normalizedY <= region.y[1];

    if (withinBounds && distance < smallestDistance) {
      smallestDistance = distance;
      bestMatch = part;
    }
  }

  return bestMatch;
}
