// server.js
import 'dotenv/config'
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import { getAIResponse } from './aiService.js';

// 从环境变量中读取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// 配置中间件
app.use(cors());
app.use(express.json());

// --- 一个简单的测试接口 ---
app.get('/api/test', (req, res) => {
  res.json({ message: '后端服务运行正常！' });
});

// --- 1. AI问答接口 ---
app.post('/api/chat', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: '请提供用户ID和问题内容' });
  }

  try {
    const aiReply = await getAIResponse(message);

    // 将对话存入Supabase数据库
    const { error: dbError } = await supabase
      .from('chat_history')
      .insert([{ user_id: userId, user_message: message, ai_response: aiReply }]);

    if (dbError) console.error("保存对话记录时出错:", dbError);

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("处理 /api/chat 请求时出错:", error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// --- 2. 获取历史对话接口 ---
app.get('/api/chat/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- 3. 保存自测练习结果接口 ---
app.post('/api/quiz/save', async (req, res) => {
  const { userId, category, score, totalQuestions, details } = req.body;
  const { error } = await supabase.from('quiz_attempts').insert([{
    user_id: userId,
    category: category,
    score: score,
    total_questions: totalQuestions,
    details: details
  }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: '练习结果已保存' });
});

// --- 4. 获取学生自测历史接口 ---
app.get('/api/quiz/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- 启动服务器 ---
app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动，监听端口 ${PORT}`);
  console.log(`测试地址: http://localhost:${PORT}/api/test`);
});