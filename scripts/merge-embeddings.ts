#!/usr/bin/env node
import OpenAI from "openai";
import fs from "fs";
import readline from "readline";
import path from "path";

interface ActivityRecord {
  name: string;
  description?: string;
  urgency: "low" | "medium" | "high";
  location?: {
    name: string;
    placeId: string;
    formattedAddress: string;
    latitude?: number;
    longitude?: number;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
  };
  endDate?: string;
  isPublic?: boolean;
  userId?: string;
  tags?: string[];
  imageId?: string;
  embedding?: number[];
}

interface BatchResponseLine {
  id: string;
  custom_id: string;
  response: {
    status_code: number;
    body: {
      data: Array<{
        embedding: number[];
        index: number;
      }>;
    };
  };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: npm run merge-embeddings <original-jsonl> <batch-id-or-output-file>"
    );
    console.error(
      "Examples:\n  npm run merge-embeddings seed/home_activities_gen_150.jsonl batch_abc123\n  npm run merge-embeddings seed/home_activities_gen_150.jsonl batch_output.jsonl"
    );
    process.exit(1);
  }

  const originalFilePath = args[0];
  const batchIdOrFile = args[1];

  // Validate original file exists
  if (!fs.existsSync(originalFilePath)) {
    console.error(`Error: Original file not found: ${originalFilePath}`);
    process.exit(1);
  }

  let batchOutputPath: string;

  // Check if second argument is a batch ID or file path
  if (batchIdOrFile.startsWith("batch_") && !batchIdOrFile.includes("/")) {
    // It's a batch ID - download the results
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Error: OPENAI_API_KEY environment variable is not set");
      process.exit(1);
    }

    const openai = new OpenAI({ apiKey });
    console.log(`Fetching batch results for: ${batchIdOrFile}`);

    try {
      const batch = await openai.batches.retrieve(batchIdOrFile);

      if (batch.status !== "completed") {
        console.error(
          `Error: Batch status is "${batch.status}", not "completed"`
        );
        console.error(
          `Please wait for the batch to complete before merging embeddings.`
        );
        process.exit(1);
      }

      if (!batch.output_file_id) {
        console.error("Error: Batch has no output file");
        process.exit(1);
      }

      console.log(`Downloading batch output file: ${batch.output_file_id}`);
      const fileContent = await openai.files.content(batch.output_file_id);
      const fileBuffer = Buffer.from(await fileContent.arrayBuffer());

      // Save to temporary file
      batchOutputPath = path.join(
        path.dirname(originalFilePath),
        `batch_output_${Date.now()}.jsonl`
      );
      fs.writeFileSync(batchOutputPath, fileBuffer);
      console.log(`Batch output saved to: ${batchOutputPath}`);
    } catch (error) {
      console.error(
        `Error fetching batch: ${error instanceof Error ? error.message : error}`
      );
      process.exit(1);
    }
  } else {
    // It's a file path
    if (!fs.existsSync(batchIdOrFile)) {
      console.error(`Error: Batch output file not found: ${batchIdOrFile}`);
      process.exit(1);
    }
    batchOutputPath = batchIdOrFile;
  }

  console.log(`Reading batch output: ${batchOutputPath}`);

  // Read batch output and create a map of custom_id -> embedding
  const embeddingsMap = new Map<string, number[]>();

  const batchStream = fs.createReadStream(batchOutputPath);
  const batchRl = readline.createInterface({
    input: batchStream,
    crlfDelay: Infinity,
  });

  for await (const line of batchRl) {
    if (!line.trim()) continue;

    try {
      const batchResponse: BatchResponseLine = JSON.parse(line);

      if (
        batchResponse.response.status_code === 200 &&
        batchResponse.response.body.data?.[0]?.embedding
      ) {
        embeddingsMap.set(
          batchResponse.custom_id,
          batchResponse.response.body.data[0].embedding
        );
      } else {
        console.warn(
          `Warning: No embedding in response for ${batchResponse.custom_id}`
        );
      }
    } catch (error) {
      console.error(`Error parsing batch output line: ${error}`);
    }
  }

  console.log(`Loaded ${embeddingsMap.size} embeddings`);

  // Read original file and merge embeddings
  const originalFileName = path.basename(originalFilePath, ".jsonl");
  const projectRoot = path.dirname(path.dirname(originalFilePath));
  const readyDir = path.join(projectRoot, "seed", "ready");

  // Ensure ready directory exists
  if (!fs.existsSync(readyDir)) {
    fs.mkdirSync(readyDir, { recursive: true });
  }

  const outputFilePath = path.join(
    readyDir,
    `${originalFileName}_with_embeddings.jsonl`
  );
  const writeStream = fs.createWriteStream(outputFilePath);

  const originalStream = fs.createReadStream(originalFilePath);
  const originalRl = readline.createInterface({
    input: originalStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  let mergedCount = 0;

  for await (const line of originalRl) {
    lineNumber++;

    if (!line.trim()) continue;

    try {
      const activity: ActivityRecord = JSON.parse(line);
      const customId = `request-${lineNumber}`;
      const embedding = embeddingsMap.get(customId);

      if (embedding) {
        activity.embedding = embedding;
        mergedCount++;
      } else {
        console.warn(`Warning: No embedding found for line ${lineNumber}`);
      }

      writeStream.write(JSON.stringify(activity) + "\n");
    } catch (error) {
      console.error(`Error processing line ${lineNumber}: ${error}`);
    }
  }

  writeStream.end();

  // Wait for write stream to finish
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  console.log(`\n✅ Merge complete!`);
  console.log(`Merged ${mergedCount} embeddings into ${lineNumber} records`);
  console.log(`Output file: ${outputFilePath}`);

  // Clean up downloaded batch file if we created it
  if (
    batchIdOrFile.startsWith("batch_") &&
    !batchIdOrFile.includes("/") &&
    fs.existsSync(batchOutputPath)
  ) {
    fs.unlinkSync(batchOutputPath);
    console.log(`Cleaned up temporary file: ${batchOutputPath}`);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
