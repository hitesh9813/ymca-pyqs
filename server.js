const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, "uploads");
const movieDir = path.join(__dirname, "movies");
const movieDataPath = path.join(__dirname, "movie-data.json");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(movieDir)) fs.mkdirSync(movieDir);
if (!fs.existsSync(movieDataPath)) fs.writeFileSync(movieDataPath, JSON.stringify({}));

app.use(express.static("public"));
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
  res.redirect("/");
});

app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json([]);
    res.json(files);
  });
});

app.post("/upload-movie", movieUpload.single("movie"), (req, res) => {
  const movieName = req.file.originalname;
  let data = JSON.parse(fs.readFileSync(movieDataPath));
  data[movieName] = 0;
  fs.writeFileSync(movieDataPath, JSON.stringify(data, null, 2));
  res.redirect("/");
});

app.get("/movies", (req, res) => {
  const data = JSON.parse(fs.readFileSync(movieDataPath));
  const list = Object.entries(data).map(([name, views]) => ({ name, views }));
  res.json(list);
});

app.get("/watch/:name", (req, res) => {
  const moviePath = path.join(movieDir, req.params.name);
  if (!fs.existsSync(moviePath)) return res.status(404).send("Not found");
  let data = JSON.parse(fs.readFileSync(movieDataPath));
  data[req.params.name] = (data[req.params.name] || 0) + 1;
  fs.writeFileSync(movieDataPath, JSON.stringify(data, null, 2));
  res.sendFile(moviePath);
});

app.get("/download-movie/:name", (req, res) => {
  const moviePath = path.join(movieDir, req.params.name);
  if (!fs.existsSync(moviePath)) return res.status(404).send("Not found");
  res.download(moviePath);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
