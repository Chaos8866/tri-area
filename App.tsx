import React from 'react';
import GeometryCanvas from './components/GeometryCanvas';
import { Triangle } from 'lucide-react';

/**
 * App 根组件：定义整体界面的框架布局、页头和页脚。
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 顶部导航栏：增大高度和字体 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center gap-4">
          {/* Logo 图标 */}
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
            <Triangle className="w-7 h-7 fill-current" />
          </div>
          <span className="font-black text-slate-800 text-2xl tracking-tight">
            几何原理实验室：等积变换演示
          </span>
        </div>
      </nav>

      {/* 核心演示内容区 */}
      <main className="flex-grow py-6 px-4 flex justify-center bg-slate-50">
        <GeometryCanvas />
      </main>

      {/* 底部信息栏：增大字体 */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-base font-bold">© 2024 交互式数学教学演示工具 - 让几何更直观</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-slate-400 text-sm">
             <span className="font-medium">原理：三角形面积 S = ½ × 底 × 高</span>
             <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
             <span className="font-medium">驱动：React + SVG + Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;