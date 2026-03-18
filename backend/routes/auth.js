const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { auth } = require("../middleware");
const { signAuthToken } = require("../middleware");
const { RESOURCE_NAMES, BLOOD_GROUPS } = require("../helpers");

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, address, lat, lng } = req.body;

    const existing = await prisma.hospital.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const hospital = await prisma.hospital.create({
      data: { name, email, phone, password: hashed, address, lat, lng },
    });

    // Initialize default resources
    for (const rName of RESOURCE_NAMES) {
      await prisma.resource.create({
        data: { hospitalId: hospital.id, name: rName, units: 0 },
      });
    }

    // Initialize default blood stocks
    for (const bg of BLOOD_GROUPS) {
      await prisma.bloodStock.create({
        data: { hospitalId: hospital.id, bloodGroup: bg, units: 0 },
      });
    }

    res.json({
      message: "Hospital registered successfully",
      hospital: {
        id: hospital.id,
        name: hospital.name,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        lat: hospital.lat,
        lng: hospital.lng,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hospital = await prisma.hospital.findUnique({ where: { email } });
    if (!hospital)
      return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, hospital.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = await signAuthToken({ hospitalId: hospital.id });

    res.json({
      message: "Login successful",
      token,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        lat: hospital.lat,
        lng: hospital.lng,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /auth/hospitals
// router.get("/hospitals", async (req, res) => {
//   try {
//     const hospitals = await prisma.hospital.findMany({
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         phone: true,
//         address: true,
//         lat: true,
//         lng: true,
//       },
//       orderBy: { id: "asc" },
//     });

//     return res.json(hospitals);
//   } catch (e) {
//     return res.status(500).json({ message: e.message });
//   }
// });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.get("/hospitals", async (req, res) => {
  try {
    const hospitals = [
      {
        id: 1,
        name: "Hospital A",
        lat: 22.609256890204765,
        lng: 75.79433441162111,
      },
      {
        id: 2,
        name: "Hospital B",
        lat: 22.5861184893211,
        lng: 75.90007781982423,
      },
      {
        id: 3,
        name: "Hospital C",
        lat: 22.767317764734777,
        lng: 75.76515197753908,
      },
      {
        id: 4,
        name: "Hospital D",
        lat: 22.680232615087206,
        lng: 75.64773559570314,
      },
      {
        id: 5,
        name: "Hospital E",
        lat: 22.787260370919913,
        lng: 75.93612670898439,
      },
      {
        id: 6,
        name: "Hospital F",
        lat: 22.74927194371658,
        lng: 75.84943771362306,
      },
      {
        id: 7,
        name: "Hospital G",
        lat: 22.684667379476974,
        lng: 76.0133743286133,
      },
      {
        id: 8,
        name: "Hospital H",
        lat: 22.71285645414127,
        lng: 75.84566116333008,
      },
      {
        id: 9,
        name: "Hospital I",
        lat: 22.61688299351949,
        lng: 75.68378448486328,
      },
    ];
    return res.json(hospitals);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;
