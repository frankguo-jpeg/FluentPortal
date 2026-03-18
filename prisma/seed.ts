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
    "Shipped new onboarding flow which reduced time-to-value by 40%. Customer feedback has been overwhelmingly positive. Team is now focused on improving the reporting dashboard based on user requests.",
    "Completed migration to new cloud infrastructure. Performance improved by 25% across all endpoints. Started planning Q2 feature roadmap with product team.",
    "Launched beta of AI-powered search feature. Early metrics show 3x improvement in search relevance. Fixed 12 critical bugs reported by enterprise customers.",
    "Rolled out new pricing tier targeting mid-market segment. Initial conversion rates are promising at 8%. Hired two senior engineers to accelerate development.",
    "Integrated with three new payment providers expanding coverage to 15 countries. Customer churn decreased by 2% month-over-month. Team morale is high.",
    "Released mobile app v2.0 with offline support. App store rating improved from 3.8 to 4.5. Working on enterprise SSO integration for Q2 launch.",
    "Completed SOC 2 Type II audit successfully. No critical findings. This unblocks several enterprise deals in the pipeline worth $2M+ ARR.",
    "Redesigned the analytics dashboard based on customer interviews. Beta users report 60% faster insight discovery. Preparing for general availability next week.",
    "Automated deployment pipeline reducing release cycle from 2 weeks to 2 days. Zero downtime deployments now standard. Team velocity increased by 30%.",
    "Closed largest deal in company history — $500K ARR enterprise contract. Customer success team expanded to handle growing account base. NPS score at 72.",
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
