import React from 'react';
import GeometryCanvas from './components/GeometryCanvas';
import { Triangle } from 'lucide-react';

/**
 * App 根组件：定义整体界面的框架布局、页头和页脚。
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 顶部导航栏，使用 sticky 粘性定位始终固定在顶部 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          {/* Logo 图标和标题 */}
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
            <Triangle className="w-6 h-6 fill-current" />
          </div>
          <span className="font-extrabold text-slate-800 text-xl tracking-tight">
            几何原理实验室：等积变换演示
          </span>
        </div>
      </nav>

      {/* 核心演示内容区：包含主几何画布 */}
      <main className="flex-grow py-8 px-4 flex justify-center bg-slate-50">
        <GeometryCanvas />
      </main>

      {/* 简洁的底部信息栏 */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">© 2024 交互式数学教学演示工具 - 让几何更直观</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-slate-300 text-xs">
             <span>原理：三角形面积 S = ½ × 底 × 高</span>
             <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
             <span>驱动：React + SVG + Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;