import fs from "fs";
import path from "path";

async function testDeBank() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    let apiKey = "";
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, "utf-8");
      envFile.split("\n").forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let key = match[1];
          let value = match[2] || "";
          value = value.replace(/^(['"])(.*)\1$/, "$2");
          if (key === "DEBANK_API_KEYS" || key === "VITE_DEBANK_API_KEY") {
            apiKey = value.split(",")[0].trim();
          }
        }
      });
    }

    if (!apiKey) {
      console.log("❌ Could not find DEBANK_API_KEYS or VITE_DEBANK_API_KEY in .env");
      return;
    }

    console.log(`Using API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

    // Test a common active address
    const testAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth

    console.log(`\nTesting PRO total_balance endpoint for ${testAddress}...`);
    const balanceRes = await fetch(
      `https://pro-openapi.debank.com/v1/user/total_balance?id=${testAddress}`,
      {
        headers: {
          "AccessKey": apiKey,
          "Accept": "application/json",
        },
      }
    );

    console.log(`Status: ${balanceRes.status} ${balanceRes.statusText}`);
    
    if (!balanceRes.ok) {
      const text = await balanceRes.text();
      console.log(`Error Response: ${text}`);
      return;
    }

    const data = await balanceRes.json();
    console.log("✅ Success! Total Balance Data:", JSON.stringify(data).substring(0, 100) + "...");

  } catch (err) {
    console.error("Test script failed:", err);
  }
}

testDeBank();
