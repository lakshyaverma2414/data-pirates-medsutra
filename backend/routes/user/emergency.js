const express = require("express");
const prisma = require("../../prisma");
const { optionalAuth } = require("../../middleware");

const router = express.Router();

const VALID_STATUSES = new Set([
  "hospital_notified",
  "ambulance_dispatched",
  "ambulance_arriving",
  "patient_picked",
  "completed",
]);

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

async function callEmergencyAi(payload) {
  const apiUrl = process.env.AI_EMERGENCY_API_URL;

  if (!apiUrl) {
    throw new Error("AI_EMERGENCY_API_URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 130000);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`AI API error: ${response.status} ${bodyText}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function findHospitalFromAiResult(aiHospital) {
  if (!aiHospital || typeof aiHospital !== "object") {
    return null;
  }

  if (aiHospital.email) {
    const byEmail = await prisma.hospital.findUnique({
      where: { email: aiHospital.email },
    });
    if (byEmail) return byEmail;
  }

  const byPhone = aiHospital.phone
    ? await prisma.hospital.findFirst({ where: { phone: aiHospital.phone } })
    : null;
  if (byPhone) return byPhone;

  const byName = aiHospital.name
    ? await prisma.hospital.findFirst({ where: { name: aiHospital.name } })
    : null;
  if (byName) return byName;

  return null;
}

async function findRandomHospital() {
  const totalHospitals = await prisma.hospital.count();
  if (totalHospitals === 0) return null;

  const randomIndex = Math.floor(Math.random() * totalHospitals);

  return prisma.hospital.findFirst({
    skip: randomIndex,
  });
}

async function setTimeoutPromise(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// POST /user/emergency
router.post("/", async (req, res) => {
  try {
    const { emergencyType, description, patientAge, userLat, userLng } =
      req.body;

    if (
      typeof emergencyType !== "string" ||
      !emergencyType.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !Number.isInteger(patientAge) ||
      patientAge <= 0 ||
      !isValidNumber(userLat) ||
      !isValidNumber(userLng)
    ) {
      return res.status(400).json({
        message:
          "Invalid payload. Required: emergencyType(string), description(string), patientAge(number), userLat(number), userLng(number)",
      });
    }

    let selectedHospital = null;
    let bypass = false;

    try {
      const aiResponse = await callEmergencyAi({
        emergencyType: emergencyType.trim(),
        description: description.trim(),
        patientAge,
        userLat,
        userLng,
      });

      selectedHospital = await findHospitalFromAiResult(aiResponse);

      if (!selectedHospital) {
        throw new Error("AI-selected hospital was not found in database");
      }
    } catch (aiError) {
      console.warn(
        "Bypassing AI hospital selection due to error:",
        aiError.message,
      );
      console.error(aiError);
      bypass = true;
      selectedHospital = await findRandomHospital();
    }

    if (!selectedHospital) {
      return res.status(404).json({
        message: "No hospitals available in database",
      });
    }

    const emergency = await prisma.hospitalUserEmergency.create({
      data: {
        emergencyType: emergencyType.trim(),
        description: description.trim(),
        patientAge,
        userLat,
        userLng,
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        hospitalPhone: selectedHospital.phone,
        hospitalEmail: selectedHospital.email,
        hospitalAddress: selectedHospital.address,
        hospitalLat: selectedHospital.lat,
        hospitalLng: selectedHospital.lng,
        emergencyStatus: "hospital_notified",
        active: true,
      },
    });

    await setTimeoutPromise(2000);

    res.json({
      message: "Emergency created and hospital assigned",
      bypass,
      emergency: {
        id: emergency.id,
        emergencyType: emergency.emergencyType,
        description: emergency.description,
        patientAge: emergency.patientAge,
        userLat: emergency.userLat,
        userLng: emergency.userLng,
        emergencyStatus: emergency.emergencyStatus,
        active: emergency.active,
        hospital: {
          id: selectedHospital.id,
          name: selectedHospital.name,
          phone: selectedHospital.phone,
          email: selectedHospital.email,
          address: selectedHospital.address,
          lat: selectedHospital.lat,
          lng: selectedHospital.lng,
        },
        createdAt: emergency.createdAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /user/emergency/:id/status
router.get("/:id/status", async (req, res) => {
  try {
    const emergencyId = parseInt(req.params.id, 10);
    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
      return res
        .status(400)
        .json({ message: "Valid emergency id is required" });
    }

    const emergency = await prisma.hospitalUserEmergency.findUnique({
      where: { id: emergencyId },
    });

    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    res.json({
      emergency: {
        id: emergency.id,
        emergencyStatus: emergency.emergencyStatus,
        active: emergency.active,
        lastUpdatedByType: emergency.lastUpdatedByType,
        lastUpdatedById: emergency.lastUpdatedById,
        updatedAt: emergency.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /user/emergency/status
router.post("/status", optionalAuth, async (req, res) => {
  try {
    const { emergencyId, status, actorType, actorId } = req.body;

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
      return res.status(400).json({ message: "Valid emergencyId is required" });
    }

    if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${Array.from(VALID_STATUSES).join(", ")}`,
      });
    }

    if (actorType !== "user" && actorType !== "hospital") {
      return res
        .status(400)
        .json({ message: "actorType must be user or hospital" });
    }

    const emergency = await prisma.hospitalUserEmergency.findUnique({
      where: { id: emergencyId },
    });

    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    if (actorType === "hospital") {
      const incomingHospitalId = Number.isInteger(actorId)
        ? actorId
        : req.hospitalId || null;

      if (!incomingHospitalId) {
        return res.status(401).json({
          message: "Hospital update requires hospital token or actorId",
        });
      }

      if (incomingHospitalId !== emergency.hospitalId) {
        return res.status(403).json({
          message: "Only assigned hospital can update this emergency",
        });
      }

      if (req.hospitalId && actorId && actorId !== req.hospitalId) {
        return res.status(400).json({
          message: "actorId mismatch with authenticated hospital",
        });
      }
    }

    const updated = await prisma.hospitalUserEmergency.update({
      where: { id: emergencyId },
      data: {
        emergencyStatus: status,
        active: status !== "completed",
        lastUpdatedByType: actorType,
        lastUpdatedById: actorId
          ? String(actorId)
          : req.hospitalId
            ? String(req.hospitalId)
            : null,
      },
    });

    res.json({
      message: "Emergency status updated",
      emergency: {
        id: updated.id,
        emergencyStatus: updated.emergencyStatus,
        active: updated.active,
        lastUpdatedByType: updated.lastUpdatedByType,
        lastUpdatedById: updated.lastUpdatedById,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
