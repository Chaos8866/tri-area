import React, { useState, useRef } from 'react';
import { Upload, Wand2, RefreshCcw, Loader2, Download } from 'lucide-react';
import { editImageWithGemini } from '../services/geminiService';

/**
 * AI 图像编辑组件：集成 Gemini 图像编辑功能
 */
const ImageEditor: React.FC = () => {
  // 状态管理
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // 上传的原始图片 (DataURL)
  const [mimeType, setMimeType] = useState<string>('');                   // 图片 MIME 类型
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // 编辑后的图片 (DataURL)
  const [prompt, setPrompt] = useState('');                               // 用户的文字描述
  const [isLoading, setIsLoading] = useState(false);                      // 加载状态
  const [error, setError] = useState<string | null>(null);                // 错误信息显示
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理本地文件上传
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 清空之前的结果和错误
    setGeneratedImage(null);
    setError(null);
    
    // 基础文件类型校验
    if (!file.type.startsWith('image/')) {
        setError("请上传有效的图片文件。");
        return;
    }

    setMimeType(file.type);

    // 使用 FileReader 将文件转为 Base64 以便预览和发送给 API
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * 调用 Gemini 服务生成编辑后的图像
   */
  const handleGenerate = async () => {
    if (!selectedImage || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 提取纯 Base64 数据部分
      const base64Data = selectedImage.split(',')[1];
      
      const result = await editImageWithGemini(base64Data, mimeType, prompt);
      
      if (result) {
        setGeneratedImage(result);
      } else {
        setError("AI 无法根据该指令生成编辑结果，请换个描述试试。");
      }
    } catch (err: any) {
      setError(err.message || "与服务器通信时发生错误。");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 重置所有输入状态
   */
  const handleReset = () => {
    setSelectedImage(null);
    setGeneratedImage(null);
    setPrompt('');
    setMimeType('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-600"/> 
          AI 图像工作室
        </h2>
        <p className="text-slate-600">
          基于 <span className="font-semibold text-purple-600">Gemini 2.5 Flash Image</span>。
          上传照片并输入你的创意想法。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧：输入控制区 */}
        <div className="space-y-6">
          
          {/* 文件上传/预览区 */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors h-64 relative overflow-hidden ${
              selectedImage ? 'border-purple-200 bg-purple-50' : 'border-slate-300 hover:border-purple-400 bg-white'
            }`}
          >
            {selectedImage ? (
              <img src={selectedImage} alt="原始图" className="absolute inset-0 w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center pointer-events-none">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">点击此处上传图片</p>
                <p className="text-xs text-slate-400">支持 PNG, JPG</p>
              </div>
            )}
             
             {/* 隐藏的 input，覆盖整个容器以方便点击 */}
             <input 
               ref={fileInputRef}
               type="file" 
               accept="image/*" 
               onChange={handleFileChange}
               className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${selectedImage ? 'hidden' : ''}`}
             />
             
             {selectedImage && (
                <button 
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-white/80 p-1 rounded-full shadow hover:bg-white text-slate-600"
                  title="移除当前图片"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
             )}
          </div>

          {/* 提示词输入框 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">编辑指令</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：把它变成赛博朋克风格，或者加一个滑板..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[100px] resize-none"
              disabled={isLoading || !selectedImage}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !selectedImage || !prompt.trim()}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${
              isLoading || !selectedImage || !prompt.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                立即生成
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
               {error}
            </div>
          )}
        </div>

        {/* 右侧：生成结果展示区 */}
        <div className="bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center h-[500px] relative shadow-inner overflow-hidden">
          {generatedImage ? (
            <>
              <img src={generatedImage} alt="生成图" className="w-full h-full object-contain p-2" />
              <a 
                href={generatedImage} 
                download="ai-edit.png"
                className="absolute bottom-4 right-4 bg-white/95 text-purple-700 px-5 py-2 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 hover:bg-white transition-all transform hover:-translate-y-1"
              >
                <Download className="w-4 h-4" /> 保存编辑结果
              </a>
            </>
          ) : (
            <div className="text-center p-6">
              {isLoading ? (
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-14 h-14 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                   <p className="text-slate-500 font-medium animate-pulse">Gemini 正在重塑像素...</p>
                 </div>
              ) : (
                <div className="opacity-40">
                  <Wand2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">生成的魔法图片将展示于此</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;