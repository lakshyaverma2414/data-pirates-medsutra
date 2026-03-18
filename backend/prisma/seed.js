const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");

const prisma = new PrismaClient();

const hospitalData = require(path.join(__dirname, "hospitals.json"));
const doctorData = require(path.join(__dirname, "doctors.json"));

const resourceNames = [
  "ICU_BED",
  "VENTILATOR",
  "GENERAL_BED",
  "OXYGEN_CYLINDER",
  "AMBULANCE",
];
const bloodGroups = [
  "A_PLUS",
  "A_MINUS",
  "B_PLUS",
  "B_MINUS",
  "AB_PLUS",
  "AB_MINUS",
  "O_PLUS",
  "O_MINUS",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  const hashedPassword = await bcrypt.hash("pass123", 10);

  const createdHospitals = [];
  for (const data of hospitalData) {
    const hospital = await prisma.hospital.upsert({
      where: { email: data.email },
      update: {},
      create: { ...data, password: hashedPassword },
    });
    console.log(`Seeded hospital: ${hospital.name} (id: ${hospital.id})`);
    createdHospitals.push(hospital);
  }

  const shuffled = [...doctorData].sort(() => Math.random() - 0.5);
  const assigned = new Set();

  for (const hospital of createdHospitals) {
    const count = Math.floor(Math.random() * 2) + 1;
    let added = 0;
    for (const doc of shuffled) {
      if (added >= count) break;
      if (assigned.has(doc.name)) continue;
      assigned.add(doc.name);
      const doctor = await prisma.doctor.create({
        data: { ...doc, hospitalId: hospital.id },
      });
      console.log(
        `Seeded doctor: ${doctor.name} -> ${hospital.name} (hospitalId: ${hospital.id})`,
      );
      added++;
    }
  }

  for (const hospital of createdHospitals) {
    for (const name of resourceNames) {
      await prisma.resource.create({
        data: { hospitalId: hospital.id, name, units: rand(1, 50) },
      });
    }
    console.log(`Seeded resources for: ${hospital.name}`);

    for (const bloodGroup of bloodGroups) {
      await prisma.bloodStock.create({
        data: { hospitalId: hospital.id, bloodGroup, units: rand(0, 100) },
      });
    }
    console.log(`Seeded blood stock for: ${hospital.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
