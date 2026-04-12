import fs from "fs";
import path from "path";

async function testZapper() {
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
          if (key === "ZAPPER_API_KEYS" || key === "VITE_ZAPPER_KEYS" || key === "VITE_ZAPPER_KEY") {
            apiKey = value.split(",")[0].trim();
          }
        }
      });
    }

    if (!apiKey) {
      console.log("❌ Could not find ZAPPER_API_KEYS or VITE_ZAPPER_KEY in .env");
      return;
    }

    console.log(`Using API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

    const testAddress = "0xfcc06f7f02f6ab02051f259db4f82f20d8d02112"; // vitalik.eth

    console.log(`\nTesting Zapper balances endpoint for ${testAddress}...`);
    const balanceRes = await fetch(
      `https://api.zapper.xyz/v2/balances?addresses[]=${testAddress}`,
      {
        headers: {
          "Authorization": `Basic ${Buffer.from(apiKey + ":").toString('base64')}`,
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
    console.log("✅ Success! Balance Data for vitalik.eth:", JSON.stringify(data).substring(0, 200) + "...");

  } catch (err) {
    console.error("Test script failed:", err);
  }
}

testZapper();
