const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");
const { BLOOD_GROUP_MAP } = require("../helpers");

const router = express.Router();

// GET /blood-stock
router.get("/", auth, async (req, res) => {
  try {
    const stocks = await prisma.bloodStock.findMany({
      where: { hospitalId: req.hospitalId },
    });
    res.json(
      stocks.map((s) => ({
        bloodGroup: BLOOD_GROUP_MAP[s.bloodGroup] || s.bloodGroup,
        units: s.units,
      })),
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /blood-stock
router.patch("/", auth, async (req, res) => {
  try {
    const { bloodGroup, units } = req.body;
    const stock = await prisma.bloodStock.findFirst({
      where: { hospitalId: req.hospitalId, bloodGroup },
    });
    if (!stock)
      return res.status(404).json({ message: "Blood stock not found" });

    const updated = await prisma.bloodStock.update({
      where: { id: stock.id },
      data: { units },
    });

    res.json({
      message: "Blood stock updated",
      bloodStock: {
        bloodGroup: BLOOD_GROUP_MAP[updated.bloodGroup] || updated.bloodGroup,
        units: updated.units,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /blood-stock/network
router.get("/network", auth, async (req, res) => {
  try {
    const allStocks = await prisma.bloodStock.findMany({
      where: { units: { gt: 0 } },
      include: { hospital: true },
    });

    // Group by blood group
    const grouped = {};
    for (const s of allStocks) {
      const key = s.bloodGroup;
      if (!grouped[key]) {
        grouped[key] = {
          bloodGroup: BLOOD_GROUP_MAP[key] || key,
          units: 0,
          fromHospital: [],
          createdAt: new Date().toISOString(),
        };
      }
      if (s.hospitalId !== req.hospitalId) {
        grouped[key].units += s.units;
      }
      grouped[key].fromHospital.push({
        id: s.hospital.id,
        name: s.hospital.name,
        phone: s.hospital.phone,
        email: s.hospital.email,
        address: s.hospital.address,
        lat: s.hospital.lat,
        lng: s.hospital.lng,
        units: s.units,
      });
    }

    res.json(Object.values(grouped));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
