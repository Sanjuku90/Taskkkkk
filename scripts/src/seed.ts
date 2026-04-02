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
const bonuses = [
  {
    type: "first_deposit" as const,
    title: "Premier dépôt récompensé",
    description: "Effectuez votre premier dépôt approuvé et recevez instantanément un bonus de bienvenue sur votre solde.",
    reward: "10",
    conditionValue: "1",
    isActive: true,
  },
  {
    type: "plan_activation" as const,
    title: "Activation de plan",
    description: "Activez l'un de nos plans d'investissement et démarrez votre parcours de gains quotidiens avec un bonus de démarrage.",
    reward: "15",
    conditionValue: "1",
    isActive: true,
  },
  {
    type: "referral" as const,
    title: "Premier filleul",
    description: "Invitez votre premier ami à rejoindre TaskCoin via votre lien de parrainage. Dès qu'il s'inscrit, vous débloquez ce bonus.",
    reward: "8",
    conditionValue: "1",
    isActive: true,
  },
  {
    type: "referral" as const,
    title: "5 filleuls actifs",
    description: "Ramenez 5 personnes sur la plateforme via votre lien de parrainage et réclamez ce bonus exclusif pour les parrains actifs.",
    reward: "50",
    conditionValue: "5",
    isActive: true,
  },
  {
    type: "referral" as const,
    title: "10 filleuls — Super Parrain",
    description: "Atteignez 10 filleuls inscrits grâce à votre lien et rejoignez le cercle des Super Parrains avec une récompense premium.",
    reward: "120",
    conditionValue: "10",
    isActive: false,
  },
  {
    type: "deposit_milestone" as const,
    title: "Investisseur Bronze — $200 déposés",
    description: "Cumulez $200 de dépôts approuvés et franchissez le premier palier investisseur pour débloquer votre récompense Bronze.",
    reward: "25",
    conditionValue: "200",
    isActive: true,
  },
  {
    type: "deposit_milestone" as const,
    title: "Investisseur Or — $500 déposés",
    description: "Atteignez $500 de dépôts cumulés approuvés et obtenez votre badge Investisseur Or assorti d'un bonus généreux.",
    reward: "60",
    conditionValue: "500",
    isActive: true,
  },
  {
    type: "task_streak" as const,
    title: "7 jours sans relâche",
    description: "Complétez vos tâches quotidiennes 7 jours de suite sans interruption et réclamez votre bonus de régularité.",
    reward: "20",
    conditionValue: "7",
    isActive: true,
  },
];

const existingBonuses = await db.select({ title: bonusCatalogTable.title }).from(bonusCatalogTable);
const existingTitles = new Set(existingBonuses.map(b => b.title));

for (const bonus of bonuses) {
  if (!existingTitles.has(bonus.title)) {
    await db.insert(bonusCatalogTable).values(bonus);
    console.log(`Created bonus: ${bonus.title}`);
  } else {
    console.log(`Bonus already exists: ${bonus.title}`);
  }
}

console.log("Seeding complete!");
process.exit(0);
