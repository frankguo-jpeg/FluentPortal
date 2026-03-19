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
        aiSupportPercent: parseFloat((Math.random() * 70 + 10).toFixed(1)),
        supportCostRevenue: parseFloat((Math.random() * 20 + 3).toFixed(1)),
        npsCsat: Math.floor(Math.random() * 50 + 45),
        firstContactResolution: parseFloat((Math.random() * 40 + 55).toFixed(1)),
        avgTimeToResolution: parseFloat((Math.random() * 20 + 0.5).toFixed(1)),
        repeatContactRate: parseFloat((Math.random() * 25 + 5).toFixed(1)),
        ticketDeflectionRate: parseFloat((Math.random() * 55 + 20).toFixed(1)),
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

  // Create sample AI rankings for week 11
  const rankingReasons = [
    "Exceptional AI integration with measurable 65% automation rate in support. Strong adoption of RAG architecture shows forward-thinking approach.",
    "Successful monolith-to-microservices migration with daily deployments. GitHub Copilot adoption driving measurable productivity gains.",
    "Innovative natural language querying feature using Claude API. PostgreSQL migration shows good technical decision-making.",
    "Strong DevOps maturity with 82% reduction in build times. Full TypeScript migration with 70% fewer runtime errors is impressive.",
    "Excellent frontend modernization from jQuery to Next.js. AI chatbot handling 40% of pre-sales shows creative use of technology.",
    "Real-time data pipeline with Kafka/Redis is a significant infrastructure upgrade. Sub-2-second dashboard updates are best-in-class.",
    "Design system adoption cutting dev time by 50%. AWS Well-Architected Review shows commitment to operational excellence.",
    "OpenTelemetry implementation drastically improving MTTR. AI-assisted onboarding with 73% improvement in activation rate is outstanding.",
    "Semantic search with vector embeddings is cutting-edge. Infrastructure as Code adoption is a strong operational improvement.",
    "Document processing with 97% accuracy is production-ready AI. Monorepo migration with Turborepo shows modern engineering practices.",
    "Feature flag adoption enabling 3x feature velocity with zero rollbacks. Internal AI assistant reducing onboarding time is innovative.",
    "GraphQL migration improving data fetching efficiency by 40%. Playwright adoption achieving 85% E2E coverage is excellent.",
  ];

  const suggestions: Record<string, string> = {};
  const rankings: Array<{ companyId: string; companyName: string; rank: number; score: number; reasoning: string }> = [];

  // Shuffle companies for ranking and assign scores
  const shuffled = [...allCompanies].sort(() => Math.random() - 0.5);
  shuffled.forEach((company, i) => {
    const score = Math.max(45, 95 - i * 2 - Math.floor(Math.random() * 5));
    rankings.push({
      companyId: company.id,
      companyName: company.name,
      rank: i + 1,
      score,
      reasoning: rankingReasons[i % rankingReasons.length],
    });
    const suggestionPool = [
      "Consider implementing automated regression testing to maintain quality as deployment frequency increases.",
      "Explore edge computing solutions to reduce latency for your growing international customer base.",
      "Invest in observability tooling (distributed tracing, structured logging) to support your microservices architecture.",
      "Consider adopting a feature flag system to enable safer progressive rollouts of new AI features.",
      "Look into implementing a data mesh architecture to better handle your growing real-time data needs.",
      "Evaluate serverless computing for batch workloads to optimize cloud costs while maintaining scalability.",
      "Consider building an internal developer platform to accelerate onboarding and reduce cognitive load.",
      "Explore implementing chaos engineering practices to improve system resilience and incident preparedness.",
    ];
    suggestions[company.id] = suggestionPool[i % suggestionPool.length];
  });

  // Get a random update ID for the insight
  const sampleUpdate = await prisma.weeklyUpdate.findFirst({ where: { weekNumber: 11, year: 2026 } });

  await prisma.aIRanking.upsert({
    where: { weekNumber_year: { weekNumber: 11, year: 2026 } },
    update: {
      rankings: JSON.stringify(rankings),
      insightOfWeek: "This week's standout trend is the rapid adoption of AI-powered automation across the portfolio. Multiple companies reported significant efficiency gains from integrating Claude and other AI tools into their workflows — from customer support automation achieving 65% autonomous resolution rates, to AI-assisted onboarding flows improving activation by 73%. Companies that paired AI adoption with strong engineering foundations (TypeScript migration, CI/CD maturity, observability) saw the most compounding benefits.",
      insightUpdateId: sampleUpdate?.id || null,
      suggestions: JSON.stringify(suggestions),
    },
    create: {
      weekNumber: 11,
      year: 2026,
      rankings: JSON.stringify(rankings),
      insightOfWeek: "This week's standout trend is the rapid adoption of AI-powered automation across the portfolio. Multiple companies reported significant efficiency gains from integrating Claude and other AI tools into their workflows — from customer support automation achieving 65% autonomous resolution rates, to AI-assisted onboarding flows improving activation by 73%. Companies that paired AI adoption with strong engineering foundations (TypeScript migration, CI/CD maturity, observability) saw the most compounding benefits.",
      insightUpdateId: sampleUpdate?.id || null,
      suggestions: JSON.stringify(suggestions),
    },
  });

  console.log("  Created AI rankings for week 11");
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
