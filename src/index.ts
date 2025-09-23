// AB3DMOT TypeScript 实现
// 3D多目标跟踪算法
import { BoundingBox3D, Detection, Track } from './types'
import { calculate3DIoU as calculateIoUUtil } from './utils'

export interface TrackedDetection extends Detection {
  trackId: number
}

export class AB3DMOTTracker {
  private tracks: Track[] = []
  private nextTrackId = 1
  private maxAge = 3
  private minHits = 3
  private iouThreshold = 0.3
  private frames: Detection[][] = []

  constructor(options?: {
    maxAge?: number
    minHits?: number
    iouThreshold?: number
    data?: Detection[][]
  }) {
    if (options) {
      this.maxAge = options.maxAge ?? this.maxAge
      this.minHits = options.minHits ?? this.minHits
      this.iouThreshold = options.iouThreshold ?? this.iouThreshold
      if (options.data) this.frames = options.data
    }
  }

  setData(frames: Detection[][]): void {
    this.frames = frames
  }

  /**
   * 更新跟踪器，处理新的检测结果
   * @param detections 当前帧的检测结果
   * @returns 更新后的轨迹列表
   */
  update(detections: Detection[]): Track[] {
    // 1. 预测现有轨迹
    this.predictTracks()

    // 2. 数据关联（匈牙利算法）
    const assignments = this.associateDetections(detections)

    // 3. 更新轨迹
    this.updateTracks(detections, assignments)

    // 4. 创建新轨迹
    this.createNewTracks(detections, assignments)

    // 5. 删除旧轨迹
    this.deleteOldTracks()

    return this.tracks.filter(track => track.hits >= this.minHits)
  }

  /**
   * 单步处理：返回当前帧的带 trackId 的检测结果
   */
  step(detections: Detection[]): TrackedDetection[] {
    // 1. 预测
    this.predictTracks()

    // 2. 关联
    const assignments = this.associateDetections(detections)

    // 3. 更新匹配的轨迹
    this.updateTracks(detections, assignments)

    // 4. 为未匹配的检测创建新轨迹，并拿到新轨迹ID映射
    const newTrackMap = this.createNewTracks(detections, assignments)

    // 5. 删除过期轨迹
    this.deleteOldTracks()

    // 6. 组装输出：为每个检测找到对应的trackId
    const result: TrackedDetection[] = []
    for (let i = 0; i < detections.length; i++) {
      const assignedTrackIndex = assignments[i]
      if (assignedTrackIndex !== -1) {
        const trackId = this.tracks[assignedTrackIndex]?.id
        if (trackId != null) {
          result.push({ ...detections[i], trackId })
          continue
        }
      }
      const createdId = newTrackMap.get(i)
      if (createdId != null) {
        result.push({ ...detections[i], trackId: createdId })
      }
    }
    return result
  }

  /**
   * 批处理：对所有帧运行追踪，返回每帧的带 trackId 的结果
   */
  run(): TrackedDetection[][] {
    const outputs: TrackedDetection[][] = []
    for (const detections of this.frames) {
      const frameOutput = this.step(detections)
      outputs.push(frameOutput)
    }
    return outputs
  }

  private predictTracks(): void {
    // 使用卡尔曼滤波器预测轨迹位置
    this.tracks.forEach(track => {
      track.age++
      track.timeSinceUpdate++
      // TODO: 实现卡尔曼滤波预测
    })
  }

  /**
   * IoU
   * @param detections 
   * @returns 
   */
  private associateDetections(detections: Detection[]): number[] {
    // 简化的贪心匹配：基于IoU，给每个检测找当前未使用的最高IoU轨迹
    const assignments = new Array(detections.length).fill(-1)
    const usedTracks = new Set<number>()
    for (let i = 0; i < detections.length; i++) {
      let bestTrackIndex = -1
      let bestIoU = -1
      for (let t = 0; t < this.tracks.length; t++) {
        if (usedTracks.has(t)) continue
        const iou = this.calculate3DIoU(detections[i].bbox, this.tracks[t].bbox)
        if (iou > bestIoU) {
          bestIoU = iou
          bestTrackIndex = t
        }
      }
      if (bestTrackIndex !== -1 && bestIoU >= this.iouThreshold) {
        assignments[i] = bestTrackIndex
        usedTracks.add(bestTrackIndex)
      }
    }
    return assignments
  }

  /**
   * 更新匹配的轨迹
   * @param detections 
   * @param assignments 
   */
  private updateTracks(detections: Detection[], assignments: number[]): void {
    for (let i = 0; i < detections.length; i++) {
      const trackIndex = assignments[i]
      if (trackIndex !== -1) {
        const track = this.tracks[trackIndex]
        track.bbox = detections[i].bbox
        track.timeSinceUpdate = 0
        track.hits = (track.hits ?? 0) + 1
      }
    }
  }

  /**
   * 创建新轨迹
   * @param detections 
   * @param assignments 
   * @returns 
   */
  private createNewTracks(detections: Detection[], assignments: number[]): Map<number, number> {
    const newMap = new Map<number, number>()
    for (let i = 0; i < detections.length; i++) {
      if (assignments[i] === -1) {
        const newId = this.nextTrackId++
        this.tracks.push({
          id: newId,
          bbox: detections[i].bbox,
          velocity: [0, 0, 0],
          age: 1,
          hits: 1,
          timeSinceUpdate: 0
        })
        // 新增轨迹在数组末尾，记录其ID
        newMap.set(i, newId)
      }
    }
    return newMap
  }

  /**
   * 删除过期轨迹,超出阈值
   */
  private deleteOldTracks(): void {
    this.tracks = this.tracks.filter(track => track.timeSinceUpdate <= this.maxAge)
  }

  /**
   * 计算3D边界框的IoU
   */
  private calculate3DIoU(bbox1: BoundingBox3D, bbox2: BoundingBox3D): number {
    // 目前调用 utils 中的简化IoU（轴对齐，不考虑旋转）
    return calculateIoUUtil(bbox1, bbox2)
  }
}

// 导出主要类和接口
export { AB3DMOTTracker }
export type { TrackedDetection }
export default AB3DMOTTracker

/**
 * 纯函数批处理入口：输入多帧检测，输出多帧带 trackId 的结果
 */
export function trackBatch(
  frames: Detection[][],
  options?: { maxAge?: number; minHits?: number; iouThreshold?: number }
): TrackedDetection[][] {
  const tracker = new AB3DMOTTracker({ ...options, data: frames })
  return tracker.run()
}
