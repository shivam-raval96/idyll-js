/**
 * Scroll Monitor for Table of Contents
 * Handles scroll-based highlighting of active TOC links
 */

export function setupScrollMonitoring() {
  const article = document.querySelector("d-article");
  const toc = document.querySelector("d-contents");

  if (!toc || !article) return;

  const headings = article.querySelectorAll("h2, h3, h4");
  const toc_links = document.querySelectorAll("d-contents > nav div a");

  if (toc_links.length === 0) return;

  window.addEventListener("scroll", (_event) => {
    if (
      typeof headings != "undefined" &&
      headings != null &&
      typeof toc_links != "undefined" &&
      toc_links != null
    ) {
      find_active: {
        for (let i = headings.length - 1; i >= 0; i--) {
          const heading = headings[i];
          // Skip headings that shouldn't be in TOC
          if (
            heading.parentElement.tagName == "D-TITLE" ||
            heading.getAttribute("no-toc")
          ) {
            continue;
          }

          if (heading.getBoundingClientRect().top - 50 <= 0) {
            // Find matching TOC link by href
            const headingId = heading.getAttribute("id");
            const activeLink = Array.from(toc_links).find(
              (link) => link.getAttribute("href") === "#" + headingId
            );

            if (activeLink && !activeLink.classList.contains("active")) {
              toc_links.forEach((link) => link.classList.remove("active"));
              activeLink.classList.add("active");
            }
            break find_active;
          }
        }
        toc_links.forEach((link) => link.classList.remove("active"));
      }
    }
  });
}
