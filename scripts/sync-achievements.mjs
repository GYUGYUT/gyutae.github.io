import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dataPath = path.join(root, "data", "achievements.json");
const indexPath = path.join(root, "index.html");
const cvHtmlPath = path.join(root, "assets", "cv.html");
const cvPdfPath = path.join(root, "assets", "cv.pdf");

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

/* ------------------------------------------------------------------ helpers */

function replaceBetween(source, key, replacement) {
  const start = `<!-- ${key}:start -->`;
  const end = `<!-- ${key}:end -->`;
  const pattern = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  if (!pattern.test(source)) throw new Error(`Marker "${key}" not found`);
  return source.replace(pattern, () => `${start}\n${replacement}\n${end}`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function indentBlock(lines, indent) {
  return lines
    .filter((line) => line !== null && line !== undefined && line !== "")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

const publications = data.publications.filter((item) => item.type === "publication");
const underReview = data.publications.filter((item) => item.underReview);
const isAnonymous = (item) => /^anonymous submission$/i.test(item.title);
const firstAuthorCount = publications.filter((item) => /<sup>\*<\/sup>/.test(item.authorsHtml)).length;

function totalScholarships() {
  return data.scholarships.reduce((sum, item) => sum + (item.count || 1), 0);
}

function venueLabel(item) {
  return item.venueShort || item.venue.replace(/\s*\(under review\)\s*$/i, "");
}

function venueLong(item) {
  return item.venue.replace(/\s*\(under review\)\s*$/i, "");
}

const ROLE_LABELS = { first: "first author", "co-first": "co-first author", co: "co-author" };

function roleLabel(item) {
  return ROLE_LABELS[item.role || "first"];
}

/** Groups double-blind submissions by venue + authorship role, e.g. ["CVPR 2027", "co-author", 3]. */
function groupAnonymous() {
  const grouped = new Map();
  for (const item of underReview.filter(isAnonymous)) {
    const key = `${venueLabel(item)} ${item.year}|${roleLabel(item)}`;
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }
  return Array.from(grouped.entries()).map(([key, count]) => [...key.split("|"), count]);
}

const underReviewFirstCount = underReview.filter((item) => (item.role || "first") !== "co").length;

/** Splits "Award name (2023.11)" or "Scholarship (awarded 5 times, 2019–2023)" into title + date. */
function splitTrailingDate(item) {
  if (item.date) return { title: item.title, date: item.date };
  const match = item.title.match(/^(.*?)\s*\((?:(.*?),\s*)?((?:19|20)\d{2}(?:[.\-–]\d{1,4})?)\)\s*$/);
  if (match) {
    const [, title, note, date] = match;
    return { title: note ? `${title} (${note})` : title, date };
  }
  const venueYear = item.venue?.match(/((?:19|20)\d{2})\s*$/);
  return { title: item.title, date: venueYear ? venueYear[1] : "" };
}

function patentDate(item) {
  const match = item.metaHtml.match(/([A-Z][a-z]{2})\s+\d{1,2},\s+((?:19|20)\d{2})/);
  return match ? `${match[2]}` : "";
}

/* -------------------------------------------------------------- index.html */

function renderPublicationItem(item, indent) {
  const venue = venueLong(item);
  const venueText = [venue !== item.venueShort ? venue : "", item.date].filter(Boolean).join(", ");
  const meta = [
    item.venueShort ? `<span class="venue-tag">${item.venueShort}</span>` : "",
    venueText ? `<span class="pub-venue">${venueText}</span>` : "",
    item.distinction ? `<span class="pub-distinction">${item.distinction}</span>` : "",
    item.note ? `<span class="pub-note">${item.note}</span>` : "",
    ...(item.links || []).map(
      ({ label, url }) => `<a class="arrow-link" href="${url}" target="_blank" rel="noreferrer">${label}</a>`
    ),
  ];
  return indentBlock(
    [
      `<li class="pub${item.distinction ? " is-oral" : ""}">`,
      `  <span class="pub-year">${item.year}</span>`,
      `  <div>`,
      `    <div class="pub-title">${item.title}</div>`,
      `    <div class="pub-authors">${item.authorsHtml}</div>`,
      `    <div class="pub-meta">`,
      ...meta.filter(Boolean).map((line) => `      ${line}`),
      `    </div>`,
      `  </div>`,
      `</li>`,
    ],
    indent
  );
}

/** Publication groups, in display order. `category` comes from data/achievements.json. */
const PUB_GROUPS = [
  { title: "International conferences & journals", short: "international", categories: ["conference", "journal"] },
  { title: "Workshops", short: "workshop", categories: ["workshop"] },
  { title: "Domestic conferences", short: "domestic", categories: ["domestic"] },
];

function groupedPublications() {
  return PUB_GROUPS.map((group) => ({
    ...group,
    items: publications.filter((item) => group.categories.includes(item.category)),
  })).filter((group) => group.items.length);
}

function publicationSummary() {
  return groupedPublications()
    .map(({ short, items }) => `${items.length} ${short}`)
    .join(" · ")
    .concat(" papers");
}

function renderIndexAchievements() {
  const titledReview = underReview.filter((item) => !isAnonymous(item));
  const anonymous = groupAnonymous();
  const i = "            ";

  const reviewList = titledReview.length
    ? `
${i}<h3 class="block-title">Under review</h3>
${i}<ol class="pub-list">
${titledReview.map((item) => renderPublicationItem(item, `${i}  `)).join("\n")}
${i}</ol>`
    : "";
  const anonymousStrip = anonymous.length
    ? `
${i}<div class="under-review">
${i}  <span class="under-review-label">Double-blind</span>
${i}  <ul>
${anonymous.map(([label, role, count]) => `${i}    <li>${label}${count > 1 ? ` ×${count}` : ""} <span>· ${role}</span></li>`).join("\n")}
${i}  </ul>
${i}</div>`
    : "";

  const groups = groupedPublications().map(
    ({ title, items }) => `${i}<div class="block">
${i}<h3 class="block-title">${title} <span class="more-count">${items.length}</span></h3>
${i}<ol class="pub-list">
${items.map((item) => renderPublicationItem(item, `${i}  `)).join("\n")}
${i}</ol>
${i}</div>`
  );

  return `${i}<p class="section-note">${publicationSummary()} · <sup>*</sup> first / co-first author</p>
${groups.join("\n")}
${i}<div class="block">${reviewList}${anonymousStrip}
${i}</div>`;
}

function renderEntry(item, indent) {
  const { title, date } = splitTrailingDate(item);
  return indentBlock(
    [
      `<li class="entry">`,
      `  <span class="entry-date">${date}</span>`,
      `  <div>`,
      `    <div class="entry-title">${title}</div>`,
      `    <div class="entry-sub">${item.venue}</div>`,
      item.extraHtml ? `    <div class="entry-sub">${item.extraHtml}</div>` : "",
      `  </div>`,
      `</li>`,
    ],
    indent
  );
}

function renderHonorBlock(title, items, i) {
  return `${i}<div class="block">
${i}<h3 class="block-title">${title}</h3>
${i}<ol class="entries">
${items.map((item) => renderEntry(item, `${i}  `)).join("\n")}
${i}</ol>
${i}</div>`;
}

function renderIndexHonors() {
  const i = "            ";
  return [
    `${i}<p class="section-note">${plural(data.awards.length, "award")} · ${plural(totalScholarships(), "scholarship")} · ${plural(data.certifications.length, "certification")} · ${plural(data.services.length, "service role")}</p>`,
    renderHonorBlock("Awards", data.awards, i),
    renderHonorBlock("Scholarships", data.scholarships, i),
    renderHonorBlock("Professional service", data.services, i),
    renderHonorBlock("Certifications", data.certifications, i),
  ].join("\n");
}

function renderPatentItem(item, indent) {
  const title = item.title.replace(/\s*\(Application\)\s*$/, "");
  const pending = /\(Application\)\s*$/.test(item.title);
  return indentBlock(
    [
      `<li class="entry">`,
      `  <span class="entry-date">${patentDate(item)}</span>`,
      `  <div>`,
      `    <div class="entry-title">${title}</div>`,
      `    <div class="entry-sub">${item.metaHtml}</div>`,
      ...item.summaryHtml.map((line) => `    <p class="entry-text">${line}</p>`),
      pending ? `    <div class="project-foot"><span class="badge">Application filed</span></div>` : "",
      `  </div>`,
      `</li>`,
    ],
    indent
  );
}

function renderIndexPatents() {
  const i = "            ";
  return `${i}<ol class="entries">
${data.patents.map((item) => renderPatentItem(item, `${i}  `)).join("\n")}
${i}</ol>`;
}

/* ----------------------------------------------------------------- cv.html */

function renderCvPublication(item, indent) {
  const venue = [venueLong(item), item.date || item.year].filter(Boolean).join(", ");
  const extras = [
    item.distinction ? `<span class="tag">${item.distinction}</span>` : "",
    item.note ? `<span class="note">${item.note}</span>` : "",
    ...(item.links || []).map(({ label, url }) => `<a href="${url}">${label}</a>`),
  ].filter(Boolean);
  return indentBlock(
    [
      `<li>`,
      `  <div class="cv-title">${item.title}</div>`,
      `  <div class="cv-authors">${item.authorsHtml}</div>`,
      `  <div class="cv-venue"><em>${venue}</em>${extras.length ? ` · ${extras.join(" · ")}` : ""}</div>`,
      `</li>`,
    ],
    indent
  );
}

function renderCvPublications() {
  const i = "        ";
  const groups = groupedPublications().map(({ title, items }) => [title, items]);
  const titledReview = underReview.filter((item) => !isAnonymous(item));
  const byVenue = new Map();
  for (const [label, role, count] of groupAnonymous()) {
    byVenue.set(label, [...(byVenue.get(label) || []), `${count} ${role.replace(" author", "-author")}`]);
  }
  const anonymous = Array.from(byVenue.entries())
    .map(([label, parts]) => `${label} (${parts.join(", ")})`)
    .join(" · ");

  const blocks = groups
    .filter(([, items]) => items.length)
    .map(
      ([title, items]) => `${i}<h3>${title}</h3>
${i}<ol class="cv-pubs">
${items.map((item) => renderCvPublication(item, `${i}  `)).join("\n")}
${i}</ol>`
    );

  blocks.push(`${i}<h3>Under review</h3>
${i}<ol class="cv-pubs">
${titledReview.map((item) => renderCvPublication(item, `${i}  `)).join("\n")}${
    anonymous
      ? `
${i}  <li>
${i}    <div class="cv-title">Double-blind submissions: ${anonymous}</div>
${i}    <div class="cv-venue">Domain continual learning and efficient learning — titles withheld during review</div>
${i}  </li>`
      : ""
  }
${i}</ol>`);

  return `${i}<p class="cv-note">${publicationSummary()} · <sup>*</sup> first / co-first author</p>
${blocks.join("\n")}`;
}

function renderCvRows(items, indent) {
  return items
    .filter((item) => item.selectedForCv !== false)
    .map((item) => {
      const { title, date } = splitTrailingDate(item);
      return indentBlock(
        [
          `<div class="cv-row">`,
          `  <div>`,
          `    <div class="cv-title">${title}</div>`,
          `    <div class="cv-sub">${stripTags(item.venue)}</div>`,
          `  </div>`,
          `  <div class="cv-date">${date}</div>`,
          `</div>`,
        ],
        indent
      );
    })
    .join("\n");
}

function renderCvHonors() {
  const i = "        ";
  return [
    `${i}<h3>Awards</h3>`,
    renderCvRows(data.awards, i),
    `${i}<h3>Scholarships</h3>`,
    renderCvRows(data.scholarships, i),
    `${i}<h3>Service &amp; certification</h3>`,
    renderCvRows([...data.services, ...data.certifications], i),
  ].join("\n");
}

function renderCvPatent() {
  const i = "        ";
  return data.patents
    .filter((item) => item.selectedForCv)
    .map((item) =>
      indentBlock(
        [
          `<div class="cv-row">`,
          `  <div>`,
          `    <div class="cv-title">${item.title.replace(/\s*\(Application\)\s*$/, "")}</div>`,
          `    <div class="cv-sub">${item.metaHtml}</div>`,
          `    <div class="cv-text">${item.summaryHtml[1] || item.summaryHtml[0]}</div>`,
          `  </div>`,
          `  <div class="cv-date">${patentDate(item)}</div>`,
          `</div>`,
        ],
        i
      )
    )
    .join("\n");
}

/* ------------------------------------------------------------------- write */

let indexHtml = fs.readFileSync(indexPath, "utf8");
indexHtml = replaceBetween(indexHtml, "generated-publications", renderIndexAchievements());
indexHtml = replaceBetween(indexHtml, "generated-honors", renderIndexHonors());
indexHtml = replaceBetween(indexHtml, "generated-patents", renderIndexPatents());
fs.writeFileSync(indexPath, indexHtml);

let cvHtml = fs.readFileSync(cvHtmlPath, "utf8");
cvHtml = replaceBetween(cvHtml, "generated-cv-publications", renderCvPublications());
cvHtml = replaceBetween(cvHtml, "generated-cv-patent", renderCvPatent());
cvHtml = replaceBetween(cvHtml, "generated-cv-honors", renderCvHonors());
fs.writeFileSync(cvHtmlPath, cvHtml);

try {
  execFileSync("weasyprint", [cvHtmlPath, cvPdfPath], { stdio: "pipe" });
} catch (error) {
  const message = error.stderr?.toString() || error.message;
  console.warn(`PDF generation skipped: ${message}`);
}

console.log("Synced achievements across portfolio, CV HTML, and CV PDF.");
