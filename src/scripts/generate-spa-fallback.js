import fs from "node:fs";
import path from "node:path";

const distClientPath = path.join(process.cwd(), "dist", "client");
const assetsPath = path.join(distClientPath, "assets");

try {
  if (!fs.existsSync(assetsPath)) {
    console.error("Assets path does not exist:", assetsPath);
    process.exit(1);
  }

  const files = fs.readdirSync(assetsPath);

  // Find the CSS file
  const cssFile = files.find((f) => f.endsWith(".css"));
  // Find the primary entry Javascript file (index-*.js)
  const jsFile =
    files.find((f) => f.startsWith("index-") && f.endsWith(".js")) ||
    files.find((f) => f.endsWith(".js"));

  if (!jsFile) {
    console.error("Core entry JS file not found in assets!");
    process.exit(1);
  }

  const cssTag = cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : "";
  const jsPath = `/assets/${jsFile}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Alpha Prefac</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap" />
    ${cssTag}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${jsPath}"></script>
  </body>
</html>`;

  const fallbackHtmlPath = path.join(distClientPath, "index.html");
  fs.writeFileSync(fallbackHtmlPath, htmlContent, "utf-8");
  console.log(`Successfully generated SPA fallback at: ${fallbackHtmlPath}`);
  console.log(`- Loaded JS entry: ${jsPath}`);
  if (cssFile) console.log(`- Loaded CSS bundle: /assets/${cssFile}`);
} catch (error) {
  console.error("Error generating SPA fallback index.html:", error);
  process.exit(1);
}
