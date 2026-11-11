import http from "node:http";
import https from "node:https";
import net from "node:net";
import dns from "node:dns/promises";

function publicIPv4(ip) {
  if (!net.isIPv4(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127));
}

export async function resolveNativeApi(host) {
  if (host !== "api.anthropic.com") throw Error("Unexpected native API hostname");
  // DNS packets use the owner's configured resolver, not the loopback /etc/hosts alias.
  const resolver = new dns.Resolver({ timeout: 3000, tries: 1 });
  const addresses = (await resolver.resolve4(host)).filter(publicIPv4);
  if (!addresses.length) throw Error("Native API DNS did not return a public address");
  return addresses[0];
}

export function bypassesProxy(host, port, noProxy = "") {
  return noProxy.split(/[\s,]+/).filter(Boolean).some(entry => {
    if (entry === "*") return true;
    const [name, specifiedPort] = entry.toLowerCase().split(":");
    if (specifiedPort && Number(specifiedPort) !== port) return false;
    const suffix = name.replace(/^\*?\./, "");
    return host === suffix || host.endsWith("." + suffix);
  });
}

export async function startTerminalTunnel({ upstreamProxy, noProxy = "", resolveApi = resolveNativeApi,
  connect = (options) => net.connect(options), idleTimeout = 600000 } = {}) {
  const sockets = new Set();
  const server = http.createServer((_req, res) => { res.writeHead(405); res.end(); });
  const track = (socket) => {
    sockets.add(socket); socket.setTimeout(idleTimeout, () => socket.destroy());
    socket.on("error", () => {}); socket.once("close", () => sockets.delete(socket));
    return socket;
  };
  server.on("connection", (socket) => {
    if (sockets.size >= 32) socket.destroy(); else track(socket);
  });
  server.on("connect", async (req, client, head) => {
    let upstream;
    const reject = () => {
      if (!client.destroyed) client.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n");
      upstream?.destroy();
    };
    const bind = (socket, extra = Buffer.alloc(0)) => {
      upstream = track(socket);
      if (client.destroyed) return upstream.destroy();
      client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length) upstream.write(head);
      if (extra.length) client.write(extra);
      client.pipe(upstream); upstream.pipe(client);
      client.once("close", () => upstream.destroy());
      upstream.once("close", () => client.destroy());
    };
    try {
      const target = new URL("https://" + req.url);
      if (target.username || target.password || target.pathname !== "/" || target.search || target.hash)
        throw Error("Invalid CONNECT authority");
      const host = target.hostname.replace(/^\[|\]$/g, ""), port = Number(target.port || 443);
      if (host === "api.anthropic.com" && port !== 443) throw Error("Invalid native API port");
      if (upstreamProxy && !bypassesProxy(host, port, noProxy)) {
        const proxy = new URL(upstreamProxy);
        if (!["http:", "https:"].includes(proxy.protocol)) throw Error("Unsupported existing proxy");
        const headers = { host: req.url };
        if (proxy.username || proxy.password) headers["proxy-authorization"] = "Basic " +
          Buffer.from(decodeURIComponent(proxy.username) + ":" + decodeURIComponent(proxy.password)).toString("base64");
        const request = (proxy.protocol === "https:" ? https : http).request({
          hostname: proxy.hostname, port: proxy.port || (proxy.protocol === "https:" ? 443 : 80),
          method: "CONNECT", path: req.url, headers, timeout: 10000,
        });
        request.on("connect", (response, socket, extra) => {
          if (response.statusCode !== 200) { socket.destroy(); reject(); } else bind(socket, extra);
        });
        request.on("error", reject); request.on("timeout", () => request.destroy()); request.end();
      } else {
        const destination = host === "api.anthropic.com" ? await resolveApi(host) : host;
        const socket = connect({ host: destination, port });
        upstream = socket; socket.setTimeout(10000, () => { socket.destroy(); reject(); });
        socket.once("error", reject); socket.once("connect", () => bind(socket));
        client.once("close", () => socket.destroy());
      }
    } catch { reject(); }
  });
  server.headersTimeout = 10000;
  await new Promise((resolve, reject) => {
    server.once("error", reject); server.listen(0, "127.0.0.1", resolve);
  });
  return { url: `http://127.0.0.1:${server.address().port}`,
    close: () => { for (const socket of sockets) socket.destroy(); server.close(); } };
}
