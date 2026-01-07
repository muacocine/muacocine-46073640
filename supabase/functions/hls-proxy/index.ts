// HLS Proxy Function (CORS-friendly)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

const ALLOWED_HOSTS = new Set([
  // Angola
  "video.tpa.ao",
  "cdn.zimbo.tv",
  "stream.ads.ottera.tv",
  "cdn-uw2-prod.tsv2.amagi.tv",
  "record-recordangola-1-ao.samsung.wurl.tv",

  // Portugal
  "streaming-live.rtp.pt",
  "d1zx6l1dn8vaj5.cloudfront.net",
  "video-auth6.iol.pt",
  "cmtv-live.videocdn.pt",

  // Internacional
  "live-hls-web-aje.getaj.net",
  "static.france.tv",
  "dwamdstream104.akamaized.net",
  "rakuten-euronews-2-eu.samsung.wurl.tv",
  "rt-glb.rttv.com",
  "nhkworld.webcdn.stream.ne.jp",
  "news.cgtn.com",
  "cdn.jmvstream.com",
  "record-recordnews-1-br.samsung.wurl.tv",

  // Demo/test streams
  "test-streams.mux.dev",
  "devstreaming-cdn.apple.com",
  "cph-p2p-msl.akamaized.net",

  // BBC (HLS endpoints)
  "a.files.bbci.co.uk",
  "vod-hls-uk.live.cf.md.bbci.co.uk",
  "vs-cmaf-pushb-uk.live.cf.md.bbci.co.uk",
]);

function isPlaylist(url: URL) {
  return url.pathname.endsWith(".m3u8") || url.search.includes(".m3u8") || url.pathname.endsWith(".m3u");
}

function buildProxyUrl(functionOrigin: string, target: string) {
  return `${functionOrigin}/functions/v1/hls-proxy?url=${encodeURIComponent(target)}`;
}

function rewritePlaylist(playlist: string, baseUrl: string, functionOrigin: string) {
  const base = new URL(baseUrl);

  return playlist
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;

      // Absolute or relative URL
      const abs = new URL(trimmed, base).toString();
      return buildProxyUrl(functionOrigin, abs);
    })
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const requestUrl = new URL(req.url);
    const raw = requestUrl.searchParams.get("url");

    if (!raw) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = new URL(raw);
    if (!(targetUrl.protocol === "http:" || targetUrl.protocol === "https:")) {
      return new Response(JSON.stringify({ error: "Invalid protocol" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: "Host not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MuacoTV/1.0)",
        Accept: "*/*",
        Connection: "keep-alive",
      },
    });

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return new Response(text || JSON.stringify({ error: "Upstream error" }), {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": contentType },
      });
    }

    // If playlist, rewrite URLs so segments also go through the proxy
    if (isPlaylist(targetUrl) && contentType.includes("application") || targetUrl.pathname.endsWith(".m3u8")) {
      const playlist = await upstream.text();
      const rewritten = rewritePlaylist(playlist, targetUrl.toString(), requestUrl.origin);
      return new Response(rewritten, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store",
        },
      });
    }

    // Binary segments (.ts/.m4s/etc.)
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
