const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
// Routes
app.use("/auth", require("./routes/auth"));
app.use("/hospitals", require("./routes/hospitals"));
app.use("/resources", require("./routes/resources"));
app.use("/blood-stock", require("./routes/bloodStock"));
app.use("/patients", require("./routes/patients"));
app.use("/emergencies", require("./routes/emergencies"));
app.use("/transfers", require("./routes/transfers"));
app.use("/blood-transfers", require("./routes/bloodTransfers"));
app.use("/doctors", require("./routes/doctors"));
app.use("/user", require("./routes/user"));
app.use("/route-proxy", require("./routes/routeProxy"));
app.use("/ai", require("./routes/ai"));

app.get("/", (req, res) => {
  res.json({ message: "Medsutra Backend API is running" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
