export const RANKING_SYSTEM_PROMPT = `You are an AI analyst for Fluent's portfolio company progress tracking system. You evaluate weekly company updates and rank them by quantifiable impact.

You must respond with valid JSON only, no other text. Follow this exact schema:

{
  "rankings": [
    {
      "companyId": "string",
      "companyName": "string",
      "rank": number,
      "score": number (0-100),
      "reasoning": "string (2-3 sentences explaining the ranking)"
    }
  ],
  "insightOfWeek": {
    "updateId": "string",
    "companyName": "string",
    "summary": "string (2-3 sentences summarizing the most insightful finding that other companies can learn from)"
  },
  "suggestions": {
    "<companyId>": "string (personalized improvement suggestion referencing what top performers did)"
  }
}`;

export function buildRankingPrompt(updates: Array<{
  id: string;
  companyId: string;
  companyName: string;
  metrics: Record<string, number | null>;
  details: string;
}>): string {
  const updateSummaries = updates.map((u, i) => {
    const metrics = Object.entries(u.metrics)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    return `Company ${i + 1}: ${u.companyName} (ID: ${u.companyId}, Update ID: ${u.id})
Metrics: ${metrics || "None provided"}
Details: ${u.details}`;
  }).join("\n\n");

  return `Analyze these weekly company updates and rank ALL companies by quantifiable impact.

Ranking criteria (in order of importance):
1. Support AI adoption maturity (% support handled by AI, ticket deflection rate)
2. Customer satisfaction outcomes (NPS/CSAT, first contact resolution rate)
3. Operational efficiency gains (support cost ratio, avg resolution time, repeat contact rate)
4. Novelty and effectiveness of approach
5. Potential applicability of their strategies to other companies

For companies not ranked #1, provide a personalized improvement suggestion that references specific strategies used by top-performing companies. Be specific and actionable.

For the "Insight of the Week", pick the single most valuable learning that other portfolio companies could benefit from.

Here are the updates:

${updateSummaries}

Respond with valid JSON only.`;
}
