// 类型定义文件

/**
 * 3D边界框接口
 */
export interface BoundingBox3D {
  /** 中心点x坐标 */
  x: number
  /** 中心点y坐标 */
  y: number
  /** 中心点z坐标 */
  z: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 长度 */
  length: number
  /** 朝向角度（弧度） */
  orientation: number
}

/**
 * 检测结果接口
 */
export interface Detection {
  /** 检测ID（可选） */
  id?: number
  /** 3D边界框 */
  bbox: BoundingBox3D
  /** 置信度 */
  confidence: number
  /** 类别ID（可选） */
  classId?: number
}

/**
 * 轨迹接口
 */
export interface Track {
  /** 轨迹ID */
  id: number
  /** 当前边界框 */
  bbox: BoundingBox3D
  /** 速度 [vx, vy, vz] */
  velocity: [number, number, number]
  /** 轨迹年龄（帧数） */
  age: number
  /** 匹配次数 */
  hits: number
  /** 自上次更新以来的时间 */
  timeSinceUpdate: number
  /** 卡尔曼滤波器实例 */
  kalmanFilter?: any
}

/**
 * 跟踪器配置接口
 */
export interface TrackerConfig {
  /** 最大年龄（帧数）解决死亡太快的问题 */
  maxAge?: number
  /** 最小匹配次数 解决出生太快的问题 */
  minHits?: number
  /** IoU阈值 */
  iouThreshold?: number
  /** 速度阈值 */
  velocityThreshold?: number
}

/**
 * 卡尔曼滤波器状态接口
 */
export interface KalmanState {
  /** 状态向量 [x, y, z, vx, vy, vz] */
  state: number[]
  /** 协方差矩阵 */
  covariance: number[][]
}
