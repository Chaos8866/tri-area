import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 1. 获取 HTML 中的根节点（id="root"）
const rootElement = document.getElementById('root');

// 2. 运行时检查，确保根节点存在，否则抛出错误辅助调试
if (!rootElement) {
  throw new Error("无法找到用于挂载的根元素 root");
}

// 3. 创建 React 18 风格的根渲染器
const root = ReactDOM.createRoot(rootElement);

// 4. 渲染应用组件，外层包裹 StrictMode 以开启开发环境下的额外检查
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);