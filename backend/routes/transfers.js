const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");

const router = express.Router();

// POST /transfers
router.post("/", auth, async (req, res) => {
  try {
    const { patientId } = req.body;
    const transfer = await prisma.featureTransfer.create({
      data: {
        patientId,
        fromHospitalId: req.hospitalId,
        status: "PENDING",
        progress: "REQUEST_SENT",
      },
    });

    res.json({
      message: "Transfer request created",
      transfer: {
        id: transfer.id,
        patientId: transfer.patientId,
        status: transfer.status,
        progress: transfer.progress,
        createdAt: transfer.createdAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /transfers
router.get("/", auth, async (req, res) => {
  try {
    const transfers = await prisma.featureTransfer.findMany({
      include: {
        patient: true,
        fromHospital: true,
        toHospital: true,
      },
    });

    res.json(
      transfers.map((t) => ({
        id: t.id,
        patient: {
          id: t.patient.id,
          name: t.patient.name,
        },
        fromHospital: {
          id: t.fromHospital.id,
          name: t.fromHospital.name,
          phone: t.fromHospital.phone,
          address: t.fromHospital.address,
        },
        toHospital: t.toHospital
          ? {
              id: t.toHospital.id,
              name: t.toHospital.name,
              phone: t.toHospital.phone,
              address: t.toHospital.address,
            }
          : null,
        status: t.status,
        progress: t.progress,
      })),
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /transfers/:id/accept
router.patch("/:id/accept", auth, async (req, res) => {
  try {
    const { toHospitalId } = req.body;
    const transfer = await prisma.featureTransfer.update({
      where: { id: parseInt(req.params.id) },
      data: {
        toHospitalId,
        status: "ACCEPTED",
        progress: "ACCEPTED_BY_HOSPITAL",
      },
      include: { toHospital: true },
    });

    res.json({
      message: "Transfer accepted",
      transfer: {
        id: transfer.id,
        status: transfer.status,
        progress: transfer.progress,
        toHospital: transfer.toHospital
          ? {
              id: transfer.toHospital.id,
              name: transfer.toHospital.name,
              phone: transfer.toHospital.phone,
              address: transfer.toHospital.address,
            }
          : null,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /transfers/:id/progress
router.patch("/:id/progress", auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const transfer = await prisma.featureTransfer.update({
      where: { id: parseInt(req.params.id) },
      data: { progress },
    });

    res.json({
      message: "Transfer progress updated",
      transfer: {
        id: transfer.id,
        progress: transfer.progress,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
