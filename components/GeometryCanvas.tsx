import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Point } from '../types';
import { MoveHorizontal, Calculator, MousePointer2, Settings2 } from 'lucide-react';

/**
 * 画布基础常量设置
 */
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const PADDING = 40;
const PIXELS_PER_UNIT = 50;

// 初始位置
const INITIAL_BASE_Y = 450;
const INITIAL_TOP_Y = 150;
const CENTER_X = 500;

const GeometryCanvas: React.FC = () => {
  // --- 状态管理 ---
  const [topY, setTopY] = useState(INITIAL_TOP_Y);
  const [baseY] = useState(INITIAL_BASE_Y);
  const [vertexA, setVertexA] = useState<Point>({ x: CENTER_X, y: INITIAL_TOP_Y });
  const [vertexB, setVertexB] = useState<Point>({ x: 350, y: INITIAL_BASE_Y });
  const [vertexC, setVertexC] = useState<Point>({ x: 650, y: INITIAL_BASE_Y });
  const [ghost, setGhost] = useState<{A: Point, B: Point, C: Point} | null>(null);
  const [dragging, setDragging] = useState<'A' | 'B' | 'C' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- 衍生计算 ---
  const baseUnits = parseFloat(((vertexC.x - vertexB.x) / PIXELS_PER_UNIT).toFixed(2));
  const heightUnits = parseFloat(((baseY - topY) / PIXELS_PER_UNIT).toFixed(2));
  const areaUnits = parseFloat((0.5 * baseUnits * heightUnits).toFixed(2));

  // 坐标转换
  const getPos = (e: MouseEvent | TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { 
      x: (cx - rect.left) * (CANVAS_WIDTH / rect.width), 
      y: (cy - rect.top) * (CANVAS_HEIGHT / rect.height) 
    };
  };

  const snap = () => setGhost({ A: { ...vertexA }, B: { ...vertexB }, C: { ...vertexC } });

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !svgRef.current) return;
    const { x } = getPos(e);
    const nx = Math.max(PADDING, Math.min(CANVAS_WIDTH - PADDING, x));
    
    if (dragging === 'A') setVertexA(v => ({ ...v, x: nx }));
    else if (dragging === 'B' && nx < vertexC.x - 20) setVertexB(v => ({ ...v, x: nx }));
    else if (dragging === 'C' && nx > vertexB.x + 20) setVertexC(v => ({ ...v, x: nx }));
  }, [dragging, vertexB.x, vertexC.x]);

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
    /**
     * 网格布局：gap-3 让面板更加紧凑。
     * 使用 items-stretch 确保两列高度完全一致，从而实现底边对齐。
     */
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-3 w-full max-w-[1600px] mx-auto p-1 items-stretch">
      
      {/* 【左侧垂直列】 */}
      <div className="flex flex-col gap-3">
        {/* 1. 几何画布：h-fit 确保它只占所需高度 */}
        <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-200 overflow-hidden h-fit">
          <svg 
            ref={svgRef} 
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} 
            className="w-full h-auto bg-slate-50/50 touch-none block"
          >
            <defs>
              <pattern id="grid" width={PIXELS_PER_UNIT} height={PIXELS_PER_UNIT} patternUnits="userSpaceOnUse">
                <path d={`M ${PIXELS_PER_UNIT} 0 L 0 0 0 ${PIXELS_PER_UNIT}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* 背景参考线 */}
            <g opacity="0.3" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4">
              <line x1="0" y1={baseY} x2={CANVAS_WIDTH} y2={baseY} /> 
              <line x1="0" y1={topY} x2={CANVAS_WIDTH} y2={topY} />
            </g>

            {/* 影子参考 */}
            {ghost && <path d={`M ${ghost.B.x} ${baseY} L ${ghost.C.x} ${baseY} L ${ghost.A.x} ${ghost.A.y} Z`} fill="rgba(148,163,184,0.1)" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4" />}

            {/* 高度标注线 */}
            <line x1={vertexA.x} y1={topY} x2={vertexA.x} y2={baseY} stroke="#ef4444" strokeWidth="4" strokeDasharray="6,6" />
            <text x={vertexA.x} y={(baseY+topY)/2} textAnchor="middle" className="fill-red-600 font-black text-3xl" dy="10">h={heightUnits}</text>

            {/* 三角形主体 */}
            <path d={`M ${vertexB.x} ${baseY} L ${vertexC.x} ${baseY} L ${vertexA.x} ${topY} Z`} fill="rgba(99,102,241,0.12)" />
            <path d={`M ${vertexB.x} ${baseY} L ${vertexA.x} ${topY} M ${vertexC.x} ${baseY} L ${vertexA.x} ${topY}`} stroke="#6366f1" strokeWidth="6" />
            <line x1={vertexB.x} y1={baseY} x2={vertexC.x} y2={baseY} stroke="#4338ca" strokeWidth="10" />

            {/* 交互顶点与文字增大 */}
            <g onMouseDown={() => { snap(); setDragging('A'); }} className="cursor-grab active:cursor-grabbing">
              <circle cx={vertexA.x} cy={topY} r="24" fill="#6366f1" stroke="white" strokeWidth="6" className="shadow-lg" />
              <text x={vertexA.x} y={topY-38} textAnchor="middle" className="fill-indigo-900 font-black text-4xl select-none">A</text>
            </g>
            <g onMouseDown={() => { snap(); setDragging('B'); }} className="cursor-ew-resize">
              <circle cx={vertexB.x} cy={baseY} r="16" fill="#1e293b" stroke="white" strokeWidth="5" />
              <text x={vertexB.x} y={baseY+50} textAnchor="middle" className="fill-slate-700 font-black text-2xl">B</text>
            </g>
            <g onMouseDown={() => { snap(); setDragging('C'); }} className="cursor-ew-resize">
              <circle cx={vertexC.x} cy={baseY} r="16" fill="#1e293b" stroke="white" strokeWidth="5" />
              <text x={vertexC.x} y={baseY+50} textAnchor="middle" className="fill-slate-700 font-black text-2xl">C</text>
            </g>
          </svg>
        </div>

        {/* 2. 知识卡片：上边缘紧贴画布，底边将与右侧对齐 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-grow">
          <Card icon={<MoveHorizontal className="w-9 h-9"/>} title="平行移动" desc="顶点 A 在平行线上滑动时，高度 h 恒定。只要底边 b 不变，面积 S 就不会改变。" color="indigo" />
          <Card icon={<MousePointer2 className="w-9 h-9"/>} title="调整变量" desc="手动调节滑块来改变底边或高度。观察变量与几何形状的实时反馈。" color="orange" />
          <Card icon={<Calculator className="w-9 h-9"/>} title="面积公式" desc="深刻理解 S = ½ × 底 × 高。面积由底和高共同决定。" color="emerald" />
        </div>
      </div>

      {/* 【右侧垂直列】 */}
      <div className="flex flex-col gap-3">
        {/* 3. 控制面板：h-fit 保持紧凑 */}
        <div className="bg-white rounded-[1.5rem] shadow-lg p-5 border border-slate-200 h-fit">
          <h4 className="font-black text-slate-800 border-b pb-3 mb-4 flex items-center gap-3 text-2xl">
            <Settings2 className="text-indigo-500 w-8 h-8"/> 控制面板
          </h4>
          <div className="space-y-6">
            <Slider label="底边长度 (b)" val={baseUnits} min={2} max={16} color="indigo" onChange={v => {
              snap(); const mid = (vertexB.x+vertexC.x)/2, hw = (v*PIXELS_PER_UNIT)/2;
              setVertexB({x: mid-hw, y: baseY}); setVertexC({x: mid+hw, y: baseY});
            }} />
            <Slider label="高度 (h)" val={heightUnits} min={1} max={8} color="red" onChange={v => { 
              snap(); const newTop = baseY - v*PIXELS_PER_UNIT; 
              setTopY(newTop); setVertexA(a => ({...a, y: newTop})); 
            }} />
          </div>
        </div>

        {/* 4. 实时计算：上边缘紧贴控制面板，flex-grow 确保底端对齐 */}
        <div className="bg-white rounded-[1.5rem] shadow-lg p-5 border border-slate-200 flex flex-col flex-grow">
          <div className="flex-grow">
            <h4 className="font-black text-slate-800 border-b pb-3 mb-4 flex items-center gap-3 text-2xl">
              <Calculator className="text-indigo-500 w-8 h-8"/> 实时计算
            </h4>
            <div className="space-y-3">
              <Stat label="底边 (b)" val={baseUnits} /> 
              <Stat label="高度 (h)" val={heightUnits} />
            </div>
          </div>
          
          <div className="pt-6 text-center mt-auto">
            <div className="inline-block bg-yellow-50 text-yellow-800 px-6 py-2 rounded-xl font-mono font-black border border-yellow-200 mb-4 text-xl">
              S = ½ × {baseUnits} × {heightUnits}
            </div>
            <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl shadow-indigo-100 transition-transform hover:scale-[1.01]">
              <p className="text-indigo-200 text-sm mb-1 font-bold tracking-widest uppercase">当前面积 (S)</p>
              <p className="font-mono text-7xl font-black tracking-tighter leading-none py-2">{areaUnits}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// --- 子组件定义：最大化字体与视觉反馈 ---

const Card = ({ icon, title, desc, color }: any) => (
  <div className={`bg-white p-5 rounded-[1.5rem] border-2 border-slate-100 hover:border-${color}-200 transition-all hover:shadow-lg h-full flex flex-col`}>
    <div className={`w-16 h-16 bg-${color}-100 text-${color}-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm flex-shrink-0`}>{icon}</div>
    <h3 className="font-black text-slate-800 mb-2 text-2xl">{title}</h3>
    <p className="text-slate-500 text-lg leading-snug font-medium flex-grow">{desc}</p>
  </div>
);

const Slider = ({ label, val, min, max, color, onChange }: any) => (
  <div className="px-1">
    <div className="flex justify-between text-lg font-black text-slate-700 mb-3">
      <span>{label}</span>
      <span className="text-indigo-600 font-mono text-2xl">{val}</span>
    </div>
    <input 
      type="range" min={min} max={max} step="0.1" value={val} 
      onChange={e => onChange(parseFloat(e.target.value))} 
      className={`w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-${color}-500`} 
    />
  </div>
);

const Stat = ({ label, val }: any) => (
  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-[1rem] border border-slate-100">
    <span className="text-slate-500 text-lg font-black uppercase tracking-tight">{label}</span>
    <span className="font-mono text-4xl font-black text-indigo-700">{val}</span>
  </div>
);

export default GeometryCanvas;