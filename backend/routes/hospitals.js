const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");

const router = express.Router();

// GET /hospitals/me
router.get("/me", auth, async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.hospitalId },
    });
    if (!hospital)
      return res.status(404).json({ message: "Hospital not found" });

    res.json({
      id: hospital.id,
      name: hospital.name,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      lat: hospital.lat,
      lng: hospital.lng,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /hospitals/user-emergencies
router.get("/user-emergencies", auth, async (req, res) => {
  try {
    const { active, status } = req.query;

    const where = {
      hospitalId: req.hospitalId,
    };

    if (typeof active === "string") {
      if (active === "true") where.active = true;
      else if (active === "false") where.active = false;
    }

    if (typeof status === "string" && status.trim()) {
      where.emergencyStatus = status.trim();
    }

    const emergencies = await prisma.hospitalUserEmergency.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(
      emergencies.map((e) => ({
        id: e.id,
        emergencyType: e.emergencyType,
        description: e.description,
        patientAge: e.patientAge,
        userLat: e.userLat,
        userLng: e.userLng,
        emergencyStatus: e.emergencyStatus,
        active: e.active,
        lastUpdatedByType: e.lastUpdatedByType,
        lastUpdatedById: e.lastUpdatedById,
        hospital: {
          id: e.hospitalId,
          name: e.hospitalName,
          phone: e.hospitalPhone,
          email: e.hospitalEmail,
          address: e.hospitalAddress,
          lat: e.hospitalLat,
          lng: e.hospitalLng,
        },
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /hospitals/user-emergencies/:id
router.get("/user-emergencies/:id", auth, async (req, res) => {
  try {
    const emergencyId = parseInt(req.params.id, 10);
    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
      return res
        .status(400)
        .json({ message: "Valid emergency id is required" });
    }

    const emergency = await prisma.hospitalUserEmergency.findFirst({
      where: {
        id: emergencyId,
        hospitalId: req.hospitalId,
      },
    });

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency not found for this hospital",
      });
    }

    res.json({
      id: emergency.id,
      emergencyType: emergency.emergencyType,
      description: emergency.description,
      patientAge: emergency.patientAge,
      userLat: emergency.userLat,
      userLng: emergency.userLng,
      emergencyStatus: emergency.emergencyStatus,
      active: emergency.active,
      lastUpdatedByType: emergency.lastUpdatedByType,
      lastUpdatedById: emergency.lastUpdatedById,
      hospital: {
        id: emergency.hospitalId,
        name: emergency.hospitalName,
        phone: emergency.hospitalPhone,
        email: emergency.hospitalEmail,
        address: emergency.hospitalAddress,
        lat: emergency.hospitalLat,
        lng: emergency.hospitalLng,
      },
      createdAt: emergency.createdAt,
      updatedAt: emergency.updatedAt,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
