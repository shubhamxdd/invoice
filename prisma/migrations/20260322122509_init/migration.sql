-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "sacHsnCode" TEXT,
    "address" TEXT,
    "state" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "logoPath" TEXT,
    "headerPath" TEXT,
    "footerPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "address" TEXT,
    "gstNumber" TEXT,
    "geoCoords" TEXT,
    "bmRep" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "companyId" TEXT,
    "templateType" TEXT NOT NULL DEFAULT 'standard',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BankTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'pdf',
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "docClassifier" TEXT,
    "azureModelId" TEXT,
    "extractedFields" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankTemplate_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MisFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "fileType" TEXT NOT NULL DEFAULT 'xlsx',
    "reportType" TEXT NOT NULL DEFAULT 'Monthly MIS',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MisFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MisRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "misFileId" TEXT NOT NULL,
    "sNo" INTEGER,
    "eepacRefNo" TEXT,
    "appRefNo" TEXT,
    "bankRefNo" TEXT,
    "additionalBankRef" TEXT,
    "applicantName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "caseType" TEXT,
    "bankName" TEXT,
    "customerContact" TEXT,
    "branch" TEXT,
    "rmContact" TEXT,
    "initiationDate" TEXT,
    "time" TEXT,
    "initiatedBy" TEXT,
    "visitDone" TEXT,
    "visitDate" TEXT,
    "reportSent" TEXT,
    "status1" TEXT,
    "status2" TEXT,
    "status3" TEXT,
    "status4" TEXT,
    "visitDoneBy" TEXT,
    "followUpDate" TEXT,
    "specialFee" REAL,
    "serviceLocation" TEXT,
    "branch1" TEXT,
    "month" TEXT,
    "nameOfBankFi" TEXT,
    "status" TEXT,
    "rate" REAL,
    "distance" REAL,
    "conveyance" REAL,
    "additionalFee" REAL,
    "total" REAL,
    "billSent" TEXT,
    "amountReceived" REAL,
    "address1" TEXT,
    "rowIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MisRecord_misFileId_fkey" FOREIGN KEY ("misFileId") REFERENCES "MisFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL DEFAULT 'pdf',
    "filterBank" TEXT,
    "filterBranch" TEXT,
    "filterCaseType" TEXT,
    "filterStatus" TEXT,
    "filterDateFrom" TEXT,
    "filterDateTo" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "zipPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "includeLogo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvoiceBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvoiceBatch_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "bankName" TEXT,
    "branch" TEXT,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceFile_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InvoiceBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_bankName_branch_key" ON "Bank"("bankName", "branch");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBatch_invoiceNo_key" ON "InvoiceBatch"("invoiceNo");
