/*
  Warnings:

  - A unique constraint covering the columns `[bankId]` on the table `BankTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BankTemplate_bankId_key" ON "BankTemplate"("bankId");
