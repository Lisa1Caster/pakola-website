param (
    [int]$Port = 3000,
    [string]$Root = $PSScriptRoot
)

$source = @"
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

public class PakolaServer {
    private HttpListener listener;
    private string rootDir;

    public static void StartServer(string root, int port) {
        var server = new PakolaServer();
        server.rootDir = Path.GetFullPath(root);
        server.listener = new HttpListener();
        server.listener.Prefixes.Add("http://localhost:" + port + "/");
        server.listener.Start();
        Console.WriteLine("Pakola Server running at http://localhost:" + port + "/");
        while (server.listener.IsListening) {
            try {
                var ctx = server.listener.GetContext();
                Task.Run(() => server.Handle(ctx));
            } catch (Exception) {
                // Ignore listener exceptions on shutdown
            }
        }
    }

    private void Handle(HttpListenerContext ctx) {
        try {
            var req = ctx.Request;
            var res = ctx.Response;
            string raw = req.Url.LocalPath;
            if (raw == "/" || string.IsNullOrEmpty(raw)) raw = "/index.html";
            string rel = Uri.UnescapeDataString(raw.TrimStart('/')).Replace('/', Path.DirectorySeparatorChar);
            string full = Path.Combine(rootDir, rel);

            if (File.Exists(full)) {
                string ext = Path.GetExtension(full).ToLowerInvariant();
                string mime = "application/octet-stream";
                if (ext == ".html") mime = "text/html; charset=utf-8";
                else if (ext == ".css") mime = "text/css; charset=utf-8";
                else if (ext == ".js") mime = "application/javascript; charset=utf-8";
                else if (ext == ".json") mime = "application/json";
                else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
                else if (ext == ".png") mime = "image/png";
                else if (ext == ".svg") mime = "image/svg+xml";
                else if (ext == ".webp") mime = "image/webp";
                else if (ext == ".ico") mime = "image/x-icon";
                else if (ext == ".woff2") mime = "font/woff2";

                res.ContentType = mime;
                res.AddHeader("Access-Control-Allow-Origin", "*");
                res.AddHeader("Cache-Control", "public, max-age=86400");
                byte[] data = File.ReadAllBytes(full);
                res.ContentLength64 = data.Length;
                res.StatusCode = 200;
                if (req.HttpMethod != "HEAD") {
                    res.OutputStream.Write(data, 0, data.Length);
                }
            } else {
                res.StatusCode = 404;
                byte[] msg = System.Text.Encoding.UTF8.GetBytes("Not Found: " + rel);
                res.ContentLength64 = msg.Length;
                if (req.HttpMethod != "HEAD") {
                    res.OutputStream.Write(msg, 0, msg.Length);
                }
            }
            res.OutputStream.Close();
        } catch {
            try { ctx.Response.OutputStream.Close(); } catch {}
        }
    }
}
"@

Add-Type -TypeDefinition $source -Language CSharp
[PakolaServer]::StartServer($Root, $Port)
