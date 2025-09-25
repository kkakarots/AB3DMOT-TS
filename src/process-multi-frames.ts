// 处理多帧数据的脚本
import { trackBatch, type Detection } from './index'
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
      orientation: rotation3D.z
    },
    confidence: modelConfidence,
    classId: modelClass === 'Car' ? 1 : 2,
    id: parseInt(object.trackName)
  }
}

// 主处理函数
function processMultiFrames() {
  try {
    const resultDir = path.join(__dirname, '../result')
    const files = fs.readdirSync(resultDir).filter(f => f.endsWith('.json') && f !== '08_tracked.json')
    
    console.log(`找到 ${files.length} 个数据文件:`, files)
    
    const allFrames: Detection[][] = []
    
    // 读取每一帧数据
    for (const file of files) {
      const filePath = path.join(resultDir, file)
      const rawData = fs.readFileSync(filePath, 'utf-8')
      const inputFrame: InputFrame = JSON.parse(rawData)[0] // 每个文件包含一帧
      
      if (inputFrame && inputFrame.objects) {
        const detections = inputFrame.objects.map(convertToDetection)
        allFrames.push(detections)
        console.log(`文件 ${file}: ${detections.length} 个检测`)
      } else {
        console.log(`文件 ${file}: 无有效数据`)
        allFrames.push([]) // 空帧
      }
    }
    
    console.log(`\n总共 ${allFrames.length} 帧数据，开始追踪...`)
    
    // 使用批处理进行追踪
    const results = trackBatch(allFrames, {
      maxAge: 3,
      minHits: 2,
      iouThreshold: 0.3
    })
    
    console.log('追踪完成！')
    
    // 输出结果统计
    results.forEach((frame, index) => {
      console.log(`\n第 ${index + 1} 帧 (${files[index]}): ${frame.length} 个检测结果`)
      if (frame.length > 0) {
        frame.forEach(detection => {
          console.log(`  - TrackID: ${detection.trackId}, 位置: (${detection.bbox.x.toFixed(2)}, ${detection.bbox.y.toFixed(2)}, ${detection.bbox.z.toFixed(2)}), 置信度: ${detection.confidence.toFixed(3)}`)
        })
      }
    })
    
    // 保存结果到文件
    const outputPath = path.join(resultDir, 'multi_frames_tracked.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n结果已保存到: ${outputPath}`)
    
    // 统计信息
    const totalDetections = results.reduce((sum, frame) => sum + frame.length, 0)
    const uniqueTrackIds = new Set(results.flat().map(d => d.trackId)).size
    console.log(`\n统计信息:`)
    console.log(`- 总检测数: ${totalDetections}`)
    console.log(`- 唯一轨迹数: ${uniqueTrackIds}`)
    console.log(`- 平均每帧检测数: ${(totalDetections / results.length).toFixed(2)}`)
    
    // 轨迹连续性分析
    const trackContinuity = new Map<number, number[]>()
    results.forEach((frame, frameIndex) => {
      frame.forEach(detection => {
        if (!trackContinuity.has(detection.trackId)) {
          trackContinuity.set(detection.trackId, [])
        }
        trackContinuity.get(detection.trackId)!.push(frameIndex)
      })
    })
    
    console.log(`\n轨迹连续性分析:`)
    trackContinuity.forEach((frames, trackId) => {
      console.log(`- TrackID ${trackId}: 出现在帧 ${frames.join(', ')} (持续 ${frames.length} 帧)`)
    })
    
  } catch (error) {
    console.error('处理数据时出错:', error)
  }
}

// 运行处理
processMultiFrames()

export { processMultiFrames, convertToDetection }
