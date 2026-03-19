import { z } from "zod";

export const METRIC_TEMPLATES = [
  { key: "aiSupportPercent", label: "% Support Handled by AI", unit: "%", description: "Tickets resolved by AI without human escalation" },
  { key: "supportCostRevenue", label: "Support Cost / Revenues", unit: "%", description: "Support costs as a percentage of total revenue" },
  { key: "npsCsat", label: "NPS/CSAT Score", unit: "score", description: "Customer satisfaction score (0-100)" },
  { key: "firstContactResolution", label: "First Contact Resolution", unit: "%", description: "Tickets resolved on first contact" },
  { key: "avgTimeToResolution", label: "Avg Resolution Time", unit: "hrs", description: "Average hours to resolve a ticket" },
  { key: "repeatContactRate", label: "Repeat Contact Rate", unit: "%", description: "Percentage of follow-up or reopened tickets" },
  { key: "ticketDeflectionRate", label: "Ticket Deflection Rate", unit: "%", description: "Tickets deflected via self-service or AI" },
] as const;

export type MetricKey = (typeof METRIC_TEMPLATES)[number]["key"];

export const metricsSchema = z.object({
  aiSupportPercent: z.number().min(0).max(100).nullable().optional(),
  supportCostRevenue: z.number().min(0).nullable().optional(),
  npsCsat: z.number().min(0).max(100).nullable().optional(),
  firstContactResolution: z.number().min(0).max(100).nullable().optional(),
  avgTimeToResolution: z.number().min(0).nullable().optional(),
  repeatContactRate: z.number().min(0).max(100).nullable().optional(),
  ticketDeflectionRate: z.number().min(0).max(100).nullable().optional(),
});

export type Metrics = z.infer<typeof metricsSchema>;
