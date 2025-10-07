#!/usr/bin/env node
import OpenAI from "openai";
import fs from "fs";
import readline from "readline";
import path from "path";

interface ActivityRecord {
  name: string;
  description?: string;
  location?: {
    name?: string;
    formattedAddress?: string;
  };
  tags?: string[];
}

interface BatchEmbeddingRequest {
  custom_id: string;
  method: "POST";
  url: "/v1/embeddings";
  body: {
    model: string;
    input: string;
    encoding_format: "float";
  };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: npm run upload-embeddings <path-to-jsonl-file>");
    console.error("Example: npm run upload-embeddings seed/home_activities_gen_150.jsonl");
    process.exit(1);
  }

  const inputFilePath = args[0];

  // Validate input file exists
  if (!fs.existsSync(inputFilePath)) {
    console.error(`Error: File not found: ${inputFilePath}`);
    process.exit(1);
  }

  // Initialize OpenAI client
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Error: OPENAI_API_KEY environment variable is not set");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  console.log(`Reading input file: ${inputFilePath}`);

  // Create temporary file for formatted batch requests
  const tempFilePath = path.join(
    path.dirname(inputFilePath),
    `batch_${Date.now()}.jsonl`
  );

  const writeStream = fs.createWriteStream(tempFilePath);
  const fileStream = fs.createReadStream(inputFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  let processedCount = 0;

  try {
    for await (const line of rl) {
      lineNumber++;

      // Skip empty lines
      if (!line.trim()) continue;

      try {
        const activity: ActivityRecord = JSON.parse(line);

        // Build input text from all available fields
        const parts: string[] = [];

        if (activity.name) parts.push(activity.name);
        if (activity.description) parts.push(activity.description);
        if (activity.location?.name) parts.push(activity.location.name);
        if (activity.location?.formattedAddress)
          parts.push(activity.location.formattedAddress);
        if (activity.tags && activity.tags.length > 0)
          parts.push(activity.tags.join(" "));

        const input = parts.join(" ");

        // Create batch request object
        const batchRequest: BatchEmbeddingRequest = {
          custom_id: `request-${lineNumber}`,
          method: "POST",
          url: "/v1/embeddings",
          body: {
            model: "text-embedding-3-small",
            input,
            encoding_format: "float",
          },
        };

        writeStream.write(JSON.stringify(batchRequest) + "\n");
        processedCount++;
      } catch (parseError) {
        console.error(`Error parsing line ${lineNumber}: ${parseError}`);
      }
    }

    writeStream.end();

    // Wait for write stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
    });

    console.log(`Processed ${processedCount} records`);
    console.log(`Formatted batch file created: ${tempFilePath}`);

    // Upload file to OpenAI
    console.log("Uploading file to OpenAI...");
    const file = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "batch",
    });

    console.log(`File uploaded successfully. File ID: ${file.id}`);

    // Create batch
    console.log("Creating batch job...");
    const batch = await openai.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/embeddings",
      completion_window: "24h",
    });

    console.log("\n✅ Batch created successfully!");
    console.log(`Batch ID: ${batch.id}`);
    console.log(`Status: ${batch.status}`);
    console.log(`Total requests: ${batch.request_counts?.total || 0}`);
    console.log(
      `\nCheck batch status with: openai api batches.retrieve -i ${batch.id}`
    );

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    console.log(`\nCleaned up temporary file: ${tempFilePath}`);
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
