const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");
const { RESOURCE_NAME_MAP } = require("../helpers");

const router = express.Router();

// POST /emergencies
router.post("/", auth, async (req, res) => {
  try {
    const { type, priority, additionalInfo } = req.body;
    const emergency = await prisma.featureEmergency.create({
      data: {
        type,
        priority,
        status: "PENDING",
        additionalInfo: additionalInfo || "",
        createdById: req.hospitalId,
      },
    });

    res.json({
      message: "Emergency created",
      emergency: {
        id: emergency.id,
        type: RESOURCE_NAME_MAP[emergency.type] || emergency.type,
        priority: emergency.priority,
        status: emergency.status,
        createdAt: emergency.createdAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /emergencies
router.get("/", auth, async (req, res) => {
  try {
    const emergencies = await prisma.featureEmergency.findMany({
      where: {},
      include: { createdBy: true },
    });

    res.json(
      emergencies.map((e) => ({
        id: e.id,
        type: RESOURCE_NAME_MAP[e.type] || e.type,
        priority: e.priority,
        status: e.status,
        createdBy: {
          id: e.createdBy.id,
          name: e.createdBy.name,
          phone: e.createdBy.phone,
          address: e.createdBy.address,
          lat: e.createdBy.lat,
          lng: e.createdBy.lng,
        },
        createdAt: e.createdAt,
      })),
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /emergencies/:id/accept
router.patch("/:id/accept", auth, async (req, res) => {
  try {
    const emergencyId = parseInt(req.params.id);

    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.featureEmergency.findUnique({
          where: { id: emergencyId },
        });

        if (!existing) {
          const error = new Error("Emergency not found");
          error.statusCode = 404;
          throw error;
        }

        if (existing.status !== "PENDING") {
          const error = new Error("Only pending emergencies can be accepted");
          error.statusCode = 400;
          throw error;
        }

        if (existing.createdById === req.hospitalId) {
          const error = new Error("You cannot accept your own emergency");
          error.statusCode = 400;
          throw error;
        }

        const stockUpdate = await tx.resource.updateMany({
          where: {
            hospitalId: req.hospitalId,
            name: existing.type,
            units: { gte: 1 },
          },
          data: { units: { decrement: 1 } },
        });

        if (stockUpdate.count === 0) {
          const error = new Error(
            `${RESOURCE_NAME_MAP[existing.type] || existing.type} not available`,
          );
          error.statusCode = 400;
          throw error;
        }

        const requesterResourceUpdate = await tx.resource.updateMany({
          where: {
            hospitalId: existing.createdById,
            name: existing.type,
          },
          data: { units: { increment: 1 } },
        });

        if (requesterResourceUpdate.count === 0) {
          await tx.resource.create({
            data: {
              hospitalId: existing.createdById,
              name: existing.type,
              units: 1,
            },
          });
        }

        const updatedEmergency = await tx.featureEmergency.update({
          where: { id: emergencyId },
          data: { status: "ACCEPTED", acceptedById: req.hospitalId },
          include: { acceptedBy: true },
        });

        return {
          emergency: updatedEmergency,
          resourceType: existing.type,
          acceptorHospitalId: req.hospitalId,
          requesterHospitalId: existing.createdById,
        };
      },
      { maxWait: 10000, timeout: 15000 },
    );

    const [acceptorResource, requesterResource] = await Promise.all([
      prisma.resource.findFirst({
        where: {
          hospitalId: result.acceptorHospitalId,
          name: result.resourceType,
        },
      }),
      prisma.resource.findFirst({
        where: {
          hospitalId: result.requesterHospitalId,
          name: result.resourceType,
        },
      }),
    ]);

    res.json({
      message: "Emergency accepted",
      emergency: {
        id: result.emergency.id,
        status: result.emergency.status,
        acceptedBy: {
          id: result.emergency.acceptedBy.id,
          name: result.emergency.acceptedBy.name,
          phone: result.emergency.acceptedBy.phone,
          address: result.emergency.acceptedBy.address,
          lat: result.emergency.acceptedBy.lat,
          lng: result.emergency.acceptedBy.lng,
        },
      },
      resourceUsed: {
        type: RESOURCE_NAME_MAP[result.resourceType] || result.resourceType,
        unitsDeducted: 1,
        remainingUnits: acceptorResource ? acceptorResource.units : 0,
      },
      resourceReceived: {
        type: RESOURCE_NAME_MAP[result.resourceType] || result.resourceType,
        unitsAdded: 1,
        receivingHospitalId: result.emergency.createdById,
        totalUnits: requesterResource ? requesterResource.units : 0,
      },
    });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
});

// PATCH /emergencies/:id/resolve
router.patch("/:id/resolve", auth, async (req, res) => {
  try {
    const emergency = await prisma.featureEmergency.update({
      where: { id: parseInt(req.params.id) },
      data: { status: "RESOLVED" },
    });

    res.json({
      message: "Emergency resolved",
      emergency: {
        id: emergency.id,
        status: emergency.status,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
