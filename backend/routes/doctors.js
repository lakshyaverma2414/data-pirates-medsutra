const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");

const router = express.Router();

function normalizeSpecializationList(list) {
  const normalized = [];
  const invalid = [];

  for (const item of list) {
    if (typeof item !== "string") {
      invalid.push(item);
      continue;
    }

    const value = item.trim();
    if (!value) {
      invalid.push(item);
      continue;
    }

    if (!normalized.includes(value)) normalized.push(value);
  }

  return { normalized, invalid };
}

function formatDoctor(doctor) {
  return {
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    hospital: {
      id: doctor.hospital.id,
      name: doctor.hospital.name,
    },
  };
}

router.post("/", auth, async (req, res) => {
  try {
    const { name, specialization, hospitalId } = req.body;

    if (
      !name ||
      !Array.isArray(specialization) ||
      specialization.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "name and specialization are required" });
    }

    const { normalized, invalid } = normalizeSpecializationList(specialization);
    if (invalid.length) {
      return res.status(400).json({
        message:
          "Invalid specialization. Please send an array of non-empty strings.",
        invalid,
      });
    }

    const targetHospitalId = hospitalId ? Number(hospitalId) : req.hospitalId;
    if (!targetHospitalId || Number.isNaN(targetHospitalId)) {
      return res.status(400).json({ message: "Invalid hospitalId" });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: targetHospitalId },
      select: { id: true, name: true },
    });
    if (!hospital)
      return res.status(404).json({ message: "Hospital not found" });

    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialization: normalized,
        hospitalId: hospital.id,
      },
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      message: "Doctor created",
      doctor: formatDoctor(doctor),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        hospitalId: req.hospitalId,
      },
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json({
      success: true,
      message: "Doctors fetched successfully",
      doctors: doctors.map(formatDoctor),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const doctor = await prisma.doctor.findFirst({
      where: { id, hospitalId: req.hospitalId },
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({
      success: true,
      message: "Doctor fetched successfully",
      doctor: formatDoctor(doctor),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
