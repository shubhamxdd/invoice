import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function onboard() {
  const rootDir = "c:\\Users\\Shubham\\Desktop\\w\\kec-invoicegen\\ref\\formats\\Invoice Format\\Invoice Format";
  
  try {
    const folders = await fs.readdir(rootDir, { withFileTypes: true });
    
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const bankName = folder.name;
        const folderPath = path.join(rootDir, bankName);
        
        // Find files in the folder
        const files = await fs.readdir(folderPath);
        const pdfFile = files.find(f => f.toLowerCase().endsWith(".pdf"));
        const excelFile = files.find(f => f.toLowerCase().endsWith(".xlsx") || f.toLowerCase().endsWith(".xls"));
        
        console.log(`Processing: ${bankName}`);
        
        // 1. Create Bank
        const bank = await prisma.bank.upsert({
          where: { bankName_branch: { bankName, branch: "Main" } },
          update: {},
          create: {
            bankName,
            branch: "Main",
            isActive: true,
          }
        });
        
        // 2. Create Template if PDF exists
        if (pdfFile) {
          const relativePath = path.relative(process.cwd(), path.join(folderPath, pdfFile));
          await prisma.bankTemplate.upsert({
            where: { id: `auto-${bank.id}-pdf` },
            update: { filePath: relativePath },
            create: {
              id: `auto-${bank.id}-pdf`,
              bankId: bank.id,
              templateType: "pdf",
              fileName: pdfFile,
              filePath: relativePath,
              docClassifier: "Auto-Onboarded",
              isActive: true,
            }
          });
        }
        
        // 3. Create Template if Excel exists
        if (excelFile) {
          const relativePath = path.relative(process.cwd(), path.join(folderPath, excelFile));
          await prisma.bankTemplate.upsert({
            where: { id: `auto-${bank.id}-excel` },
            update: { filePath: relativePath },
            create: {
              id: `auto-${bank.id}-excel`,
              bankId: bank.id,
              templateType: "excel",
              fileName: excelFile,
              filePath: relativePath,
              docClassifier: "Auto-Onboarded",
              isActive: true,
            }
          });
        }
      }
    }
    
    console.log("Onboarding complete!");
  } catch (error) {
    console.error("Onboarding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

onboard();
