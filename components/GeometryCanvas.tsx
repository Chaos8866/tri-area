import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Point } from '../types';
import { MoveHorizontal, Calculator, MousePointer2, Settings2, ArrowLeftRight, ArrowUpDown } from 'lucide-react';

/**
 * 画布基础常量设置
 * 采用逻辑坐标系（1000x600），以便在不同尺寸屏幕下保持几何关系的稳定性
 */
const CANVAS_WIDTH = 1000;        // 逻辑宽度
const CANVAS_HEIGHT = 600;       // 逻辑高度
const PADDING = 40;              // 画布安全留白区域
const PIXELS_PER_UNIT = 50;      // 1个数学单位对应的像素宽度（用于缩放显示）

// 初始布局数值
const INITIAL_BASE_Y = 450;      // 三角形底边所在的水平线高度
const INITIAL_TOP_Y = 150;       // 三角形顶点所在的平行线高度
const CENTER_X = 500;            // 画布中心 X 轴位置

const GeometryCanvas: React.FC = () => {
  // --- 状态钩子 ---
  const [topY, setTopY] = useState(INITIAL_TOP_Y); // 顶点 A 所处的平行线 Y 坐标
  const [baseY] = useState(INITIAL_BASE_Y);         // 基准线 Y 坐标（通常固定）
  
  // 存储三角形的三个顶点实时位置
  const [vertexA, setVertexA] = useState<Point>({ x: CENTER_X, y: INITIAL_TOP_Y });
  const [vertexB, setVertexB] = useState<Point>({ x: 350, y: INITIAL_BASE_Y });
  const [vertexC, setVertexC] = useState<Point>({ x: 650, y: INITIAL_BASE_Y });
  
  // 存储拖拽开始前的位置快照，用于在画布上绘制浅色的“参考影子”
  const [ghost, setGhost] = useState<{A: Point, B: Point, C: Point} | null>(null);
  
  // 记录当前正在被用户鼠标/手指抓取的顶点标识
  const [dragging, setDragging] = useState<'A' | 'B' | 'C' | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  // --- 衍生数据计算 ---
  // 底边长度（计算两个底点的横向差值，并转为数学单位）
  const baseUnits = parseFloat(((vertexC.x - vertexB.x) / PIXELS_PER_UNIT).toFixed(2));
  // 垂直高度（顶线与基线的垂直差值，转为数学单位）
  const heightUnits = parseFloat(((baseY - topY) / PIXELS_PER_UNIT).toFixed(2));
  // 核心面积计算：S = 1/2 * b * h
  const areaUnits = parseFloat((0.5 * baseUnits * heightUnits).toFixed(2));

  /**
   * 将屏幕窗口的坐标 (clientX, clientY) 映射为 SVG 内部逻辑坐标系中的点
   */
  const getPos = (e: MouseEvent | TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // 根据 SVG 的当前屏幕占比，反算缩放倍数
    return { 
      x: (cx - rect.left) * (CANVAS_WIDTH / rect.width), 
      y: (cy - rect.top) * (CANVAS_HEIGHT / rect.height) 
    };
  };

  /** 
   * 快照当前顶点位置：当用户开始拖动任何元素时调用，
   * 以便在移动过程中显示原本三角形的位置作为对比（影子效果）。
   */
  const snap = () => setGhost({ A: { ...vertexA }, B: { ...vertexB }, C: { ...vertexC } });

  /**
   * 全局移动处理逻辑：根据当前选中的顶点更新其位置
   */
  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !svgRef.current) return;
    const { x } = getPos(e);
    
    // 约束点不能超出画布左右边界
    const nx = Math.max(PADDING, Math.min(CANVAS_WIDTH - PADDING, x));
    
    if (dragging === 'A') {
      // 顶点 A 只能沿着 topY 这条平行线横向移动
      setVertexA(v => ({ ...v, x: nx }));
    } else if (dragging === 'B') {
      // 顶点 B 沿底线移动，但不能越过顶点 C
      if (nx < vertexC.x - 20) setVertexB(v => ({ ...v, x: nx }));
    } else if (dragging === 'C') {
      // 顶点 C 沿底线移动，但不能在顶点 B 左侧
      if (nx > vertexB.x + 20) setVertexC(v => ({ ...v, x: nx }));
    }
  }, [dragging, vertexB.x, vertexC.x]);

  /** 
   * 副作用处理：负责在拖拽期间绑定全局鼠标/触摸事件，
   * 确保用户鼠标移动到画布外时依然能维持交互状态。
   */
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', () => setDragging(null));
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', () => setDragging(null));
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, [dragging, onMove]);

  return (
    // 主布局容器：使用 flex-row 适配大屏，flex-col 适配小屏
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1600px] mx-auto items-stretch p-4">
      
      {/* 3/4 宽度的主视图区域（画布 + 知识说明） */}
      <div className="w-full lg:w-3/4 flex flex-col gap-6">
        {/* SVG 图形渲染区 */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden w-full">
          <svg 
            ref={svgRef} 
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} 
            className="w-full h-auto bg-slate-50/50 touch-none block" 
            style={{ maxHeight: '70vh' }}
          >
            <defs>
              {/* 背景格线，增强几何空间感 */}
              <pattern id="grid" width={PIXELS_PER_UNIT} height={PIXELS_PER_UNIT} patternUnits="userSpaceOnUse">
                <path d={`M ${PIXELS_PER_UNIT} 0 L 0 0 0 ${PIXELS_PER_UNIT}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* 平行线参考线 (l1, l2) */}
            <g opacity="0.4" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4">
              <line x1="0" y1={baseY} x2={CANVAS_WIDTH} y2={baseY} /> 
              <line x1="0" y1={topY} x2={CANVAS_WIDTH} y2={topY} />
            </g>

            {/* 影子三角形：显示拖动前的原始几何状态 */}
            {ghost && <path d={`M ${ghost.B.x} ${baseY} L ${ghost.C.x} ${baseY} L ${ghost.A.x} ${ghost.A.y} Z`} fill="rgba(148,163,184,0.12)" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4" />}

            {/* 垂直高度标注线 (h) */}
            <line x1={vertexA.x} y1={topY} x2={vertexA.x} y2={baseY} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
            <text x={vertexA.x} y={(baseY+topY)/2} textAnchor="middle" className="fill-red-500 font-bold text-lg" dy="5">h={heightUnits}</text>

            {/* 主三角形：通过三个动态顶点绘制路径 */}
            <path d={`M ${vertexB.x} ${baseY} L ${vertexC.x} ${baseY} L ${vertexA.x} ${topY} Z`} fill="rgba(99,102,241,0.1)" />
            {/* 渲染三角形的三条边 */}
            <path d={`M ${vertexB.x} ${baseY} L ${vertexA.x} ${topY} M ${vertexC.x} ${baseY} L ${vertexA.x} ${topY}`} stroke="#6366f1" strokeWidth="4" />
            <line x1={vertexB.x} y1={baseY} x2={vertexC.x} y2={baseY} stroke="#4338ca" strokeWidth="6" />

            {/* 可交互的顶点控制柄：点 A */}
            <g onMouseDown={() => { snap(); setDragging('A'); }} className="cursor-grab active:cursor-grabbing">
              <circle cx={vertexA.x} cy={topY} r="18" fill="#6366f1" stroke="white" strokeWidth="4" className="shadow-lg transition-transform hover:scale-110" />
              <text x={vertexA.x} y={topY-30} textAnchor="middle" className="fill-indigo-700 font-bold text-2xl select-none">A</text>
            </g>
            {/* 可交互的顶点控制柄：点 B */}
            <g onMouseDown={() => { snap(); setDragging('B'); }} className="cursor-ew-resize">
              <circle cx={vertexB.x} cy={baseY} r="12" fill="#1e293b" stroke="white" strokeWidth="3" />
              <text x={vertexB.x} y={baseY+35} textAnchor="middle" className="fill-slate-600 font-bold text-lg">B</text>
            </g>
            {/* 可交互的顶点控制柄：点 C */}
            <g onMouseDown={() => { snap(); setDragging('C'); }} className="cursor-ew-resize">
              <circle cx={vertexC.x} cy={baseY} r="12" fill="#1e293b" stroke="white" strokeWidth="3" />
              <text x={vertexC.x} y={baseY+35} textAnchor="middle" className="fill-slate-600 font-bold text-lg">C</text>
            </g>
          </svg>
        </div>

        {/* 底部知识说明卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card icon={<MoveHorizontal/>} title="平行移动" desc="拖动点 A，由于它始终在平行线上运动，高度 h 保持不变，故面积 S 也保持恒定。" color="indigo" />
          <Card icon={<MousePointer2/>} title="调整变量" desc="改变底边 b 的长度或垂直高度 h，可以直观地观察到面积 S 的联动变化。" color="orange" />
          <Card icon={<Calculator/>} title="面积公式" desc="三角形面积公式为 S = ½ × b × h。底和高是决定面积的两个独立因素。" color="emerald" />
        </div>
      </div>

      {/* 1/4 宽度的侧边面板（控制 + 计算结果） */}
      <div className="w-full lg:w-1/4 flex flex-col gap-6 justify-between">
        {/* 滑杆控制面板 */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-200">
          <h4 className="font-bold text-slate-800 border-b pb-4 mb-8 flex items-center gap-3 text-xl"><Settings2 className="text-indigo-500"/> 控制面板</h4>
          <div className="space-y-10">
            {/* 改变底边长度：通过调整 B 和 C 相对中心点的距离 */}
            <Slider label="底边长度 (b)" val={baseUnits} min={2} max={16} color="indigo" onChange={v => {
              snap(); const mid = (vertexB.x+vertexC.x)/2, hw = (v*PIXELS_PER_UNIT)/2;
              setVertexB({x: mid-hw, y: baseY}); setVertexC({x: mid+hw, y: baseY});
            }} />
            {/* 改变垂直高度：通过上下移动平行线 l1 和顶点 A */}
            <Slider label="高度 (h)" val={heightUnits} min={1} max={8} color="red" onChange={v => { 
              snap(); const newTop = baseY - v*PIXELS_PER_UNIT; 
              setTopY(newTop); setVertexA(a => ({...a, y: newTop})); 
            }} />
          </div>
        </div>

        {/* 实时计算结果面板 */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200 flex flex-col gap-4">
          <h4 className="font-bold text-slate-800 border-b pb-4 flex items-center gap-3 text-xl"><Calculator className="text-indigo-500"/> 实时计算</h4>
          <div className="space-y-3">
            <Stat label="当前底边 (b)" val={baseUnits} /> 
            <Stat label="当前高度 (h)" val={heightUnits} />
            <div className="pt-4 text-center">
              <span className="inline-block bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl font-mono font-bold border border-yellow-100 mb-4">S = ½ × {baseUnits} × {heightUnits}</span>
              <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-indigo-100">
                <p className="text-indigo-100 text-sm mb-1 font-medium">当前面积 (S)</p>
                <p className="font-mono text-5xl font-bold tracking-tight">{areaUnits}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 
 * 知识卡片子组件
 */
const Card = ({ icon, title, desc, color }: any) => (
  <div className={`bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-${color}-200 transition-all hover:shadow-lg h-full`}>
    <div className={`w-12 h-12 bg-${color}-100 text-${color}-600 rounded-xl flex items-center justify-center mb-4 shadow-sm`}>{icon}</div>
    <h3 className="font-bold text-slate-800 mb-2 text-xl">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

/** 
 * 样式化滑杆子组件
 */
const Slider = ({ label, val, min, max, color, onChange }: any) => (
  <div>
    <div className="flex justify-between text-sm font-bold text-slate-600 mb-3">
      <span>{label}</span>
      <span className="text-slate-400 font-mono">{val}</span>
    </div>
    <input 
      type="range" min={min} max={max} step="0.1" value={val} 
      onChange={e => onChange(parseFloat(e.target.value))} 
      className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${color}-500`} 
    />
  </div>
);

/** 
 * 简洁数据行展示子组件
 */
const Stat = ({ label, val }: any) => (
  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
    <span className="text-slate-400 text-sm font-semibold">{label}</span>
    <span className="font-mono text-xl font-bold text-slate-700">{val}</span>
  </div>
);

export default GeometryCanvas;