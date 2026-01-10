/**
 * 定义基础点坐标接口
 */
export interface Point {
  /** 横坐标，对应 SVG 内部逻辑坐标系 (0-1000) */
  x: number; 
  /** 纵坐标，对应 SVG 内部逻辑坐标系 (0-600) */
  y: number; 
}

/**
 * 定义几何图形的状态接口，用于存储底边宽度和高度等数值
 */
export interface GeometryState {
  /** 底边宽度（逻辑单位） */
  baseWidth: number; 
  /** 三角形垂直高度（逻辑单位） */
  height: number;    
}