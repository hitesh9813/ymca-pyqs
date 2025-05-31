const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = "12345";

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const uploadDir = path.join(__dirname, "uploads");
const movieDir = path.join(__dirname, "movies");
const movieDataPath = path.join(__dirname, "movie-data.json");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(movieDir)) fs.mkdirSync(movieDir);
if (!fs.existsSync(movieDataPath)) fs.writeFileSync(movieDataPath, JSON.stringify({}));

app.use("/uploads", express.static(uploadDir));
app.use("/movies", express.static(movieDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const movieStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, movieDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });
const movieUpload = multer({ storage: movieStorage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (req.body.adminpass !== ADMIN_PASSWORD) return res.status(401).send("❌ Wrong Password");
  res.redirect("/");
});

app.post("/upload-movie", movieUpload.single("movie"), (req, res) => {
  if (req.body.adminpass !== ADMIN_PASSWORD) return res.status(401).send("❌ Wrong Password");
  const movieName = req.file.originalname;
  const data = JSON.parse(fs.readFileSync(movieDataPath));
  data[movieName] = { views: 0, date: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(movieDataPath, JSON.stringify(data, null, 2));
  res.redirect("/");
});

app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json([]);
    res.json(files);
  });
});

app.get("/movies", (req, res) => {
  const data = JSON.parse(fs.readFileSync(movieDataPath));
  const list = Object.entries(data).map(([name, info]) => ({ name, views: info.views }));
  res.json(list);
});

app.get("/watch/:name", (req, res) => {
  const moviePath = path.join(movieDir, req.params.name);
  if (!fs.existsSync(moviePath)) return res.status(404).send("Not found");
  const data = JSON.parse(fs.readFileSync(movieDataPath));
  data[req.params.name].views += 1;
  fs.writeFileSync(movieDataPath, JSON.stringify(data, null, 2));
  res.sendFile(moviePath);
});

app.get("/download-movie/:name", (req, res) => {
  const moviePath = path.join(movieDir, req.params.name);
  if (!fs.existsSync(moviePath)) return res.status(404).send("Not found");
  res.download(moviePath);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));