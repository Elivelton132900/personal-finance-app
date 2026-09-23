import 'dotenv/config'; // Garante que o .env seja lido
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const rawData1 = fs.readFileSync(path.resolve(__dirname, './data.json'), 'utf-8');
  const data1 = JSON.parse(rawData1);

  const rawData2 = fs.readFileSync(path.resolve(__dirname, './new_user_test.json'), 'utf-8');
  const data2 = JSON.parse(rawData2);

  console.log('Limpando banco de dados...');
  await prisma.transactions.deleteMany();
  await prisma.pots.deleteMany();
  await prisma.budgets.deleteMany();
  await prisma.users.deleteMany();

  const saltRounds = 10;
  const encryptedPassword = await bcrypt.hash('123456', saltRounds);


  console.log('Criando usuário 1 (Admin Teste)...');
  const user1 = await prisma.users.create({
    data: {
      name: 'Admin Teste',
      email: 'admin@teste.com',
      password_hash: encryptedPassword,
      current_balance: data1.balance.current,
      income: data1.balance.income,
      expenses: data1.balance.expenses,
    },
  });

  const transactionsData1 = data1.transactions.map((t) => ({
    avatar: t.avatar,
    name: t.name,
    category: t.category,
    created_at: new Date(t.date),
    amount: t.amount,
    recurring: t.recurring,
    fk_iduser: user1.iduser,
  }));
  await prisma.transactions.createMany({ data: transactionsData1 });

  const budgetsData1 = data1.budgets.map((b) => ({
    category: b.category,
    maximum: b.maximum,
    theme: b.theme,
    fk_iduser: user1.iduser,
  }));
  await prisma.budgets.createMany({ data: budgetsData1 });

  const potsData1 = data1.pots.map((p) => ({
    name: p.name,
    target: p.target,
    total: p.total,
    theme: p.theme,
    fk_iduser: user1.iduser,
  }));
  await prisma.pots.createMany({ data: potsData1 });


  console.log('Criando usuário 2 (Lucas Silva)...');
  const user2 = await prisma.users.create({
    data: {
      name: 'Lucas Silva',
      email: 'lucas@teste.com',
      password_hash: encryptedPassword,
      current_balance: data2.balance.current,
      income: data2.balance.income,
      expenses: data2.balance.expenses,
    },
  });

  const transactionsData2 = data2.transactions.map((t) => ({
    avatar: t.avatar,
    name: t.name,
    category: t.category,
    created_at: new Date(t.date),
    amount: t.amount,
    recurring: t.recurring,
    fk_iduser: user2.iduser,
  }));
  await prisma.transactions.createMany({ data: transactionsData2 });

  const budgetsData2 = data2.budgets.map((b) => ({
    category: b.category,
    maximum: b.maximum,
    theme: b.theme,
    fk_iduser: user2.iduser,
  }));
  await prisma.budgets.createMany({ data: budgetsData2 });

  const potsData2 = data2.pots.map((p) => ({
    name: p.name,
    target: p.target,
    total: p.total,
    theme: p.theme,
    fk_iduser: user2.iduser,
  }));
  await prisma.pots.createMany({ data: potsData2 });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
