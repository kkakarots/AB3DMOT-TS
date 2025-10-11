// 匈牙利算法实现
// 用于数据关联

/**
 * 匈牙利算法实现
 * 用于解决分配问题，找到最优的检测-轨迹匹配
 */
export class HungarianAlgorithm {
  private costMatrix: number[][]
  private size: number

  constructor(costMatrix: number[][]) {
    this.costMatrix = costMatrix.map(row => [...row])
    this.size = Math.max(costMatrix.length, costMatrix[0]?.length || 0)
    this.padMatrix()
  }

  /**
   * 执行匈牙利算法
   * @returns 分配结果，每个元素表示行索引对应的列索引
   */
  solve(): number[] {
    // 步骤1: 行约简
    this.reduceRows()
    
    // 步骤2: 列约简
    this.reduceColumns()
    
    // 步骤3: 寻找初始分配
    const assignment = this.findInitialAssignment()
    
    // 步骤4: 如果分配不完整，使用增广路径
    if (assignment.filter(a => a !== -1).length < this.size) {
      return this.augmentPath(assignment)
    }
    
    return assignment.slice(0, this.costMatrix.length)
  }

  private padMatrix(): void {
    // 将矩阵填充为方阵
    const rows = this.costMatrix.length
    const cols = this.costMatrix[0]?.length || 0
    
    // 添加行
    for (let i = rows; i < this.size; i++) {
      this.costMatrix[i] = new Array(this.size).fill(0)
    }
    
    // 添加列
    for (let i = 0; i < this.size; i++) {
      while (this.costMatrix[i].length < this.size) {
        this.costMatrix[i].push(0)
      }
    }
  }

  private reduceRows(): void {
    for (let i = 0; i < this.size; i++) {
      const min = Math.min(...this.costMatrix[i])
      for (let j = 0; j < this.size; j++) {
        this.costMatrix[i][j] -= min
      }
    }
  }

  private reduceColumns(): void {
    for (let j = 0; j < this.size; j++) {
      let min = Infinity
      for (let i = 0; i < this.size; i++) {
        min = Math.min(min, this.costMatrix[i][j])
      }
      for (let i = 0; i < this.size; i++) {
        this.costMatrix[i][j] -= min
      }
    }
  }

  private findInitialAssignment(): number[] {
    const assignment = new Array(this.size).fill(-1)
    const rowCovered = new Array(this.size).fill(false)
    const colCovered = new Array(this.size).fill(false)

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.costMatrix[i][j] === 0 && !rowCovered[i] && !colCovered[j]) {
          assignment[i] = j
          rowCovered[i] = true
          colCovered[j] = true
        }
      }
    }

    return assignment
  }

  private augmentPath(assignment: number[]): number[] {
    // 简化的增广路径实现
    // 在实际应用中，这里需要更复杂的实现
    
    const rowCovered = new Array(this.size).fill(false)
    const colCovered = new Array(this.size).fill(false)
    
    // 标记已分配的行和列
    for (let i = 0; i < this.size; i++) {
      if (assignment[i] !== -1) {
        rowCovered[i] = true
        colCovered[assignment[i]] = true
      }
    }

    // 寻找未覆盖的零元素
    for (let i = 0; i < this.size; i++) {
      if (!rowCovered[i]) {
        for (let j = 0; j < this.size; j++) {
          if (!colCovered[j] && this.costMatrix[i][j] === 0) {
            assignment[i] = j
            rowCovered[i] = true
            colCovered[j] = true
            break
          }
        }
      }
    }

    return assignment.slice(0, this.costMatrix.length)
  }
}

/**
 * 计算成本矩阵
 * @param detections 检测列表
 * @param tracks 轨迹列表
 * @param costFunction 成本函数
 * @returns 成本矩阵
 */
export function calculateCostMatrix<T, U>(
  detections: T[],
  tracks: U[],
  costFunction: (detection: T, track: U) => number
): number[][] {
  const costMatrix: number[][] = []
  
  for (let i = 0; i < detections.length; i++) {
    costMatrix[i] = []
    for (let j = 0; j < tracks.length; j++) {
      costMatrix[i][j] = costFunction(detections[i], tracks[j])
    }
  }
  
  return costMatrix
}

/**
 * 基于IoU的成本函数
 * @param detection 检测结果
 * @param track 轨迹
 * @param iouThreshold IoU阈值
 * @returns 成本值（1 - IoU）
 */
export function createIoUCostFunction<T extends { bbox: any }, U extends { bbox: any }>(
  iouThreshold: number = 0.3
) {
  return (detection: T, track: U): number => {
    // 这里需要实现IoU计算
    // 返回 1 - IoU，IoU越高成本越低
    const iou = 0 // TODO: 计算实际IoU
    return iou > iouThreshold ? 1 - iou : 1
  }
}
