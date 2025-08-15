import { PoseKeypoint } from "../types/typePoseData";

export function calculateAngle(first: PoseKeypoint, mid: PoseKeypoint, end: PoseKeypoint): number{
  if (!first || !mid || !end) return 180;
  
  // Vectores entre puntos
  const v1 = { x: first.x - mid.x, y: first.y - mid.y };
  const v2 = { x: end.x - mid.x, y: end.y - mid.y };
  
  // Producto punto
  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  
  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  // Ángulo en radianes y luego convertido a grados
  const angle = Math.acos(dotProduct / (mag1 * mag2)) * (180 / Math.PI);
  
  return angle;
};