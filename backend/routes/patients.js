const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");
const { BLOOD_GROUP_MAP } = require("../helpers");

const router = express.Router();

// POST /patients
router.post("/", auth, async (req, res) => {
  try {
    const { name, age, bloodGroup, phone, condition } = req.body;
    const patient = await prisma.patient.create({
      data: {
        name,
        age,
        bloodGroup,
        phone,
        condition,
        hospitalId: req.hospitalId,
      },
    });

    res.json({
      message: "Patient created",
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        bloodGroup: BLOOD_GROUP_MAP[patient.bloodGroup] || patient.bloodGroup,
        phone: patient.phone,
        condition: patient.condition,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /patients
router.get("/", auth, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { hospitalId: req.hospitalId },
    });

    res.json(
      patients.map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        bloodGroup: BLOOD_GROUP_MAP[p.bloodGroup] || p.bloodGroup,
        phone: p.phone,
        condition: p.condition,
      })),
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /patients/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      bloodGroup: BLOOD_GROUP_MAP[patient.bloodGroup] || patient.bloodGroup,
      phone: patient.phone,
      condition: patient.condition,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /patients/:id/transfer
router.patch("/:id/transfer", auth, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: { hospitalId: req.hospitalId },
    });

    res.json({
      message: "Patient transferred successfully",
      patient: {
        id: updated.id,
        name: updated.name,
        hospitalId: updated.hospitalId,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
