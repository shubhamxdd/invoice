/*
  Warnings:

  - You are about to drop the column `blueprint` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `mapping` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `sampleName` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `samplePath` on the `BankTemplate` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `BankTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `BankTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bank" ADD COLUMN "stateCode" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BankTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'pdf',
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "docClassifier" TEXT,
    "azureModelId" TEXT,
    "extractedFields" TEXT,
    "masks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankTemplate_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BankTemplate" ("bankId", "createdAt", "id", "isActive", "templateType", "updatedAt", "uploadedBy") SELECT "bankId", "createdAt", "id", "isActive", "templateType", "updatedAt", "uploadedBy" FROM "BankTemplate";
DROP TABLE "BankTemplate";
ALTER TABLE "new_BankTemplate" RENAME TO "BankTemplate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
