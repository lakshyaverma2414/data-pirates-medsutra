const express = require("express");
const router = express.Router();

// const VALID_HOSPITAL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const VALID_HOSPITAL_IDS = [5, 14, 12, 7, 3, 2, 10];
// const VALID_HOSPITAL_IDS = [10, 5, 11, 14, 12, 7, 4, 3, 2];

router.post("/control-dashboard", async (req, res) => {
  try {
    const { patientCount, patientConditionCount } = req.body;

    if (!patientCount || !patientConditionCount) {
      return res.status(400).json({ error: "Missing required patient data" });
    }

    /*
        AI INTEGRATION POINT — replace mock below with your LLM SDK call.

        Recommended prompt:
        `You are an emergency medical dispatch AI.
        An incident has occurred with ${patientCount} total patients.
        Conditions: ${patientConditionCount.CRITICAL} Critical, ${patientConditionCount.SERIOUS} Serious, ${patientConditionCount.MODERATE} Moderate.
        Assign each patient to a hospital. You MUST use one of these hospital IDs: ${VALID_HOSPITAL_IDS.join(', ')}.
        Generate exactly ${patientCount} assignments.
        Respond ONLY with a valid raw JSON array:
        [{"ambulanceId": 1, "hospitalId": 3}, {"ambulanceId": 2, "hospitalId": 1}]
        Do not include markdown tags.`

        OpenAI: pass response_format: { type: "json_object" } (wrap array in { "dispatch": [...] })
        Gemini: set responseMimeType: "application/json"
        */

    const assignments = [...VALID_HOSPITAL_IDS];
    while (assignments.length < patientCount) {
      assignments.push(
        VALID_HOSPITAL_IDS[
          Math.floor(Math.random() * VALID_HOSPITAL_IDS.length)
        ],
      );
    }
    for (let i = assignments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [assignments[i], assignments[j]] = [assignments[j], assignments[i]];
    }

    const mockDispatchData = assignments
      .slice(0, patientCount)
      .map((hospitalId, idx) => ({ ambulanceId: idx + 1, hospitalId }));

    return res.status(200).json(mockDispatchData);
  } catch (error) {
    console.error("Dispatch AI Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate dispatch routes" });
  }
});

module.exports = router;
