import { PrismaClient, Role, PetSize, CoatType, MembershipTierName, DayOfWeek } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Nimbus database...");

  // 1. Staff Members
  const owner = await prisma.staff.upsert({
    where: { email: "owner@doglab.com" },
    update: {},
    create: {
      name: "Doglab Admin",
      email: "owner@doglab.com",
      phone: "+65 9000 0000",
      role: Role.OWNER,
    },
  });

  const groomer1 = await prisma.staff.upsert({
    where: { email: "amy@doglab.com" },
    update: {},
    create: {
      name: "Amy Chen",
      email: "amy@doglab.com",
      phone: "+65 9111 2222",
      role: Role.GROOMER,
    },
  });

  const groomer2 = await prisma.staff.upsert({
    where: { email: "ben@doglab.com" },
    update: {},
    create: {
      name: "Ben Tan",
      email: "ben@doglab.com",
      phone: "+65 9222 3333",
      role: Role.GROOMER,
    },
  });

  const receptionist = await prisma.staff.upsert({
    where: { email: "cindy@doglab.com" },
    update: {},
    create: {
      name: "Cindy Ong",
      email: "cindy@doglab.com",
      phone: "+65 9333 4444",
      role: Role.RECEPTIONIST,
    },
  });

  // 2. Default Services
  const servicesData = [
    { name: "Full Grooming", description: "Bath, blow dry, full styling & haircut, ear cleaning, nail trim", duration: 120 },
    { name: "Basic Grooming", description: "Bath, blow dry, sanitary trim, paw pad shave, ear cleaning, nail trim", duration: 75 },
    { name: "Shower Only", description: "Shampoo bath and blow dry only", duration: 45 },
    { name: "Express Grooming", description: "Fast priority turnaround grooming", duration: 60 },
    { name: "Medicated Treatment", description: "Specialized medicated bath for skin conditions", duration: 45 },
    { name: "Nail Trim", description: "Nail clipping and filing", duration: 15 },
    { name: "Teeth Cleaning", description: "Teeth brushing and breath freshening", duration: 20 },
    { name: "De-shedding", description: "Undercoat blowout and thorough brush out", duration: 60 },
  ];

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        name: s.name,
        description: s.description,
        defaultDurationMinutes: s.duration,
      },
    });
  }

  // 3. Membership Tiers (from client spec)
  const tiers = [
    {
      name: MembershipTierName.BASIC,
      displayName: "Basic Membership",
      price: 480,
      bonusCredits: 20,
      totalCredits: 500,
      validityMonths: 6,
      hasQueuePriority: false,
      allowances: [{ addonName: "Spa Therapy or Medicated Treatment Add-on", quantity: 1 }],
    },
    {
      name: MembershipTierName.STANDARD,
      displayName: "Standard Membership",
      price: 760,
      bonusCredits: 40,
      totalCredits: 800,
      validityMonths: 6,
      hasQueuePriority: false,
      allowances: [{ addonName: "Spa Therapy or Medicated Treatment Add-on", quantity: 2 }],
    },
    {
      name: MembershipTierName.VIP,
      displayName: "VIP Membership",
      price: 1400,
      bonusCredits: 100,
      totalCredits: 1500,
      validityMonths: 12,
      hasQueuePriority: true,
      allowances: [
        { addonName: "Spa Therapy or Medicated Treatment Add-on", quantity: 4 },
        { addonName: "Nose & Paw Defense or Tear Stain Lift", quantity: 2 },
      ],
    },
    {
      name: MembershipTierName.SVIP,
      displayName: "SVIP Membership",
      price: 2300,
      bonusCredits: 200,
      totalCredits: 2500,
      validityMonths: 12,
      hasQueuePriority: true,
      allowances: [
        { addonName: "Spa Therapy or Medicated Treatment Add-on", quantity: 8 },
        { addonName: "Nose & Paw Defense or Tear Stain Lift", quantity: 4 },
      ],
    },
  ];

  for (const tier of tiers) {
    const createdTier = await prisma.membershipTier.upsert({
      where: { name: tier.name },
      update: {},
      create: {
        name: tier.name,
        displayName: tier.displayName,
        price: tier.price,
        bonusCredits: tier.bonusCredits,
        totalCredits: tier.totalCredits,
        validityMonths: tier.validityMonths,
        hasQueuePriority: tier.hasQueuePriority,
      },
    });

    for (const a of tier.allowances) {
      await prisma.addOnAllowanceTemplate.create({
        data: {
          membershipTierId: createdTier.id,
          addonName: a.addonName,
          quantity: a.quantity,
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
