import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { analyzeDocument } from "@/lib/azure-analysis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const bankId = formData.get("bankId") as string;
    const templateType = formData.get("templateType") as string;
    const docClassifier = formData.get("docClassifier") as string;
    const file = formData.get("file") as File;

    if (!bankId || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to public/templates
    const uploadDir = path.join(process.cwd(), "public", "templates");
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // AI Analysis
    let extractedFields = "[]";
    try {
      const analysis = await analyzeDocument(buffer);
      extractedFields = JSON.stringify(analysis.fields);
    } catch (e) {
      console.error("AI Analysis failed, creating template without fields", e);
    }

    const template = await prisma.bankTemplate.create({
      data: {
        bankId,
        templateType: templateType || "pdf",
        docClassifier: docClassifier,
        fileName: file.name,
        filePath: `/templates/${fileName}`,
        extractedFields,
        isActive: true,
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Template creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
