// 卡尔曼滤波器实现

import { BoundingBox3D, KalmanState } from './types'

/**
 * 简化的卡尔曼滤波器类
 * 用于3D目标跟踪
 */
export class KalmanFilter3D {
  private state: number[]
  private covariance: number[][]
  private processNoise: number
  private measurementNoise: number

  constructor(initialBbox: BoundingBox3D, processNoise: number = 0.1, measurementNoise: number = 0.1) {
    // 状态向量: [x, y, z, vx, vy, vz]
    this.state = [initialBbox.x, initialBbox.y, initialBbox.z, 0, 0, 0]
    this.processNoise = processNoise
    this.measurementNoise = measurementNoise
    
    // 初始化协方差矩阵
    this.covariance = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1]
    ]
  }

  /**
   * 预测步骤
   * @param dt 时间间隔
   */
  predict(dt: number = 1.0): void {
    // 状态转移矩阵 F
    const F = [
      [1, 0, 0, dt, 0, 0],
      [0, 1, 0, 0, dt, 0],
      [0, 0, 1, 0, 0, dt],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1]
    ]

    // 预测状态: x = F * x
    this.state = this.matrixVectorMultiply(F, this.state)

    // 预测协方差: P = F * P * F^T + Q
    const Q = this.createProcessNoiseMatrix(dt)
    this.covariance = this.matrixAdd(
      this.matrixMultiply(this.matrixMultiply(F, this.covariance), this.matrixTranspose(F)),
      Q
    )
  }

  /**
   * 更新步骤
   * @param measurement 测量值 [x, y, z]
   */
  update(measurement: [number, number, number]): void {
    // 测量矩阵 H (只测量位置，不测量速度)
    const H = [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0]
    ]

    // 测量噪声矩阵 R
    const R = [
      [this.measurementNoise, 0, 0],
      [0, this.measurementNoise, 0],
      [0, 0, this.measurementNoise]
    ]

    // 计算卡尔曼增益: K = P * H^T * (H * P * H^T + R)^-1
    const Ht = this.matrixTranspose(H)
    const S = this.matrixAdd(
      this.matrixMultiply(this.matrixMultiply(H, this.covariance), Ht),
      R
    )
    const K = this.matrixMultiply(
      this.matrixMultiply(this.covariance, Ht),
      this.matrixInverse(S)
    )

    // 计算残差: y = z - H * x
    const predictedMeasurement = this.matrixVectorMultiply(H, this.state)
    const residual = [
      measurement[0] - predictedMeasurement[0],
      measurement[1] - predictedMeasurement[1],
      measurement[2] - predictedMeasurement[2]
    ]

    // 更新状态: x = x + K * y
    const correction = this.matrixVectorMultiply(K, residual)
    for (let i = 0; i < this.state.length; i++) {
      this.state[i] += correction[i]
    }

    // 更新协方差: P = (I - K * H) * P
    const I = this.createIdentityMatrix(6)
    const KH = this.matrixMultiply(K, H)
    const IminusKH = this.matrixSubtract(I, KH)
    this.covariance = this.matrixMultiply(IminusKH, this.covariance)
  }

  /**
   * 获取当前状态
   */
  getState(): KalmanState {
    return {
      state: [...this.state],
      covariance: this.covariance.map(row => [...row])
    }
  }

  /**
   * 获取当前位置
   */
  getPosition(): [number, number, number] {
    return [this.state[0], this.state[1], this.state[2]]
  }

  /**
   * 获取当前速度
   */
  getVelocity(): [number, number, number] {
    return [this.state[3], this.state[4], this.state[5]]
  }

  // 矩阵运算辅助方法
  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result: number[][] = []
    for (let i = 0; i < A.length; i++) {
      result[i] = []
      for (let j = 0; j < B[0].length; j++) {
        result[i][j] = 0
        for (let k = 0; k < B.length; k++) {
          result[i][j] += A[i][k] * B[k][j]
        }
      }
    }
    return result
  }

  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    const result: number[] = []
    for (let i = 0; i < A.length; i++) {
      result[i] = 0
      for (let j = 0; j < v.length; j++) {
        result[i] += A[i][j] * v[j]
      }
    }
    return result
  }

  private matrixTranspose(A: number[][]): number[][] {
    const result: number[][] = []
    for (let i = 0; i < A[0].length; i++) {
      result[i] = []
      for (let j = 0; j < A.length; j++) {
        result[i][j] = A[j][i]
      }
    }
    return result
  }

  private matrixAdd(A: number[][], B: number[][]): number[][] {
    const result: number[][] = []
    for (let i = 0; i < A.length; i++) {
      result[i] = []
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = A[i][j] + B[i][j]
      }
    }
    return result
  }

  private matrixSubtract(A: number[][], B: number[][]): number[][] {
    const result: number[][] = []
    for (let i = 0; i < A.length; i++) {
      result[i] = []
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = A[i][j] - B[i][j]
      }
    }
    return result
  }

  private matrixInverse(A: number[][]): number[][] {
    // 简化的3x3矩阵求逆
    if (A.length !== 3 || A[0].length !== 3) {
      throw new Error('Only 3x3 matrix inversion is supported')
    }

    const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
                A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
                A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])

    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is singular')
    }

    const invDet = 1 / det
    return [
      [
        (A[1][1] * A[2][2] - A[1][2] * A[2][1]) * invDet,
        (A[0][2] * A[2][1] - A[0][1] * A[2][2]) * invDet,
        (A[0][1] * A[1][2] - A[0][2] * A[1][1]) * invDet
      ],
      [
        (A[1][2] * A[2][0] - A[1][0] * A[2][2]) * invDet,
        (A[0][0] * A[2][2] - A[0][2] * A[2][0]) * invDet,
        (A[0][2] * A[1][0] - A[0][0] * A[1][2]) * invDet
      ],
      [
        (A[1][0] * A[2][1] - A[1][1] * A[2][0]) * invDet,
        (A[0][1] * A[2][0] - A[0][0] * A[2][1]) * invDet,
        (A[0][0] * A[1][1] - A[0][1] * A[1][0]) * invDet
      ]
    ]
  }

  private createProcessNoiseMatrix(dt: number): number[][] {
    const q = this.processNoise
    const dt2 = dt * dt
    const dt3 = dt2 * dt
    const dt4 = dt3 * dt

    return [
      [dt4/4*q, 0, 0, dt3/2*q, 0, 0],
      [0, dt4/4*q, 0, 0, dt3/2*q, 0],
      [0, 0, dt4/4*q, 0, 0, dt3/2*q],
      [dt3/2*q, 0, 0, dt2*q, 0, 0],
      [0, dt3/2*q, 0, 0, dt2*q, 0],
      [0, 0, dt3/2*q, 0, 0, dt2*q]
    ]
  }

  private createIdentityMatrix(size: number): number[][] {
    const result: number[][] = []
    for (let i = 0; i < size; i++) {
      result[i] = []
      for (let j = 0; j < size; j++) {
        result[i][j] = i === j ? 1 : 0
      }
    }
    return result
  }
}
