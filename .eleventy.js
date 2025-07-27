const fs = require("fs");
const path = require("path");

module.exports = function(eleventyConfig) {
  // Copy static assets and the MCP manifest through to the output unchanged
  eleventyConfig.addPassthroughCopy({"src/static": "static"});
  eleventyConfig.addPassthroughCopy({"mcp/manifest.json": "mcp/manifest.json"});

  // Build a collection of "atoms" from /atoms/*.json (newest first)
  eleventyConfig.addCollection("atoms", function() {
    const atomsDir = path.join(__dirname, "atoms");
    if (!fs.existsSync(atomsDir)) return [];
    const files = fs.readdirSync(atomsDir).filter(f => f.endsWith(".json"));
    const atoms = files.map(f => {
      const raw = fs.readFileSync(path.join(atomsDir, f), "utf8");
      try { return JSON.parse(raw); } catch (e) { return null; }
    }).filter(Boolean);
    atoms.sort((a,b) => new Date(b.id.report_date) - new Date(a.id.report_date));
    return atoms;
  });

  // Tell Eleventy where to find input/templates and where to write output
  return {
    dir: {
      input: "src",        // look for pages/templates in ./src
      includes: "_includes", // layouts live in ./src/_includes
      output: "_site"      // build output directory
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
