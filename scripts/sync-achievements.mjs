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
  if (item.date) return `${item.venue}, ${item.date}`;
  if (item.year) return `${item.venue}, ${item.year}`;
  return item.venue;
}

function renderPublicationItem(item, indent = "                ") {
  const links = item.links?.length
    ? `\n${indent}<div class="pub-links">\n${renderLinks(item.links)}\n${indent}</div>`
    : "";

  return `${indent}<li>
${indent}  <div class="pub-title">
${indent}    ${item.title}
${indent}  </div>
${indent}  <div class="pub-authors">${item.authorsHtml}</div>
${indent}  <div class="pub-venue">${publicationMeta(item)}</div>${links}
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

  return `
          <div class="grid two">
            <div class="card">
              <h3>Preprints</h3>
              <ol class="pubs">
${preprints.map((item) => renderPublicationItem(item)).join("\n")}
              </ol>
            </div>

            <div class="card">
              <h3>Publications</h3>
              <ol class="pubs">
${publications.map((item) => renderPublicationItem(item)).join("\n")}
              </ol>
            </div>
          </div>`;
}

function renderIndexHonors() {
  return `
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

          <div class="grid two" style="margin-top: 12px">
            <div class="card">
              <h3>Certifications</h3>
              <ol class="pubs">
${data.certifications.map((item) => renderSimpleItem(item)).join("\n")}
              </ol>
            </div>
            <div></div>
          </div>`;
}

function renderIndexPatents() {
  return `
          <div class="card">
            <ol class="pubs">
${data.patents.map((item) => renderPatentItem(item)).join("\n")}
            </ol>
          </div>`;
}

function renderCvOutputsSummary() {
  const publicationCount = data.publications.length;
  const preprintCount = data.publications.filter((item) => item.type === "preprint").length;
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
              <div class="small">${data.scholarships.length} scholarships · ${data.awards.length} awards · ${data.certifications.length} certification</div>
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
      return `              <div class="item">
                <div class="pub-title">
                  ${item.title}
                </div>
                <div class="pub-authors">${item.authorsHtml}</div>
                <div class="pub-venue">${publicationMeta(item)}</div>${links}
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

function atAGlanceText() {
  const totalPapers = data.publications.length;
  const preprints = data.publications.filter((item) => item.type === "preprint").length;
  const patents = data.patents.length;
  const scholarships = data.scholarships.length;
  const awards = data.awards.length;
  const certifications = data.certifications.length;
  return `${totalPapers} papers (${preprints} preprints), ${patents} patent, ${scholarships} scholarships, ${awards} awards, ${certifications} certification`;
}

let indexHtml = fs.readFileSync(indexPath, "utf8");
indexHtml = indexHtml.replace(
  /<div class="meta-label">At a glance<\/div>\s*<div class="meta-value">[\s\S]*?<\/div>/,
  `<div class="meta-label">At a glance</div>\n                <div class="meta-value">${atAGlanceText()}</div>`
);
indexHtml = replaceBetween(indexHtml, "generated-publications", renderIndexAchievements());
indexHtml = replaceBetween(indexHtml, "generated-honors", renderIndexHonors());
indexHtml = replaceBetween(indexHtml, "generated-patents", renderIndexPatents());
fs.writeFileSync(indexPath, indexHtml);

let cvHtml = fs.readFileSync(cvHtmlPath, "utf8");
cvHtml = replaceBetween(cvHtml, "generated-cv-output-summary", renderCvOutputsSummary());
cvHtml = replaceBetween(cvHtml, "generated-cv-selected-publications", renderCvSelectedPublications());
cvHtml = replaceBetween(cvHtml, "generated-cv-awards", renderCvList(data.awards));
cvHtml = replaceBetween(cvHtml, "generated-cv-scholarships", renderCvList(data.scholarships));
cvHtml = replaceBetween(cvHtml, "generated-cv-patent", renderCvPatent());
cvHtml = replaceBetween(cvHtml, "generated-cv-certifications", renderCvList(data.certifications));
fs.writeFileSync(cvHtmlPath, cvHtml);

try {
  execFileSync("weasyprint", [cvHtmlPath, cvPdfPath], { stdio: "pipe" });
} catch (error) {
  const message = error.stderr?.toString() || error.message;
  console.warn(`PDF generation skipped: ${message}`);
}

console.log("Synced achievements across portfolio, CV HTML, and CV PDF.");
