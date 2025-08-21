import { program } from "commander";
import * as mqtt from "mqtt";
import chalk from "chalk";
import dotenv from "dotenv";
import { generateRandomData, validateDeviceId } from "./utils";

dotenv.config();

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const PUBLISH_INTERVAL = parseInt(process.env.PUBLISH_INTERVAL || "5000", 10);

program
  .name("device-cli")
  .description("MQTT device simulator for bus tracking")
  .version("1.0.0")
  .requiredOption("-d, --device-id <id>", "Device ID (e.g., Bus-1)")
  .option(
    "-p, --password <password>",
    "Device password (required when auth enabled)"
  )
  .option(
    "-i, --interval <ms>",
    "Publish interval in milliseconds",
    PUBLISH_INTERVAL.toString()
  )
  .parse();

const options = program.opts();
const deviceId = options.deviceId;
const password = options.password;
const interval = parseInt(options.interval, 10);

if (!validateDeviceId(deviceId)) {
  console.error(
    chalk.red("❌ Invalid device ID. Must be in format Bus-N where N is 1-50")
  );
  process.exit(1);
}

console.log(chalk.blue(`🚌 Starting device: ${deviceId}`));
console.log(chalk.gray(`📡 Connecting to MQTT broker: ${MQTT_BROKER_URL}`));

// Build MQTT connection options
const mqttOptions: any = {
  clientId: deviceId,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
};

// Add authentication only if enabled
mqttOptions.username = deviceId;
mqttOptions.password = password;

const client = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

const topic = `/some/path/${deviceId}`;
let publishInterval: NodeJS.Timeout | null = null;
let messageCount = 0;

client.on("connect", () => {
  console.log(chalk.green(`✅ Connected to MQTT broker`));
  console.log(chalk.blue(`📢 Publishing to topic: ${topic}`));

  startPublishing();
});

client.on("error", (error) => {
  console.error(chalk.red(`❌ MQTT Error: ${error.message}`));
});

client.on("close", () => {
  console.log(chalk.yellow("🔌 Disconnected from MQTT broker"));
  stopPublishing();
});

client.on("reconnect", () => {
  console.log(chalk.yellow("🔄 Reconnecting to MQTT broker..."));
});

client.on("offline", () => {
  console.log(chalk.yellow("📴 Client is offline"));
  stopPublishing();
});

function startPublishing(): void {
  if (publishInterval) return;

  publishInterval = setInterval(() => {
    const data = generateRandomData(deviceId);
    const message = JSON.stringify(data);

    client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        console.error(chalk.red(`❌ Failed to publish: ${error.message}`));
      } else {
        messageCount++;
        console.log(chalk.green(`📤 [${messageCount}] Published: ${message}`));
      }
    });
  }, interval);
}

function stopPublishing(): void {
  if (publishInterval) {
    clearInterval(publishInterval);
    publishInterval = null;
  }
}

process.on("SIGINT", () => {
  console.log(chalk.yellow("\n👋 Shutting down gracefully..."));
  stopPublishing();
  client.end(true, {}, () => {
    console.log(chalk.blue("✅ Disconnected cleanly"));
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  stopPublishing();
  client.end(true);
  process.exit(0);
});
