/*
  Warnings:

  - You are about to drop the column `azureModelId` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `docClassifier` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `extractedFields` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `masks` on the `BankTemplate` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BankTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'reconstructed',
    "blueprint" TEXT,
    "mapping" TEXT,
    "samplePath" TEXT,
    "sampleName" TEXT,
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
