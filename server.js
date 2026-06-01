const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const rootDir = __dirname;
const saveDir = path.join(rootDir, "saved-results");
const saveFile = path.join(saveDir, "search-results.json");
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const send = (response, statusCode, body, contentType = "text/plain; charset=utf-8") => {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
};

const readJsonBody = (request) => new Promise((resolve, reject) => {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk;

    if (body.length > 100_000) {
      request.destroy();
      reject(new Error("Request body is too large"));
    }
  });

  request.on("end", () => {
    try {
      resolve(JSON.parse(body || "{}"));
    } catch (error) {
      reject(error);
    }
  });

  request.on("error", reject);
});

const loadResults = async () => {
  try {
    const file = await fs.readFile(saveFile, "utf-8");
    return JSON.parse(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const saveResult = async (result) => {
  const cleanResult = {
    query: String(result.query || "").trim(),
    place: String(result.place || "").trim(),
    count: Number(result.count) || 0,
    time: String(result.time || "").trim(),
    savedAt: String(result.savedAt || new Date().toISOString()),
  };

  if (!cleanResult.query || !cleanResult.place) {
    throw new Error("Query and place are required");
  }

  await fs.mkdir(saveDir, { recursive: true });
  const results = await loadResults();
  results.unshift(cleanResult);
  await fs.writeFile(saveFile, `${JSON.stringify(results, null, 2)}\n`, "utf-8");

  return cleanResult;
};

const serveStatic = async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.normalize(path.join(rootDir, pathname));

  if (!filePath.startsWith(rootDir)) {
    send(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    send(response, 200, file, contentType);
  } catch (error) {
    send(response, error.code === "ENOENT" ? 404 : 500, "Not found");
  }
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/search-results") {
      const result = await saveResult(await readJsonBody(request));
      send(response, 201, JSON.stringify({ ok: true, result }), "application/json; charset=utf-8");
      return;
    }

    if (request.method === "GET" && request.url === "/api/search-results") {
      send(response, 200, JSON.stringify(await loadResults()), "application/json; charset=utf-8");
      return;
    }

    if (request.method === "GET") {
      await serveStatic(request, response);
      return;
    }

    send(response, 405, "Method not allowed");
  } catch (error) {
    send(response, 500, JSON.stringify({ ok: false, error: error.message }), "application/json; charset=utf-8");
  }
});

server.listen(port, () => {
  console.log(`Search page: http://127.0.0.1:${port}`);
  console.log(`Saved results: ${saveFile}`);
});
