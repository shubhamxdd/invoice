import { User as PrismaUser, Company as PrismaCompany, Bank as PrismaBank, MisFile as PrismaMisFile, MisRecord as PrismaMisRecord, InvoiceBatch as PrismaInvoiceBatch, InvoiceFile as PrismaInvoiceFile, BankTemplate as PrismaBankTemplate } from "@prisma/client";

export type User = PrismaUser;
export type Company = PrismaCompany;
export type Bank = PrismaBank;
export type MisFile = PrismaMisFile;
export type MisRecord = PrismaMisRecord;
export type InvoiceBatch = PrismaInvoiceBatch;
export type InvoiceFile = PrismaInvoiceFile;
export type BankTemplate = PrismaBankTemplate;

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: string;
  name?: string | null;
  image?: string | null;
}
