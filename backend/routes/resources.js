const express = require("express");
const prisma = require("../prisma");
const { auth } = require("../middleware");
const { RESOURCE_NAME_MAP } = require("../helpers");

const router = express.Router();

// GET /resources
router.get("/", auth, async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { hospitalId: req.hospitalId },
    });
    res.json(
      resources.map((r) => ({
        id: r.id,
        name: RESOURCE_NAME_MAP[r.name] || r.name,
        units: r.units,
        updatedAt: r.updatedAt,
      })),
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /resources
router.patch("/", auth, async (req, res) => {
  try {
    const { name, units } = req.body;
    const resource = await prisma.resource.findFirst({
      where: { hospitalId: req.hospitalId, name },
    });
    if (!resource)
      return res.status(404).json({ message: "Resource not found" });

    const updated = await prisma.resource.update({
      where: { id: resource.id },
      data: { units },
    });

    res.json({
      message: "Resource updated successfully",
      resource: {
        name: RESOURCE_NAME_MAP[updated.name] || updated.name,
        units: updated.units,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
