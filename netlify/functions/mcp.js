const fs = require("fs");
const path = require("path");

function loadAtoms() {
  const dir = path.join(process.cwd(), "atoms");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  const atoms = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
    catch { return null; }
  }).filter(Boolean);
  atoms.sort((a,b) => new Date(b.id.report_date) - new Date(a.id.report_date));
  return atoms;
}

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === "GET" && event.queryStringParameters?.manifest === "1") {
      const manifest = fs.readFileSync(path.join(process.cwd(), "mcp", "manifest.json"), "utf8");
      return { statusCode: 200, headers: {"content-type":"application/json"}, body: manifest };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Use POST for JSON-RPC requests." };
    }
    const req = JSON.parse(event.body || "{}");
    const { id, method, params } = req;
    const atoms = loadAtoms();

    if (method === "search_by_location") {
      const region = (params?.region || "").toLowerCase();
      const country = (params?.country || "").toLowerCase();
      const result = atoms.filter(a => {
        const r = (a.id.region || "").toLowerCase();
        const c = (a.id.country || "").toLowerCase();
        const regionOk = region ? r.includes(region) : true;
        const countryOk = country ? c.includes(country) : true;
        return regionOk && countryOk;
      });
      return respond(id, { items: result });
    }

    if (method === "search_most_recent") {
      return respond(id, { items: atoms.slice(0,3) });
    }

    if (method === "search_definitions") {
      const defs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "mcp", "definitions.json"), "utf8"));
      return respond(id, defs.result);
    }

    return rpcError(id, -32601, "Method not found");
  } catch (e) {
    return rpcError(null, -32603, e.message || "Internal error");
  }
};

function respond(id, result) {
  return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ jsonrpc: "2.0", id, result }) };
}
function rpcError(id, code, message) {
  return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) };
}
