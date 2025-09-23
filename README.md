# AB3DMOT-TS

TypeScript 实现的 3D 多目标跟踪算法 (AB3DMOT)。

## 项目结构

```
src/
├── index.ts          # 主入口文件，导出核心类和接口
├── types.ts          # TypeScript 类型定义
├── utils.ts          # 工具函数（IoU计算等）
├── kalman.ts         # 卡尔曼滤波器实现
└── hungarian.ts      # 匈牙利算法实现
```

## 安装依赖

```bash
npm install
```

## 开发

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 核心功能

### 1. 3D边界框结构
- 包含位置 (x, y, z)、尺寸 (width, height, length) 和朝向 (orientation)
- 支持计算中心点、体积和重叠检测

### 2. 卡尔曼滤波
- 状态向量: [x, y, z, vx, vy, vz]
- 支持预测和更新步骤
- 可配置过程噪声和测量噪声

### 3. 3D IoU计算
- 计算两个3D边界框的交并比
- 支持轴对齐边界框的简化计算

### 4. 匈牙利算法
- 用于检测-轨迹数据关联
- 支持自定义成本函数
- 提供基于IoU的成本计算

### 5. 轨迹管理
- 轨迹出生/死亡管理
- 唯一ID分配
- 可配置的阈值设定

## 使用示例

```typescript
import { AB3DMOTTracker, trackBatch, type Detection, type TrackedDetection } from './src/index'

// 方式一：逐帧流式更新
const tracker = new AB3DMOTTracker({ maxAge: 3, minHits: 3, iouThreshold: 0.3 })
const frame1: Detection[] = [
  { bbox: { x: 0, y: 0, z: 0, width: 2, height: 2, length: 2, orientation: 0 }, confidence: 0.9 }
]
const out1: TrackedDetection[] = tracker.step(frame1)
console.log('frame1 out:', out1)

// 方式二：批处理（一次性传入多帧数据，调用 run() 得到每帧结果）
const data: Detection[][] = [
  [ { bbox: { x: 0, y: 0, z: 0, width: 2, height: 2, length: 2, orientation: 0 }, confidence: 0.9 } ],
  [ { bbox: { x: 0.2, y: 0.0, z: 0.1, width: 2, height: 2, length: 2, orientation: 0 }, confidence: 0.92 } ]
]
const batchTracker = new AB3DMOTTracker({ data })
const outputs: TrackedDetection[][] = batchTracker.run()
console.log('batch outputs:', outputs)

// 方式三：函数式批处理（无需手动管理类实例）
const outputs2 = trackBatch(data, { maxAge: 3, minHits: 2, iouThreshold: 0.3 })
console.log('trackBatch outputs:', outputs2)
```

## 技术栈

- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速的构建工具
- **ES2020**: 现代JavaScript特性

## 开发计划

- [ ] 完善3D IoU计算（支持旋转边界框）
- [ ] 实现完整的卡尔曼滤波器
- [ ] 优化匈牙利算法性能
- [ ] 添加Web Worker支持
- [ ] 编写单元测试
- [ ] 添加性能基准测试