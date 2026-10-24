import process from "node:process";
import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("Set MONGODB_URI or MONGO_URI before running this script.");
}

function cleanName(name, categoryName = "") {
  let cleaned = String(name ?? "").trim();
  const hasUnstitched = /\bunstitched(?:\s+fabric)?\b/i.test(cleaned);
  cleaned = cleaned.replace(/\bunstitched\s+fabric\b/gi, "");
  cleaned = cleaned.replace(/\bfabric\b/gi, "");
  if (categoryName && normalize(categoryName) !== normalize(cleaned)) {
    const escaped = categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`, "gi"), " ");
  }
  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—|:]+|[\s\-–—|:]+$/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
  if (hasUnstitched && !/\bunstitched\b/i.test(cleaned)) {
    cleaned = `${cleaned} (Unstitched)`;
  }
  return cleaned || String(name ?? "").trim();
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function run() {
  await mongoose.connect(mongoUri);
  const database = mongoose.connection.db;
  if (!database) throw new Error("Connected to MongoDB without selecting a database.");
  const products = await database.collection("products").aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        "categoryInfo.name": 1,
      },
    },
  ]).toArray();

  const changes = products
    .map((product) => ({
      productId: product._id,
      oldName: product.name,
      newName: cleanName(product.name, product.categoryInfo?.[0]?.name),
    }))
    .filter((item) => item.oldName !== item.newName);

  console.table(changes.map(({ oldName, newName }) => ({ oldName, newName })));
  console.log(`${changes.length} product title(s) would change.`);
  if (!process.argv.includes("--apply") || changes.length === 0) {
    console.log("Preview only. Re-run with --apply to review and confirm before writing.");
    return;
  }

  const { createInterface } = await import("node:readline/promises");
  const { stdin, stdout } = await import("node:process");
  const prompt = createInterface({ input: stdin, output: stdout });
  const confirmation = await prompt.question('Type "APPLY" to update these product titles: ');
  prompt.close();
  if (confirmation !== "APPLY") {
    console.log("No product titles were changed.");
    return;
  }

  const result = await database.collection("products").bulkWrite(
    changes.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, name: item.oldName },
        update: { $set: { name: item.newName } },
      },
    })),
    { ordered: false }
  );
  console.log(`Updated ${result.modifiedCount} product title(s).`);
}

run()
  .catch((error) => {
    console.error("Product title cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
