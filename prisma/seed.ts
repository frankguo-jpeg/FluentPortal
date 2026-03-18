/* eslint-disable @typescript-eslint/no-require-imports */
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

const companies = [
  "Flexigrant",
  "TDO Software",
  "Shelton Development Services",
  "WeSuite",
  "Futura SI",
  "Vocantas",
  "Vigilix",
  "JBL & Trendex",
  "WSI Technologies",
  "Infogroen",
  "Protecmedia",
  "DemandBridge",
  "Telematel & Ingenieria",
  "MWM",
  "Azility",
  "CollectionHQ",
  "American Data",
  "Thatcher",
  "PenguinData",
  "Kivuto",
  "M&I",
  "Cybertill",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcryptjs.hash("password123", 10);

  for (const name of companies) {
    const slug = slugify(name);
    const company = await prisma.company.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });

    await prisma.user.upsert({
      where: { email: `admin@${slug}.com` },
      update: {},
      create: {
        email: `admin@${slug}.com`,
        passwordHash,
        name: `${name} Admin`,
        role: "COMPANY_ADMIN",
        companyId: company.id,
      },
    });

    console.log(`  Created ${name} (${slug})`);
  }

  await prisma.user.upsert({
    where: { email: "manager@valsoft.com" },
    update: {},
    create: {
      email: "manager@valsoft.com",
      passwordHash,
      name: "Fluent Manager",
      role: "MANAGER",
    },
  });

  console.log("  Created manager@valsoft.com");

  // Create sample weekly updates for weeks 9-11 (past 3 weeks)
  const sampleDetails = [
    "Integrated Claude AI into our customer support pipeline — ticket resolution time dropped from 4 hours to 22 minutes. The AI handles 65% of L1 tickets autonomously now. Engineering team is building a Retrieval-Augmented Generation (RAG) system on top of our knowledge base to improve accuracy further.",
    "Migrated our legacy monolith to a microservices architecture using Kubernetes and Terraform. Deployment frequency went from monthly to daily. Adopted GitHub Copilot across the dev team which has boosted PR throughput by 35%. Currently evaluating Anthropic's API for automated code review.",
    "Launched an AI-powered predictive analytics module using Claude for natural language querying of dashboards. Customers can now ask questions in plain English instead of writing SQL. Early adopters report 3x faster insight discovery. Also migrated our database from MySQL to PostgreSQL for better JSON support.",
    "Implemented a CI/CD pipeline with automated testing using Docker and GitHub Actions. Build times reduced from 45 minutes to 8 minutes. Adopted TypeScript across the entire codebase — runtime errors in production dropped by 70%. Exploring vector databases (Pinecone) for semantic search.",
    "Deployed a new React frontend with Next.js replacing our legacy jQuery UI. Page load times improved from 6s to 800ms. Integrated Stripe Connect for marketplace payments. The AI chatbot we built using Claude handles 40% of pre-sales questions, freeing up the sales team significantly.",
    "Built a real-time data pipeline using Apache Kafka and Redis for event streaming. Customer-facing dashboards now update in under 2 seconds vs 30-minute batch jobs before. Started using Vercel for frontend deployments — zero-downtime releases are now the norm.",
    "Adopted Tailwind CSS and a design system approach which cut UI development time by 50%. Implemented end-to-end encryption for all customer data using modern cryptographic libraries. Completed AWS Well-Architected Review — migrated 3 workloads to serverless Lambda functions saving $12K/month.",
    "Integrated OpenTelemetry for distributed tracing across all services. Mean time to resolution (MTTR) for incidents dropped from 2 hours to 15 minutes. Rolled out an AI-assisted onboarding flow using Claude that guides new users through setup — activation rate improved from 45% to 78%.",
    "Rebuilt our search infrastructure using Elasticsearch with vector embeddings for semantic search. Search relevance scores improved by 4x. Adopted Infrastructure as Code (Terraform + Pulumi) — environment provisioning now takes 10 minutes instead of 2 days. Team completed AWS certification training.",
    "Launched a GPT-powered document processing feature that extracts structured data from PDFs and invoices with 97% accuracy. Replaced manual data entry for 200+ enterprise customers. Migrated to a monorepo structure using Turborepo — build caching reduced CI times by 60%. Adopted Prisma ORM for type-safe database access.",
    "Implemented a feature flag system using LaunchDarkly enabling safe progressive rollouts. Shipped 3x more features this quarter with zero rollbacks. Built an internal AI assistant using Claude that helps engineers search documentation and debug issues — average onboarding time for new hires reduced from 3 weeks to 5 days.",
    "Completed migration from REST to GraphQL APIs using Apollo Server. Frontend data fetching is now 40% more efficient with fewer over-fetching issues. Adopted Playwright for E2E testing — test coverage went from 30% to 85%. Exploring edge computing with Cloudflare Workers for latency-sensitive endpoints.",
  ];

  const allCompanies = await prisma.company.findMany();
  let updateCount = 0;

  for (const company of allCompanies) {
    // Each company gets updates for weeks 9, 10, 11
    for (const weekNum of [9, 10, 11]) {
      const existing = await prisma.weeklyUpdate.findUnique({
        where: { companyId_weekNumber_year: { companyId: company.id, weekNumber: weekNum, year: 2026 } },
      });
      if (existing) continue;

      const detailIndex = (allCompanies.indexOf(company) + weekNum) % sampleDetails.length;
      const metrics = JSON.stringify({
        revenueGrowth: parseFloat((Math.random() * 20 - 5).toFixed(1)),
        customerAcquisition: Math.floor(Math.random() * 50) + 5,
        techDebtReduction: parseFloat((Math.random() * 30).toFixed(1)),
        uptime: parseFloat((99 + Math.random()).toFixed(2)),
      });

      // Set submittedAt to the Monday of that week
      const jan1 = new Date(2026, 0, 1);
      const dayOffset = (weekNum - 1) * 7 - jan1.getDay() + 1;
      const weekDate = new Date(2026, 0, 1 + dayOffset + Math.floor(Math.random() * 5));

      await prisma.weeklyUpdate.create({
        data: {
          companyId: company.id,
          weekNumber: weekNum,
          year: 2026,
          metrics,
          details: sampleDetails[detailIndex],
          submittedAt: weekDate,
        },
      });
      updateCount++;
    }
  }

  console.log(`  Created ${updateCount} sample weekly updates`);
  console.log("Seeding complete!");
  console.log("\nDefault password for all accounts: password123");
}

main()
  .catch((e: Error) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
