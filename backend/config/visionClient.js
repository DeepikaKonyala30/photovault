import { ImageAnnotatorClient } from "@google-cloud/vision";

// Use credentials from environment variable instead of local file
if (!process.env.GCLOUD_JSON) {
  throw new Error("GCLOUD_JSON environment variable is missing!");
}

const credentials = JSON.parse(process.env.GCLOUD_JSON);

const client = new ImageAnnotatorClient({ credentials });

export default client;
