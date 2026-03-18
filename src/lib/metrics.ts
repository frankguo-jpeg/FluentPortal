import { z } from "zod";

export const METRIC_TEMPLATES = [
  { key: "revenueGrowth", label: "Revenue Growth", unit: "%", description: "Month-over-month revenue change" },
  { key: "customerAcquisition", label: "New Customers Acquired", unit: "count", description: "New customers this week" },
  { key: "techDebtReduction", label: "Tech Debt Reduction", unit: "%", description: "Percentage of tech debt addressed" },
  { key: "uptime", label: "Uptime", unit: "%", description: "Service availability percentage" },
] as const;

export type MetricKey = (typeof METRIC_TEMPLATES)[number]["key"];

export const metricsSchema = z.object({
  revenueGrowth: z.number().nullable().optional(),
  customerAcquisition: z.number().int().nullable().optional(),
  techDebtReduction: z.number().nullable().optional(),
  uptime: z.number().min(0).max(100).nullable().optional(),
});

export type Metrics = z.infer<typeof metricsSchema>;
