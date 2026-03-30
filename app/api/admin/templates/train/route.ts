import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeInvoiceTemplate } from "@/lib/template-analyzer";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Backend Controller for Template Training Lab
 * /api/admin/templates/train
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const bankId = formData.get("bankId") as string;
    const file = formData.get("file") as File;

    if (!bankId || !file) {
      return NextResponse.json({ error: "bankId and file are required" }, { status: 400 });
    }

    // 1. Storage setup
    const uploadDir = path.join(process.cwd(), "public", "uploads", "templates");
    await fs.mkdir(uploadDir, { recursive: true });

    const fileExt = path.extname(file.name);
    const fileName = `${bankId}_${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // 2. Persist the template background PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // 3. Initiate AI Analysis
    let blueprint;
    try {
      blueprint = await analyzeInvoiceTemplate(filePath);
    } catch (err: any) {
      console.error("AI Mapping failed:", err.message);
      return NextResponse.json({ 
        error: "AI Mapping failed. Check Azure credentials.", 
        details: err.message 
      }, { status: 500 });
    }

    // 4. Record the new blueprint in the Database
    const template = await prisma.bankTemplate.create({
      data: {
        bankId,
        templateType: "pdf_cloned", // Indicates that this was 'taught' via AI
        fileName: file.name,
        filePath: `/uploads/templates/${fileName}`,
        extractedFields: JSON.stringify(blueprint), // The spatial X/Y blueprint
        isActive: true,
      },
    });

    // 5. Update the Bank record to use this custom format
    await prisma.bank.update({
      where: { id: bankId },
      data: { templateType: "custom" }
    });

    return NextResponse.json({ 
      success: true, 
      template: template,
      fieldsDetected: Object.keys(blueprint.fields).length 
    });

  } catch (error: any) {
    console.error("Template training error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
