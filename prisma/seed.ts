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
