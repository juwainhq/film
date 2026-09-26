const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = path.join(__dirname, "client");

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".cube": "text/plain",
    ".jsx": "text/plain"
};

const server = http.createServer((req, res) => {
    // Enable CORS and preview framing
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("X-Frame-Options", "ALLOWALL");

    let reqPath = req.url.split("?")[0];
    if (reqPath === "/" || reqPath === "") {
        reqPath = "/index.html";
    }

    let filePath = path.join(CLIENT_DIR, reqPath);

    // Also support serving repo root files if requested (e.g. CSXS or host)
    if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, reqPath);
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end(`404 Not Found: ${req.url}`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": contentType });
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`[RetroFilm Dev Preview Server] Running at http://${HOST}:${PORT}`);
    console.log(`Serving CEP Client from: ${CLIENT_DIR}`);
});
