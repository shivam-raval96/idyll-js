/**
 * Table of Contents Generator
 * Generates a dynamic table of contents from article headings
 */

export function generateTableOfContents() {
  const article = document.querySelector("d-article");
  const toc = document.querySelector("d-contents");

  if (!toc || !article) return;

  const headings = article.querySelectorAll("h2, h3, h4");
  let ToC = `<nav role="navigation" class="l-text figcaption"><div class="toc-header" onclick="toggleTOC()">
        <span class="toc-title">Table of Contents</span>
        <span class="toggle-icon">▼</span>
        </div><div class="toc-content">`;
  let prevLevel = 0;

  for (const el of headings) {
    // should element be included in TOC?
    const isInTitle = el.parentElement.tagName == "D-TITLE";
    const isException = el.getAttribute("no-toc");
    if (isInTitle || isException) continue;

    el.setAttribute("id", el.textContent.toLowerCase().replaceAll(" ", "_"));
    const link =
      '<a target="_self" href="' +
      "#" +
      el.getAttribute("id") +
      '">' +
      el.textContent +
      "</a>";

    const level = el.tagName === "H2" ? 0 : el.tagName === "H3" ? 1 : 2;
    while (prevLevel < level) {
      ToC += "<ul>";
      prevLevel++;
    }
    while (prevLevel > level) {
      ToC += "</ul>";
      prevLevel--;
    }
    if (level === 0) ToC += "<div>" + link + "</div>";
    else ToC += "<li>" + link + "</li>";
  }

  while (prevLevel > 0) {
    ToC += "</ul>";
    prevLevel--;
  }
  ToC += "</div></nav>";
  toc.innerHTML = ToC;
  toc.setAttribute("prerendered", "true");
}
