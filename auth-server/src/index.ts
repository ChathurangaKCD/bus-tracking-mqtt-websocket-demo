import express, { Request, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import { generatePassword } from "./utils";
import { authRoutes } from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/", authRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const devices = generateDeviceList();
console.log("\nDevice Credentials:");
console.log("=====================");
devices.forEach((device) => {
  console.log(`${device.id}: ${device.password}`);
});
console.log("=====================\n");

app.listen(PORT, () => {
  console.log(`[AUTH] Server running on http://localhost:${PORT}`);
  console.log(`[AUTH] RabbitMQ will use this server for MQTT authentication`);
});

function generateDeviceList(): Array<{ id: string; password: string }> {
  const devices = [];
  for (let i = 1; i <= 50; i++) {
    const deviceId = `Bus-${i}`;
    devices.push({
      id: deviceId,
      password: generatePassword(deviceId),
    });
  }
  return devices;
}
