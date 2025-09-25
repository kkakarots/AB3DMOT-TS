// 处理真实数据的脚本
import { trackBatch, type Detection, type BoundingBox3D } from './index'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 定义输入数据格式
interface InputObject {
  id: string
  type: string
  trackId: string
  trackName: string
  contour: {
    size3D: { x: number; y: number; z: number }
    center3D: { x: number; y: number; z: number }
    rotation3D: { x: number; y: number; z: number }
  }
  modelConfidence: number
  modelClass: string
}

interface InputFrame {
  version: string
  dataId: number
  sourceName: string
  objects: InputObject[]
}

// 转换函数：将输入格式转换为我们的Detection格式
function convertToDetection(object: InputObject): Detection {
  const { contour, modelConfidence, modelClass } = object
  const { size3D, center3D, rotation3D } = contour
  
  return {
    bbox: {
      x: center3D.x,
      y: center3D.y,
      z: center3D.z,
      width: size3D.x,
      height: size3D.y,
      length: size3D.z,
      orientation: rotation3D.z // 使用z轴旋转作为朝向
    },
    confidence: modelConfidence,
    classId: modelClass === 'Car' ? 1 : 2, // 简单的类别映射
    id: parseInt(object.trackName) // 使用trackName作为ID
  }
}

// 主处理函数
function processData() {
  try {
    // 读取输入数据
    const inputPath = path.join(__dirname, '../result/08.json')
    const rawData = fs.readFileSync(inputPath, 'utf-8')
    const inputFrames: InputFrame[] = JSON.parse(rawData)
    
    console.log(`读取到 ${inputFrames.length} 帧数据`)
    
    // 转换数据格式
    const detectionFrames: Detection[][] = inputFrames.map(frame => 
      frame.objects.map(convertToDetection)
    )
    
    console.log('数据转换完成，开始追踪...')
    
    // 使用批处理进行追踪
    const results = trackBatch(detectionFrames, {
      maxAge: 3,
      minHits: 2,
      iouThreshold: 0.3
    })
    
    console.log('追踪完成！')
    
    // 输出结果统计
    results.forEach((frame, index) => {
      console.log(`第 ${index + 1} 帧: ${frame.length} 个检测结果`)
      frame.forEach(detection => {
        console.log(`  - TrackID: ${detection.trackId}, 位置: (${detection.bbox.x.toFixed(2)}, ${detection.bbox.y.toFixed(2)}, ${detection.bbox.z.toFixed(2)}), 置信度: ${detection.confidence.toFixed(3)}`)
      })
    })
    
    // 保存结果到文件
    const outputPath = path.join(__dirname, '../result/08_tracked.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`结果已保存到: ${outputPath}`)
    
    // 统计信息
    const totalDetections = results.reduce((sum, frame) => sum + frame.length, 0)
    const uniqueTrackIds = new Set(results.flat().map(d => d.trackId)).size
    console.log(`\n统计信息:`)
    console.log(`- 总检测数: ${totalDetections}`)
    console.log(`- 唯一轨迹数: ${uniqueTrackIds}`)
    console.log(`- 平均每帧检测数: ${(totalDetections / results.length).toFixed(2)}`)
    
  } catch (error) {
    console.error('处理数据时出错:', error)
  }
}

// 运行处理
processData()

export { processData, convertToDetection }
