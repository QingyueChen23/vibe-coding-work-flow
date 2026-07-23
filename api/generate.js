// 文件路径必须是 api/generate.js（放在仓库根目录下的 api 文件夹里）
// Vercel 会自动把它变成一个接口：https://你的项目名.vercel.app/api/generate

export default async function handler(req, res) {
  // 允许 WoodFlow 页面跨域调用这个接口
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { systemPrompt, userText } = req.body || {};
  if (!userText) { res.status(400).json({ error: '缺少 userText' }); return; }

  const baseUrl = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) { res.status(500).json({ error: '服务器没有配置 QWEN_API_KEY 环境变量' }); return; }

  try {
    const qwenResp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.QWEN_MODEL || 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt || '' },
          { role: 'user', content: userText }
        ],
        temperature: 0.4,
        max_tokens: 2500
      })
    });
    const data = await qwenResp.json();
    if (!qwenResp.ok) { res.status(qwenResp.status).json(data); return; }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
