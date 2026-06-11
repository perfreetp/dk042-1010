export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const checkAABBCollision = (a: Rect, b: Rect): boolean => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

export const checkPointInRect = (px: number, py: number, rect: Rect): boolean => {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
};

export const getRectCenter = (rect: Rect): { x: number; y: number } => {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
};

export const rectDistance = (a: Rect, b: Rect): number => {
  const centerA = getRectCenter(a);
  const centerB = getRectCenter(b);
  return Math.sqrt((centerB.x - centerA.x) ** 2 + (centerB.y - centerA.y) ** 2);
};
