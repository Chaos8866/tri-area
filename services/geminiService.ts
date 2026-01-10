import { GoogleGenAI } from "@google/genai";

/**
 * 使用 Google Gemini 模型进行图像编辑
 * 
 * @param base64Image 原始图片的 base64 编码字符串（不含 data: 前缀）
 * @param mimeType 图片的媒体类型（如 image/png）
 * @param prompt 用户的编辑提示词
 * @returns 返回处理后的图片 base64 数据链接或 null
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  try {
    // 1. 使用环境变量中的 API_KEY 初始化 Gemini SDK
    // 注意：每次请求新实例化可以确保获取到最新的环境密钥
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. 调用内容生成 API
    // 使用专门为图像任务优化的 'gemini-2.5-flash-image' 模型
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            // 提供内联图像数据部分
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            // 提供用户的文字指令
            text: prompt,
          },
        ],
      },
    });

    // 3. 解析模型返回的候选结果。
    // 模型响应可能包含文本描述或生成的图像数据。
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        // 如果该部分包含 inlineData，说明是生成的图像
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null; // 若未发现图像数据，则返回空
  } catch (error) {
    // 记录详细错误日志
    console.error("Gemini API 调用失败:", error);
    throw error;
  }
};