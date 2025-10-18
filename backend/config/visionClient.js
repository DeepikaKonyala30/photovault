import { ImageAnnotatorClient } from "@google-cloud/vision";
import path from "path";

const keyPath = path.join(process.cwd(), "config", "gcloud-key.json");
const client = new ImageAnnotatorClient({ keyFilename: keyPath });

export default client;
