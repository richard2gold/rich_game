
import { GoogleGenAI } from "@google/genai";
import { GlobalEventTarget } from "../types";

// NOTE: In a real app, strict error handling for missing API keys is needed.
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateBanter = async (
  characterName: string,
  situation: string,
  catchphrase: string
): Promise<string> => {
  if (!ai) return `${characterName}: "${catchphrase}"`;

  try {
    const prompt = `
      角色: ${characterName}
      口头禅: "${catchphrase}"
      当前情况: ${situation}
      
      请用中文写一句非常简短（最多15个字）、幽默、符合角色性格的吐槽或反应。
      直接返回内容，不要带引号。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || catchphrase;
  } catch (error) {
    return catchphrase;
  }
};

/**
 * 个人命运事件概率分布:
 * 70% 正向 (Positive)
 * 25% 负向 (Negative)
 * 5%  极度倒霉 (Very Bad)
 */
export const generateFateEvent = async (): Promise<{ title: string; description: string; effectAmount: number; type: 'GOOD' | 'BAD' | 'VERY_BAD' }> => {
  const rand = Math.random();
  let eventType = 'GOOD';
  if (rand > 0.95) eventType = 'VERY_BAD';
  else if (rand > 0.70) eventType = 'BAD';

  // Fallback
  if (!ai) {
    if (eventType === 'GOOD') return { title: "小确幸", description: "捡到钱包", effectAmount: 2000000, type: 'GOOD' };
    if (eventType === 'BAD') return { title: "违章停车", description: "被贴条了", effectAmount: -1000000, type: 'BAD' };
    return { title: "遭遇诈骗", description: "巨额损失！", effectAmount: -10000000, type: 'VERY_BAD' };
  }

  try {
    const prompt = `
      生成一个上海大富翁“命运”事件。
      
      类型要求: ${eventType === 'GOOD' ? '正向奖励 (70%概率)' : eventType === 'BAD' ? '轻微惩罚 (25%概率)' : '严重倒霉/灾难 (5%概率)'}。
      
      请返回 JSON:
      {
        "title": "简短标题",
        "description": "一句话描述(幽默)",
        "effectAmount": 数字 (GOOD为正数 100万-1000万; BAD为负数 -50万 到 -500万; VERY_BAD为负数 -1000万 到 -5000万)
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      title: data.title || "命运",
      description: data.description || "...",
      effectAmount: data.effectAmount || 0,
      type: eventType as any
    };
  } catch (error) {
    return { title: "休息", description: "暂停一下", effectAmount: 0, type: 'GOOD' };
  }
};

/**
 * 全局命运 (20回合一次)
 * 70% 全局 (ALL)
 * 30% 局部 (SUBSET - POOR, RICH, LANDLORDS, etc)
 */
export const generateGlobalEconomyEvent = async (turnCount: number): Promise<{ 
    title: string; 
    description: string; 
    target: GlobalEventTarget;
    effectPercentage: number; // +/- % of money
}> => {
  const isPartial = Math.random() > 0.7; // 30% chance for partial
  
  if (!ai) {
     return { title: "经济调整", description: "市场波动。", target: "ALL", effectPercentage: 5 };
  }

  try {
    const prompt = `
      第 ${turnCount} 回合全球事件。
      
      目标群体: ${isPartial ? '部分特定人群 (如穷人、富人、地主)' : '所有人 (ALL)'}
      
      返回 JSON:
      {
        "title": "事件名",
        "description": "描述",
        "target": "${isPartial ? '从 POOR, RICH, LANDLORDS, ODD_ID 中选一个' : 'ALL'}",
        "effectPercentage": 数字 (-30 到 30, 代表现金变化百分比)
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");
    return {
        title: data.title || "时代变迁",
        description: data.description || "...",
        target: data.target || "ALL",
        effectPercentage: data.effectPercentage || 0
    };
  } catch (e) {
      return { title: "平稳", description: "无事发生", target: "ALL", effectPercentage: 0 };
  }
}

export const generateBlackSwanEvent = async (): Promise<{ title: string; description: string; action: 'WIPE_CASH' | 'WIPE_PROPERTY' | 'SWAP_MONEY' | 'SUPER_TAX' }> => {
  if (!ai) {
    return { title: "黑天鹅", description: "无事发生。", action: 'SUPER_TAX' };
  }
  try {
    const prompt = `
      生成一个极低概率但破坏性极强的大富翁“黑天鹅”事件。
      返回 JSON:
      {
        "title": "恐怖标题",
        "description": "描述",
        "action": "WIPE_CASH" | "WIPE_PROPERTY" | "SWAP_MONEY" | "SUPER_TAX"
      }
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || "{}");
    return {
        title: data.title || "灾难",
        description: data.description || "...",
        action: data.action || "SUPER_TAX"
    };
  } catch(e) {
    return { title: "错误", description: "...", action: "SUPER_TAX" };
  }
}
