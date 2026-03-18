import Anthropic from "@anthropic-ai/sdk";
import { RANKING_SYSTEM_PROMPT, buildRankingPrompt } from "./ai-prompts";

const anthropic = new Anthropic();

interface RankingResult {
  rankings: Array<{
    companyId: string;
    companyName: string;
    rank: number;
    score: number;
    reasoning: string;
  }>;
  insightOfWeek: {
    updateId: string;
    companyName: string;
    summary: string;
  };
  suggestions: Record<string, string>;
}

export async function generateWeeklyRanking(
  updates: Array<{
    id: string;
    companyId: string;
    companyName: string;
    metrics: Record<string, number | null>;
    details: string;
  }>
): Promise<RankingResult> {
  if (updates.length === 0) {
    throw new Error("No updates to rank");
  }

  const prompt = buildRankingPrompt(updates);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: RANKING_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0];
  if (text.type !== "text") throw new Error("Unexpected response type");

  const result: RankingResult = JSON.parse(text.text);

  // Sort by rank
  result.rankings.sort((a, b) => a.rank - b.rank);

  return result;
}
