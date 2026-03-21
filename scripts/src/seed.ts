import { db, plansTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const plans = [
  { name: "Starter", depositRequired: "45", tasksPerDay: 3, gainPerTask: "10", totalPerDay: "30" },
  { name: "Basic", depositRequired: "60", tasksPerDay: 4, gainPerTask: "13", totalPerDay: "52" },
  { name: "Silver", depositRequired: "80", tasksPerDay: 4, gainPerTask: "18", totalPerDay: "72" },
  { name: "Gold", depositRequired: "120", tasksPerDay: 5, gainPerTask: "25", totalPerDay: "125" },
  { name: "Platinum", depositRequired: "180", tasksPerDay: 5, gainPerTask: "35", totalPerDay: "175" },
  { name: "Diamond", depositRequired: "250", tasksPerDay: 6, gainPerTask: "50", totalPerDay: "300" },
  { name: "VIP Elite", depositRequired: "400", tasksPerDay: 7, gainPerTask: "80", totalPerDay: "560" },
];

console.log("Seeding plans...");
for (const plan of plans) {
  const existing = await db.select().from(plansTable).where(eq(plansTable.name, plan.name)).limit(1);
  if (existing.length === 0) {
    await db.insert(plansTable).values(plan);
    console.log(`Created plan: ${plan.name}`);
  } else {
    console.log(`Plan already exists: ${plan.name}`);
  }
}

console.log("Seeding admin user...");
const adminEmail = "admin@taskcoin.com";
const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
if (existing.length === 0) {
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

console.log("Seeding complete!");
process.exit(0);
