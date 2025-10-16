import { Storage } from "@google-cloud/storage";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const storage = new Storage({
  keyFilename: path.join(process.cwd(), "config", "gcloud-key.json"),
  projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);

export default bucket;
