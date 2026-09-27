import "dotenv/config";
import statsCard from "./api/index.js";
import repoCard from "./api/pin.js";
import langCard from "./api/top-langs.js";
import wakatimeCard from "./api/wakatime.js";
import gistCard from "./api/gist.js";
import streakCard from "./api/streak.js";
import profile from "./api/profile.js";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.listen(process.env.port || 9004);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use("/preview", express.static(path.join(__dirname, "ui")));

app.get(["/", "/api"], statsCard);
app.get(["/pin", "/api/pin"], repoCard);
app.get(["/top-langs", "/api/top-langs"], langCard);
app.get(["/wakatime", "/api/wakatime"], wakatimeCard);
app.get(["/gist", "/api/gist"], gistCard);
app.get(["/streak", "/api/streak"], streakCard);
app.get("/api/profile", profile);
