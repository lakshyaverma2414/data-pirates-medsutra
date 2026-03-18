const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const router = express.Router();

const CACHE_DIR = path.join(__dirname, "..", "cache", "osrm-routes");
const FROM_MATCH_METERS = 250;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isValidLat(lat) {
  return lat >= -90 && lat <= 90;
}

function isValidLng(lng) {
  return lng >= -180 && lng <= 180;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function roundCoord(value, precision = 5) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function buildToKey(toLat, toLng) {
  const lat = roundCoord(toLat, 5).toFixed(5);
  const lng = roundCoord(toLng, 5).toFixed(5);
  return `to_${lat}_${lng}`.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function readCacheCandidates(toKey) {
  await ensureCacheDir();
  const files = await fs.readdir(CACHE_DIR);
  const relevantFiles = files.filter(
    (file) => file.startsWith(`${toKey}__`) && file.endsWith(".json"),
  );

  const entries = [];
  for (const fileName of relevantFiles) {
    try {
      const fullPath = path.join(CACHE_DIR, fileName);
      const fileContent = await fs.readFile(fullPath, "utf8");
      const parsed = JSON.parse(fileContent);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.fromLat !== "number" ||
        typeof parsed.fromLng !== "number" ||
        typeof parsed.toLat !== "number" ||
        typeof parsed.toLng !== "number" ||
        typeof parsed.response !== "object" ||
        parsed.response === null
      ) {
        continue;
      }

      entries.push({ fileName, ...parsed });
    } catch (error) {
      continue;
    }
  }

  return entries;
}

async function writeCacheEntry(toKey, data) {
  await ensureCacheDir();
  const uniquePart = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const fileName = `${toKey}__${uniquePart}.json`;
  const fullPath = path.join(CACHE_DIR, fileName);
  await fs.writeFile(fullPath, JSON.stringify(data));
}

router.get("/", async (req, res) => {
  try {
    const fromLat = toNumber(req.query.fromLat);
    const fromLng = toNumber(req.query.fromLng);
    const toLat = toNumber(req.query.toLat);
    const toLng = toNumber(req.query.toLng);

    if (
      fromLat === null ||
      fromLng === null ||
      toLat === null ||
      toLng === null ||
      !isValidLat(fromLat) ||
      !isValidLng(fromLng) ||
      !isValidLat(toLat) ||
      !isValidLng(toLng)
    ) {
      return res.status(400).json({
        message:
          "Valid query params are required: fromLat, fromLng, toLat, toLng",
      });
    }

    const toKey = buildToKey(toLat, toLng);
    const cacheEntries = await readCacheCandidates(toKey);

    let bestMatch = null;
    for (const entry of cacheEntries) {
      const distance = haversineMeters(
        fromLat,
        fromLng,
        entry.fromLat,
        entry.fromLng,
      );
      if (
        distance < FROM_MATCH_METERS &&
        (!bestMatch || distance < bestMatch.distance)
      ) {
        bestMatch = { entry, distance };
      }
    }

    if (bestMatch) {
      return res.json({
        source: "cache",
        matchedFromDistanceMeters: Math.round(bestMatch.distance),
        data: bestMatch.entry.response,
      });
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(osrmUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(502).json({
        message: "Failed to fetch route from OSRM",
        status: response.status,
      });
    }

    const responseData = await response.json();

    await writeCacheEntry(toKey, {
      createdAt: new Date().toISOString(),
      fromLat,
      fromLng,
      toLat,
      toLng,
      response: responseData,
    });

    return res.json({
      source: "osrm",
      data: responseData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Route proxy failed" });
  }
});

module.exports = router;
