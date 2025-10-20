import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const storage = new Storage({
  credentials: JSON.parse(process.env.GCLOUD_JSON),
  projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);

export default bucket;