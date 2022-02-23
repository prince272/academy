const { createServer } = require("https");
const next = require("next");
const { parse } = require("url");
const fs = require("fs");
const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const serverOptions = {
  key: fs.readFileSync('resources/certificates/localhost-key.pem'),
  cert: fs.readFileSync('resources/certificates/localhost.pem'),
};

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://localhost:${port}`);
  });
});
