// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const latestByTxn = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  let event;
  try {
    event = JSON.parse(trimmed);
  } catch {
    continue;
  }

  if (!event || typeof event !== "object" || !event.txn_id || !event.ts) {
    continue;
  }

  const existing = latestByTxn.get(event.txn_id);
  if (!existing || event.ts > existing.ts) {
    latestByTxn.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;

for (const event of latestByTxn.values()) {
  if (event.status === "success") {
    let amount = event.amount;
    if (typeof amount === "string") {
      amount = parseFloat(amount.replace(/,/g, ""));
    } else {
      amount = Number(amount);
    }
    total += amount;
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
