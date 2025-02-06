import fs from "fs";
import path from "path";

export default function sitemap() {
  const pagesDirectory = path.join(process.cwd(), "src", "app");

  /**
   * Checks if a given directory has a file named "page" or "layout"
   * with a supported extension.
   */
  function hasPageOrLayout(dirPath) {
    const files = fs.readdirSync(dirPath);
    return files.some((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isFile()) {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        return (
          (name === "page" || name === "layout") &&
          /\.(js|jsx|ts|tsx)$/.test(file)
        );
      }
      return false;
    });
  }

  /**
   * Recursively walks the pages directory.
   *
   * currentRoute is built as we go deeper. If the current directory contains
   * a "page" or "layout" file (or if we're at the root), then we consider
   * it as a valid route. (We also skip directories named "not-found" or "sitemap".)
   */
  function getRoutesFromDir(dirPath, currentRoute = "") {
    let routes = [];

    // The root directory (i.e. currentRoute === "") should be included.
    // For subdirectories, include the route only if a page/layout file exists.
    if (currentRoute === "" || hasPageOrLayout(dirPath)) {
      // Build the route path – the root should be "/"
      const routePath =
        currentRoute === "" ? "/" : "/" + currentRoute.replace(/\\/g, "/");
      // Skip unwanted routes
      if (routePath !== "/not-found" && routePath !== "/sitemap") {
        routes.push(routePath);
      }
    }

    // Recurse into subdirectories.
    const items = fs.readdirSync(dirPath);
    items.forEach((item) => {
      const fullPath = path.join(dirPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        // Skip directories we don't want at all.
        if (item === "not-found" || item === "sitemap") {
          return;
        }
        // Build the new route segment.
        const newRoute = currentRoute === "" ? item : `${currentRoute}/${item}`;
        routes = routes.concat(getRoutesFromDir(fullPath, newRoute));
      }
    });

    return routes;
  }

  // Retrieve all routes from the pages directory.
  const routes = getRoutesFromDir(pagesDirectory);

  // Remove duplicates if any.
  const uniqueRoutes = Array.from(new Set(routes));

  // Map routes to sitemap entries.
  const sitemapEntries = uniqueRoutes.map((route) => ({
    url: `https://onton.online${route}`,
    lastModified: new Date(),
    priority: route === "/" ? 1 : 0.8,
  }));

  return sitemapEntries;
}
