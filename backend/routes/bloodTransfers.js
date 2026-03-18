const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");
const { BLOOD_GROUP_MAP } = require("../helpers");

const router = express.Router();

function formatTransfer(bt) {
  return {
    id: bt.id,
    bloodGroup: BLOOD_GROUP_MAP[bt.bloodGroup] || bt.bloodGroup,
    units: bt.units,
    status: bt.status,
    progress: bt.progress,
    fromHospital: {
      id: bt.fromHospital.id,
      name: bt.fromHospital.name,
      phone: bt.fromHospital.phone,
      address: bt.fromHospital.address,
    },
    toHospital: bt.toHospital
      ? {
          id: bt.toHospital.id,
          name: bt.toHospital.name,
          phone: bt.toHospital.phone,
          address: bt.toHospital.address,
        }
      : null,
  };
}

// POST /blood-transfers
router.post("/", auth, async (req, res) => {
  try {
    const { bloodGroup, units, requestedFrom } = req.body;

    if (!bloodGroup || !units || !requestedFrom) {
      return res.status(400).json({
        message: "bloodGroup, units and requestedFrom are required",
      });
    }

    if (requestedFrom === req.hospitalId) {
      return res
        .status(400)
        .json({ message: "requestedFrom cannot be your own hospital" });
    }

    const requestedHospital = await prisma.hospital.findUnique({
      where: { id: requestedFrom },
    });
    if (!requestedHospital) {
      return res.status(404).json({ message: "Requested hospital not found" });
    }

    const bt = await prisma.featureBloodNetworkTransfer.create({
      data: {
        bloodGroup,
        units,
        fromHospitalId: req.hospitalId,
        toHospitalId: requestedFrom,
        status: "PENDING",
        progress: "REQUEST_SENT",
      },
      include: { fromHospital: true, toHospital: true },
    });

    res.json({
      message: "Blood request created",
      request: formatTransfer(bt),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /blood-transfers
router.get("/", auth, async (req, res) => {
  try {
    const { type } = req.query;

    let where = {
      OR: [
        { fromHospitalId: req.hospitalId },
        { toHospitalId: req.hospitalId },
      ],
    };

    if (type === "incoming") {
      where = { toHospitalId: req.hospitalId };
    }

    if (type === "outgoing") {
      where = { fromHospitalId: req.hospitalId };
    }

    const transfers = await prisma.featureBloodNetworkTransfer.findMany({
      where,
      include: { fromHospital: true, toHospital: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(transfers.map((t) => formatTransfer(t)));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /blood-transfers/:id/accept
router.patch("/:id/accept", auth, async (req, res) => {
  try {
    const transferId = parseInt(req.params.id);
    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.featureBloodNetworkTransfer.findUnique({
          where: { id: transferId },
        });

        if (!existing) {
          const error = new Error("Blood request not found");
          error.statusCode = 404;
          throw error;
        }

        if (existing.toHospitalId !== req.hospitalId) {
          const error = new Error(
            "Only requested hospital can accept this request",
          );
          error.statusCode = 403;
          throw error;
        }

        if (existing.status !== "PENDING") {
          const error = new Error("Only pending requests can be accepted");
          error.statusCode = 400;
          throw error;
        }

        const deductStock = await tx.bloodStock.updateMany({
          where: {
            hospitalId: req.hospitalId,
            bloodGroup: existing.bloodGroup,
            units: { gte: existing.units },
          },
          data: { units: { decrement: existing.units } },
        });

        if (deductStock.count === 0) {
          const error = new Error(
            `Not enough ${BLOOD_GROUP_MAP[existing.bloodGroup] || existing.bloodGroup} stock`,
          );
          error.statusCode = 400;
          throw error;
        }

        const addStock = await tx.bloodStock.updateMany({
          where: {
            hospitalId: existing.fromHospitalId,
            bloodGroup: existing.bloodGroup,
          },
          data: { units: { increment: existing.units } },
        });

        if (addStock.count === 0) {
          await tx.bloodStock.create({
            data: {
              hospitalId: existing.fromHospitalId,
              bloodGroup: existing.bloodGroup,
              units: existing.units,
            },
          });
        }

        const bt = await tx.featureBloodNetworkTransfer.update({
          where: { id: transferId },
          data: {
            status: "ACCEPTED",
            progress: "ACCEPTED_BY_HOSPITAL",
          },
          include: { fromHospital: true, toHospital: true },
        });

        return {
          transfer: bt,
          bloodGroup: existing.bloodGroup,
          unitsMoved: existing.units,
          acceptingHospitalId: req.hospitalId,
          requestingHospitalId: existing.fromHospitalId,
        };
      },
      { maxWait: 10000, timeout: 15000 },
    );

    const [acceptingHospitalStock, requestingHospitalStock] = await Promise.all(
      [
        prisma.bloodStock.findFirst({
          where: {
            hospitalId: result.acceptingHospitalId,
            bloodGroup: result.bloodGroup,
          },
        }),
        prisma.bloodStock.findFirst({
          where: {
            hospitalId: result.requestingHospitalId,
            bloodGroup: result.bloodGroup,
          },
        }),
      ],
    );

    res.json({
      message: "Blood request accepted",
      transfer: formatTransfer(result.transfer),
      stockMovement: {
        bloodGroup: BLOOD_GROUP_MAP[result.bloodGroup] || result.bloodGroup,
        unitsMoved: result.unitsMoved,
        fromHospitalId: result.transfer.toHospitalId,
        toHospitalId: result.transfer.fromHospitalId,
        fromHospitalRemainingUnits: acceptingHospitalStock
          ? acceptingHospitalStock.units
          : 0,
        toHospitalTotalUnits: requestingHospitalStock
          ? requestingHospitalStock.units
          : 0,
      },
    });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
});

// PATCH /blood-transfers/:id/reject
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    const transferId = parseInt(req.params.id);
    const existing = await prisma.featureBloodNetworkTransfer.findUnique({
      where: { id: transferId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (existing.toHospitalId !== req.hospitalId) {
      return res.status(403).json({
        message: "Only requested hospital can reject this request",
      });
    }

    if (existing.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be rejected" });
    }

    const bt = await prisma.featureBloodNetworkTransfer.update({
      where: { id: transferId },
      data: {
        status: "REJECTED",
        progress: "REQUEST_REJECTED",
      },
      include: { fromHospital: true, toHospital: true },
    });

    res.json({
      message: "Blood request rejected",
      transfer: formatTransfer(bt),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /blood-transfers/:id/complete
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const transferId = parseInt(req.params.id);
    const existing = await prisma.featureBloodNetworkTransfer.findUnique({
      where: { id: transferId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    if (existing.fromHospitalId !== req.hospitalId) {
      return res.status(403).json({
        message: "Only requesting hospital can complete this transfer",
      });
    }

    if (existing.status !== "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Only accepted requests can be completed" });
    }

    const bt = await prisma.featureBloodNetworkTransfer.update({
      where: { id: transferId },
      data: {
        status: "COMPLETED",
        progress: "COMPLETED",
      },
      include: { fromHospital: true, toHospital: true },
    });

    res.json({
      message: "Blood transfer completed",
      transfer: formatTransfer(bt),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
