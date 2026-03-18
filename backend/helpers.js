// Enum display mappings — exactly as per schema @map values

const RESOURCE_NAME_MAP = {
  ICU_BED: "ICU Bed",
  VENTILATOR: "Ventilator",
  GENERAL_BED: "General Bed",
  OXYGEN_CYLINDER: "Oxygen Cylinder",
  AMBULANCE: "Ambulance",
};

const BLOOD_GROUP_MAP = {
  A_PLUS: "A+",
  A_MINUS: "A-",
  B_PLUS: "B+",
  B_MINUS: "B-",
  AB_PLUS: "AB+",
  AB_MINUS: "AB-",
  O_PLUS: "O+",
  O_MINUS: "O-",
};

const TRANSFER_PROGRESS_MAP = {
  REQUEST_SENT: "Request Sent",
  ACCEPTED_BY_HOSPITAL: "Accepted by Hospital",
  AMBULANCE_ASSIGNED: "Ambulance Assigned",
  PATIENT_IN_TRANSIT: "Patient in Transit",
  TRANSFER_COMPLETED: "Transfer Completed",
};

const BLOOD_NETWORK_PROGRESS_MAP = {
  REQUEST_SENT: "Request Sent",
  ACCEPTED_BY_HOSPITAL: "Accepted by Hospital",
  COMPLETED: "Completed",
};

const RESOURCE_NAMES = Object.keys(RESOURCE_NAME_MAP);
const BLOOD_GROUPS = Object.keys(BLOOD_GROUP_MAP);

module.exports = {
  RESOURCE_NAME_MAP,
  BLOOD_GROUP_MAP,
  TRANSFER_PROGRESS_MAP,
  BLOOD_NETWORK_PROGRESS_MAP,
  RESOURCE_NAMES,
  BLOOD_GROUPS,
};
