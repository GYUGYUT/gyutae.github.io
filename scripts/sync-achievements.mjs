import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dataPath = path.join(root, "data", "achievements.json");
const indexPath = path.join(root, "index.html");
const cvHtmlPath = path.join(root, "assets", "cv.html");
const cvPdfPath = path.join(root, "assets", "cv.pdf");

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

function replaceBetween(source, key, replacement) {
  const start = `<!-- ${key}:start -->`;
  const end = `<!-- ${key}:end -->`;
  const pattern = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  return source.replace(pattern, `${start}\n${replacement}\n${end}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderLinks(links, className = "pill") {
  if (!links?.length) return "";
  return links
    .map(
      ({ label, url }) =>
        `                    <a class="${className}" href="${url}" target="_blank" rel="noreferrer">${label}</a>`
    )
    .join("\n");
}

function publicationMeta(item) {
  const venueAndDate = item.date
    ? `${item.venue}, ${item.date}`
    : item.year
      ? `${item.venue}, ${item.year}`
      : item.venue;
  return item.distinction ? `${venueAndDate} · ${item.distinction}` : venueAndDate;
}

function underReviewVenueLabel(item) {
  return item.venue.replace(/\s*\(under review\)\s*$/i, "");
}

function renderPublicationItem(item, indent = "                ") {
  const links = item.links?.length
    ? `\n${indent}<div class="pub-links">\n${renderLinks(item.links)}\n${indent}</div>`
    : "";
  const distinction = item.distinction
    ? `\n${indent}  <span class="pub-distinction">${item.distinction}</span>`
    : "";

  return `${indent}<li${item.distinction ? ' class="is-oral"' : ""}>
${indent}  <div class="pub-title">
${indent}    ${item.title}
${indent}  </div>
${indent}  <div class="pub-authors">${item.authorsHtml}</div>
${indent}  <div class="pub-venue">${publicationMeta({ ...item, distinction: null })}</div>${distinction}${links}
${indent}</li>`;
}

function renderSimpleItem(item, indent = "                ") {
  const extra = item.extraHtml ? `\n${indent}  <div class="pub-venue">${item.extraHtml}</div>` : "";
  return `${indent}<li>
${indent}  <div class="pub-title">${item.title}</div>
${indent}  <div class="pub-venue">${item.venue}</div>${extra}
${indent}</li>`;
}

function renderPatentItem(item, indent = "              ") {
  const paragraphs = item.summaryHtml
    .map((line) => `${indent}  <div class="pub-venue">\n${indent}    ${line}\n${indent}  </div>`)
    .join("\n");
  return `${indent}<li>
${indent}  <div class="pub-title">
${indent}    ${item.title}
${indent}  </div>
${indent}  <div class="pub-authors">
${indent}    ${item.metaHtml}
${indent}  </div>
${paragraphs}
${indent}</li>`;
}

function renderIndexAchievements() {
  const preprints = data.publications.filter((item) => item.type === "preprint");
  const publications = data.publications.filter((item) => item.type === "publication");
  const selected = publications.filter((item) => item.selectedForCv);
  const archive = publications.filter((item) => !item.selectedForCv);

  return `
          <div class="card publication-featured">
            <div class="feature-head">
              <div><h3>Selected publications</h3><p>${selected.length} highlights · Scroll to explore</p></div>
              <div class="carousel-actions">
                <button class="carousel-button" type="button" data-carousel-direction="-1" aria-controls="featuredPubs" aria-label="Previous publication">←</button>
                <button class="carousel-button" type="button" data-carousel-direction="1" aria-controls="featuredPubs" aria-label="Next publication">→</button>
              </div>
            </div>
            <ol id="featuredPubs" class="pubs featured-pubs">
${selected.map((item) => renderPublicationItem(item)).join("\n")}
            </ol>
          </div>

          <details class="expander publication-expander">
            <summary><span>Browse the full list</span><span class="expander-count">${archive.length + preprints.length} more records</span></summary>
          <div class="grid two">
            <div class="card">
              <h3>Other publications</h3>
              <ol class="pubs">
${archive.map((item) => renderPublicationItem(item)).join("\n")}
              </ol>
            </div>

            <div class="card">
              <h3>Anonymous submissions</h3>
              <ol class="pubs">
${preprints.map((item) => renderPublicationItem(item)).join("\n")}
              </ol>
            </div>
          </div>
          </details>`;
}

function renderIndexHonors() {
  return `
          <div class="honor-overview">
            <div class="honor-stat"><strong>${totalScholarships()}</strong><span>Scholarships</span></div>
            <div class="honor-stat"><strong>${data.awards.length}</strong><span>Awards</span></div>
            <div class="honor-stat"><strong>${data.certifications.length}</strong><span>Certification</span></div>
            <div class="honor-stat"><strong>${data.services.length}</strong><span>Service</span></div>
          </div>
          <details class="expander honors-expander">
            <summary><span>Explore honors and credentials</span><span class="expander-count">Full record</span></summary>
          <div class="grid two">
            <div class="card">
              <h3>Scholarships</h3>
              <ol class="pubs">
${data.scholarships.map((item) => renderSimpleItem(item)).join("\n")}
              </ol>
            </div>

            <div class="card">
              <h3>Awards</h3>
              <ol class="pubs">
${data.awards.map((item) => renderSimpleItem(item)).join("\n")}
              </ol>
            </div>
          </div>

          <div class="grid two grid-spaced">
            <div class="card">
              <h3>Certifications</h3>
              <ol class="pubs">
${data.certifications.map((item) => renderSimpleItem(item)).join("\n")}
              </ol>
            </div>
            <div class="card">
              <h3>Professional Service</h3>
              <ol class="pubs">
${data.services.map((item) => renderSimpleItem(item)).join("\n")}
              </ol>
            </div>
          </div>
          </details>`;
}

function renderIndexPatents() {
  return `
          <div class="card">
            <ol class="pubs">
${data.patents.map((item) => renderPatentItem(item)).join("\n")}
            </ol>
          </div>`;
}

function totalScholarships() {
  return data.scholarships.reduce((sum, item) => sum + (item.count || 1), 0);
}

function renderCvOutputsSummary() {
  const publicationCount = data.publications.length;
  const preprintCount = data.publications.filter((item) => item.type === "preprint").length;
  const scholarshipCount = totalScholarships();
  return `
          <section>
            <h2>Research Outputs</h2>
            <div class="rule"></div>
            <div class="item">
              <div class="title">${publicationCount} total papers</div>
              <div class="small">${preprintCount} preprints · ${publicationCount - preprintCount} peer-reviewed publications</div>
            </div>
            <div class="item">
              <div class="title">${data.patents.length} patent</div>
              <div class="small">${scholarshipCount} scholarships · ${data.awards.length} awards · ${data.certifications.length} certification · ${data.services.length} service</div>
            </div>
          </section>`;
}

function renderCvSelectedPublications() {
  const selected = data.publications.filter((item) => item.selectedForCv);
  return selected
    .map((item) => {
      const links = item.links?.length
        ? `\n                <div class="links">\n${item.links
            .map((link) => `                  <a href="${link.url}">${link.label}</a>`)
            .join("\n")}\n                </div>`
        : "";
      const itemClass = item.distinction ? "item oral-highlight" : "item";
      return `              <div class="${itemClass}">
                <div class="pub-title">
                  ${item.title}
                </div>
                <div class="pub-authors">${item.authorsHtml}</div>
                <div class="pub-venue">${publicationMeta(item)}</div>${links}
              </div>`;
    })
    .join("\n");
}

function renderCvUnderReview() {
  const items = data.publications.filter((item) => item.underReview);
  const grouped = new Map();

  for (const item of items) {
    const label = `${underReviewVenueLabel(item)} ${item.year}`;
    grouped.set(label, (grouped.get(label) || 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([label, count]) => {
      const submissionLabel = count === 1 ? "1 anonymous submission under review" : `${count} anonymous submissions under review`;
      return `            <div class="item">
              <div class="title">${label}</div>
              <div class="small">${submissionLabel}</div>
            </div>`;
    })
    .join("\n");
}

function renderCvList(items) {
  return items
    .filter((item) => item.selectedForCv)
    .map((item) => {
      const extra = item.extraHtml ? `\n              <div class="small">${item.extraHtml}</div>` : "";
      return `            <div class="item">
              <div class="title">${item.title}</div>
              <div class="small">${item.venue}</div>${extra}
            </div>`;
    })
    .join("\n");
}

function renderCvPatent() {
  return data.patents
    .filter((item) => item.selectedForCv)
    .map(
      (item) => `            <div class="item">
              <div class="title">${item.title.replace(" (Application)", "")}</div>
              <div class="small">${item.metaHtml.replace(/<[^>]+>/g, "")}</div>
              <div class="desc">${item.summaryHtml[0].replace(/<[^>]+>/g, "")}</div>
            </div>`
    )
    .join("\n");
}

let indexHtml = fs.readFileSync(indexPath, "utf8");
indexHtml = replaceBetween(indexHtml, "generated-publications", renderIndexAchievements());
indexHtml = replaceBetween(indexHtml, "generated-honors", renderIndexHonors());
indexHtml = replaceBetween(indexHtml, "generated-patents", renderIndexPatents());
fs.writeFileSync(indexPath, indexHtml);

let cvHtml = fs.readFileSync(cvHtmlPath, "utf8");
cvHtml = replaceBetween(cvHtml, "generated-cv-output-summary", renderCvOutputsSummary());
cvHtml = replaceBetween(cvHtml, "generated-cv-selected-publications", renderCvSelectedPublications());
cvHtml = replaceBetween(cvHtml, "generated-cv-under-review", renderCvUnderReview());
cvHtml = replaceBetween(cvHtml, "generated-cv-awards", renderCvList(data.awards));
cvHtml = replaceBetween(cvHtml, "generated-cv-scholarships", renderCvList(data.scholarships));
cvHtml = replaceBetween(cvHtml, "generated-cv-patent", renderCvPatent());
cvHtml = replaceBetween(cvHtml, "generated-cv-certifications", renderCvList(data.certifications));
cvHtml = replaceBetween(cvHtml, "generated-cv-services", renderCvList(data.services));
fs.writeFileSync(cvHtmlPath, cvHtml);

try {
  execFileSync("weasyprint", [cvHtmlPath, cvPdfPath], { stdio: "pipe" });
} catch (error) {
  const message = error.stderr?.toString() || error.message;
  console.warn(`PDF generation skipped: ${message}`);
}

console.log("Synced achievements across portfolio, CV HTML, and CV PDF.");
