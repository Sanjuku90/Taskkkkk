import { db, plansTable, usersTable, bonusCatalogTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const plans = [
  { name: "Starter", depositRequired: "45", tasksPerDay: 3, gainPerTask: "7", totalPerDay: "21" },
  { name: "Basic", depositRequired: "60", tasksPerDay: 4, gainPerTask: "9", totalPerDay: "36" },
  { name: "Silver", depositRequired: "80", tasksPerDay: 4, gainPerTask: "12", totalPerDay: "48" },
  { name: "Gold", depositRequired: "120", tasksPerDay: 5, gainPerTask: "17", totalPerDay: "85" },
  { name: "Platinum", depositRequired: "180", tasksPerDay: 5, gainPerTask: "23", totalPerDay: "115" },
  { name: "Diamond", depositRequired: "250", tasksPerDay: 6, gainPerTask: "33", totalPerDay: "198" },
  { name: "VIP Elite", depositRequired: "400", tasksPerDay: 7, gainPerTask: "54", totalPerDay: "378" },
];

console.log("Seeding plans...");
for (const plan of plans) {
  const existing = await db.select().from(plansTable).where(eq(plansTable.name, plan.name)).limit(1);
  if (existing.length === 0) {
    await db.insert(plansTable).values(plan);
    console.log(`Created plan: ${plan.name}`);
  } else {
    await db.update(plansTable).set({
      depositRequired: plan.depositRequired,
      tasksPerDay: plan.tasksPerDay,
      gainPerTask: plan.gainPerTask,
      totalPerDay: plan.totalPerDay,
    }).where(eq(plansTable.name, plan.name));
    console.log(`Updated plan: ${plan.name}`);
  }
}

console.log("Seeding admin user...");
const adminEmail = "admin@taskcoin.com";
const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
if (existingAdmin.length === 0) {
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db.insert(usersTable).values({
    email: adminEmail,
    username: "Admin",
    passwordHash,
    isAdmin: true,
    balance: "0",
  });
  console.log("Admin user created: admin@taskcoin.com / admin123");
} else {
  console.log("Admin user already exists");
}

console.log("Seeding bonus catalog...");
const catalogEntries = [
  {
    type: "referral" as const,
    title: "Invite a Friend",
    description: "Invite a friend who registers using your personal referral link. They must actually create an account for the bonus to be unlocked.",
    reward: "20",
    conditionValue: "1",
  },
  {
    type: "referral" as const,
    title: "Refer 3 Friends",
    description: "Invite 3 friends who each register using your referral link. All 3 must complete their registration.",
    reward: "75",
    conditionValue: "3",
  },
  {
    type: "first_deposit" as const,
    title: "First Deposit Bonus",
    description: "Make your very first deposit on the platform. Your deposit must be validated and approved by the admin.",
    reward: "10",
    conditionValue: "1",
  },
  {
    type: "deposit_milestone" as const,
    title: "Deposit $100",
    description: "Reach a total of $100 in approved deposits. All your deposits count toward this total.",
    reward: "15",
    conditionValue: "100",
  },
  {
    type: "deposit_milestone" as const,
    title: "Deposit $250",
    description: "Reach a total of $250 in approved deposits. All your deposits count toward this total.",
    reward: "35",
    conditionValue: "250",
  },
  {
    type: "deposit_milestone" as const,
    title: "Deposit $500",
    description: "Reach a total of $500 in approved deposits. A major milestone rewarded with a generous bonus.",
    reward: "80",
    conditionValue: "500",
  },
  {
    type: "plan_activation" as const,
    title: "Activate Your First Plan",
    description: "Purchase and activate any investment plan. Your plan must be set as active on your account.",
    reward: "5",
    conditionValue: "1",
  },
  {
    type: "task_streak" as const,
    title: "3-Day Task Streak",
    description: "Complete at least one daily task every day for 3 consecutive days. Keep your streak alive!",
    reward: "25",
    conditionValue: "3",
  },
  {
    type: "task_streak" as const,
    title: "7-Day Task Streak",
    description: "Complete at least one daily task every day for 7 consecutive days. A week of dedication rewarded!",
    reward: "70",
    conditionValue: "7",
  },
];

for (const entry of catalogEntries) {
  const existing = await db
    .select()
    .from(bonusCatalogTable)
    .where(eq(bonusCatalogTable.title, entry.title))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(bonusCatalogTable).values(entry);
    console.log(`Created catalog bonus: ${entry.title}`);
  } else {
    console.log(`Catalog bonus already exists: ${entry.title}`);
  }
}

console.log("Seeding complete!");
process.exit(0);
