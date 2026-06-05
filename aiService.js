// aiService.js
import dotenv from 'dotenv';
dotenv.config();

// 你申请的智谱AI API密钥
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
// 智谱AI官方提供的接口地址[reference:9]
const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

/**
 * 向智谱AI发送消息，获取回复
 * @param {string} userPrompt 用户输入的提示词
 * @returns {Promise<string>} AI返回的回复文本
 */
export async function getAIResponse(userPrompt) {
  if (!ZHIPU_API_KEY) {
    console.error("错误：未找到ZHIPU_API_KEY，请检查.env文件");
    return "服务端配置错误，请联系管理员。";
  }

  // 请求体配置，使用免费模型
  const requestBody = {
    model: "glm-4-flash",
    messages: [
      { role: "system", content: "你是一个帮助老师和学生学习的人工智能助手，请用清晰、友善的普通话回答问题。" },
      { role: "user", content: userPrompt }
    ],
    stream: false
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.error) {
      console.error("智谱AI API 返回错误:", data.error);
      return `AI服务出错：${data.error.message || '未知错误'}`;
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error("调用智谱AI API时发生网络错误:", error);
    return "网络繁忙，AI服务暂时不可用，请稍后再试。";
  }
}