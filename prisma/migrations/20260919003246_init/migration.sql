-- CreateTable
CREATE TABLE "Users" (
    "iduser" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "current_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "income" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expenses" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("iduser")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "idtransaction" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT,
    "category" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "fk_iduser" VARCHAR(32) NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("idtransaction")
);

-- CreateTable
CREATE TABLE "Pots" (
    "idpot" VARCHAR(32) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "target" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "theme" VARCHAR(20) NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "fk_iduser" VARCHAR(32) NOT NULL,

    CONSTRAINT "Pots_pkey" PRIMARY KEY ("idpot")
);

-- CreateTable
CREATE TABLE "Budgets" (
    "idbudget" VARCHAR(32) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "theme" VARCHAR(20) NOT NULL,
    "maximum" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fk_iduser" VARCHAR(32) NOT NULL,

    CONSTRAINT "Budgets_pkey" PRIMARY KEY ("idbudget")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_name_key" ON "Users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "fk_iduser_transactions_idx" ON "Transactions"("fk_iduser");

-- CreateIndex
CREATE INDEX "fk_iduser_pots_idx" ON "Pots"("fk_iduser");

-- CreateIndex
CREATE INDEX "fk_iduser_budgets_idx" ON "Budgets"("fk_iduser");

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_fk_iduser_fkey" FOREIGN KEY ("fk_iduser") REFERENCES "Users"("iduser") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pots" ADD CONSTRAINT "Pots_fk_iduser_fkey" FOREIGN KEY ("fk_iduser") REFERENCES "Users"("iduser") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budgets" ADD CONSTRAINT "Budgets_fk_iduser_fkey" FOREIGN KEY ("fk_iduser") REFERENCES "Users"("iduser") ON DELETE RESTRICT ON UPDATE CASCADE;
