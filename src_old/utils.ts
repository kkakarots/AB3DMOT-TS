// 工具函数

import { BoundingBox3D } from './types'

/**
 * 计算两个3D边界框的IoU
 * @param bbox1 第一个边界框
 * @param bbox2 第二个边界框
 * @returns IoU值 (0-1)
 */
export function calculate3DIoU(bbox1: BoundingBox3D, bbox2: BoundingBox3D): number {
  // 计算交集体积
  const intersection = calculateIntersection3D(bbox1, bbox2)
  
  // 计算并集体积
  const volume1 = bbox1.width * bbox1.height * bbox1.length
  const volume2 = bbox2.width * bbox2.height * bbox2.length
  const union = volume1 + volume2 - intersection
  
  return union > 0 ? intersection / union : 0
}

/**
 * 计算两个3D边界框的交集体积
 * @param bbox1 第一个边界框
 * @param bbox2 第二个边界框
 * @returns 交集体积
 */
function calculateIntersection3D(bbox1: BoundingBox3D, bbox2: BoundingBox3D): number {
  // 简化的轴对齐边界框交集计算
  // 注意：这里没有考虑旋转，实际应用中需要更复杂的计算
  
  const x1Min = bbox1.x - bbox1.width / 2
  const x1Max = bbox1.x + bbox1.width / 2
  const y1Min = bbox1.y - bbox1.height / 2
  const y1Max = bbox1.y + bbox1.height / 2
  const z1Min = bbox1.z - bbox1.length / 2
  const z1Max = bbox1.z + bbox1.length / 2
  
  const x2Min = bbox2.x - bbox2.width / 2
  const x2Max = bbox2.x + bbox2.width / 2
  const y2Min = bbox2.y - bbox2.height / 2
  const y2Max = bbox2.y + bbox2.height / 2
  const z2Min = bbox2.z - bbox2.length / 2
  const z2Max = bbox2.z + bbox2.length / 2
  
  const xOverlap = Math.max(0, Math.min(x1Max, x2Max) - Math.max(x1Min, x2Min))
  const yOverlap = Math.max(0, Math.min(y1Max, y2Max) - Math.max(y1Min, y2Min))
  const zOverlap = Math.max(0, Math.min(z1Max, z2Max) - Math.max(z1Min, z2Min))
  
  return xOverlap * yOverlap * zOverlap
}

/**
 * 计算两个3D点之间的距离
 * @param p1 第一个点 [x, y, z]
 * @param p2 第二个点 [x, y, z]
 * @returns 欧几里得距离
 */
export function calculateDistance3D(p1: [number, number, number], p2: [number, number, number]): number {
  const dx = p1[0] - p2[0]
  const dy = p1[1] - p2[1]
  const dz = p1[2] - p2[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * 计算边界框中心点
 * @param bbox 3D边界框
 * @returns 中心点坐标 [x, y, z]
 */
export function getBoundingBoxCenter(bbox: BoundingBox3D): [number, number, number] {
  return [bbox.x, bbox.y, bbox.z]
}

/**
 * 计算边界框体积
 * @param bbox 3D边界框
 * @returns 体积
 */
export function getBoundingBoxVolume(bbox: BoundingBox3D): number {
  return bbox.width * bbox.height * bbox.length
}

/**
 * 检查两个边界框是否重叠
 * @param bbox1 第一个边界框
 * @param bbox2 第二个边界框
 * @param threshold IoU阈值
 * @returns 是否重叠
 */
export function isOverlapping(bbox1: BoundingBox3D, bbox2: BoundingBox3D, threshold: number = 0.1): boolean {
  return calculate3DIoU(bbox1, bbox2) > threshold
}
