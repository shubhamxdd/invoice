const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Neural Seed Acquisition...");

  // 1. CLEAR EXISTING DATA (Clean slate)
  // await prisma.bankTemplate.deleteMany({});
  // await prisma.bank.deleteMany({});
  // await prisma.company.deleteMany({});

  // 2. USERS
  const hashedAdminPassword = await bcrypt.hash("admin", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@example.com",
      password: hashedAdminPassword,
      fullName: "Admin User",
      role: "admin",
      isActive: true,
    },
  });

  const hashedUserPassword = await bcrypt.hash("user", 10);
  const user = await prisma.user.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      email: "user@example.com",
      password: hashedUserPassword,
      fullName: "Regular User",
      role: "user",
      isActive: true,
    },
  });

  // 3. COMPANIES (Invoicing Entities)
  const company1 = await prisma.company.upsert({
    where: { id: "cl-eepac-main" },
    update: {},
    create: {
      id: "cl-eepac-main",
      name: "EEPAC (INDIA) PRIVATE LIMITED",
      gstNumber: "09AAACE5566G1Z1",
      panNumber: "AAACE5566G",
      cin: "U74140DL2010PTC201654",
      udyamNumber: "UDYAM-UP-00-1234567",
      sacHsnCode: "998311",
      address: "KH NO 519 MUJJAFARPUR KAMBALA BADOT BAGHPAT, UP-250609",
      state: "Uttar Pradesh",
      contactEmail: "info@eepac.com",
      bankName: "HDFC BANK",
      accountNumber: "50200012345678",
      ifscCode: "HDFC0001234",
    },
  });

  const company2 = await prisma.company.upsert({
    where: { id: "cl-kec-projects" },
    update: {},
    create: {
      id: "cl-kec-projects",
      name: "KEC PROJECTS PVT LTD",
      gstNumber: "07AABCK1234F1Z2",
      panNumber: "AABCK1234F",
      cin: "U74140DL2015PTC301010",
      address: "123 Okhla Industrial Area, Phase III, New Delhi-110020",
      state: "Delhi",
      contactEmail: "accounts@kecprojects.com",
      bankName: "ICICI BANK",
      accountNumber: "000705123456",
      ifscCode: "ICIC0000007",
    },
  });

  // 4. BANKS (Extracted from Master MIS.xlsx Patterns)
  const banksToSeed = [
    { name: "PIRAMAL ", branch: "MEERUT", state: "Uttar Pradesh", gst: "09AAECC1234A1Z5" },
    { name: "PIRAMAL ", branch: "HAPUR", state: "Uttar Pradesh", gst: "09AAECC1234A1Z5" },
    { name: "PIRAMAL ", branch: "DELHI", state: "Delhi", gst: "07AAECC1234A1Z1" },
    { name: "HDFC BANK", branch: "NOIDA", state: "Uttar Pradesh", gst: "09AAACH1234B1Z2" },
    { name: "HDFC BANK", branch: "LUCKNOW", state: "Uttar Pradesh", gst: "09AAACH1234B1Z2" },
    { name: "STATE BANK OF INDIA", branch: "GHAZIABAD", state: "Uttar Pradesh", gst: "09AAACS1234C1Z3" },
    { name: "ICICI BANK", branch: "GURGAON", state: "Haryana", gst: "06AAACI1234D1Z4" },
    { name: "Aadhar Housing Finance Limited", branch: "AGRA", state: "Uttar Pradesh", gst: "09AAACA1234E1Z6" },
    { name: "Aavas Financiers Limited", branch: "JAIPUR", state: "Rajasthan", gst: "08AAACV1234F1Z7" },
    { name: "Aditya Birla Capital Limited", branch: "MUMBAI", state: "Maharashtra", gst: "27AAACB1234G1Z8" },
    { name: "Axis Bank", branch: "KANPUR", state: "Uttar Pradesh", gst: "09AAACC1234H1Z9" },
    { name: "Kotak Mahindra Bank", branch: "INDORE", state: "Madhya Pradesh", gst: "23AAACK1234I1ZA" },
    { name: "Punjab National Bank", branch: "SAHARANPUR", state: "Uttar Pradesh", gst: "09AAACP1234J1ZB" },
    { name: "Canara Bank", branch: "DEHRADUN", state: "Uttarakhand", gst: "05AAACC1234K1ZC" },
  ];

  for (const b of banksToSeed) {
    await prisma.bank.upsert({
      where: {
        bankName_branch: {
          bankName: b.name,
          branch: b.branch,
        },
      },
      update: {
        state: b.state,
        gstNumber: b.gst,
      },
      create: {
        bankName: b.name,
        branch: b.branch,
        state: b.state,
        gstNumber: b.gst,
        address: `${b.branch} MAIN BRANCH, ${b.state}`,
        templateType: "standard",
      },
    });
  }

  console.log("✅ Seed synchronization complete.");
  console.log({
    users: 2,
    companies: 2,
    banks: banksToSeed.length
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
