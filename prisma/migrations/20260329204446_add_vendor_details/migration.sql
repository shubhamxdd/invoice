/*
  Warnings:

  - You are about to drop the column `htmlTemplate` on the `BankTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `bankDetails` on the `Company` table. All the data in the column will be lost.

*/
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
INSERT INTO "new_BankTemplate" ("azureModelId", "bankId", "createdAt", "docClassifier", "extractedFields", "fileName", "filePath", "id", "isActive", "templateType", "updatedAt", "uploadedBy") SELECT "azureModelId", "bankId", "createdAt", "docClassifier", "extractedFields", "fileName", "filePath", "id", "isActive", "templateType", "updatedAt", "uploadedBy" FROM "BankTemplate";
DROP TABLE "BankTemplate";
ALTER TABLE "new_BankTemplate" RENAME TO "BankTemplate";
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "udyamNumber" TEXT,
    "sacHsnCode" TEXT,
    "address" TEXT,
    "state" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "logoPath" TEXT,
    "headerPath" TEXT,
    "footerPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("address", "contactEmail", "contactPerson", "contactPhone", "createdAt", "footerPath", "gstNumber", "headerPath", "id", "isActive", "logoPath", "name", "panNumber", "sacHsnCode", "state", "updatedAt") SELECT "address", "contactEmail", "contactPerson", "contactPhone", "createdAt", "footerPath", "gstNumber", "headerPath", "id", "isActive", "logoPath", "name", "panNumber", "sacHsnCode", "state", "updatedAt" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
