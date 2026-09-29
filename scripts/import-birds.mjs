// Local-only import: 국립생물자원관 국가생물종목록 XLSX → data/birds.json
// Run: node scripts/import-birds.mjs
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE_XLSX = path.join(ROOT, "data/source/national_species_list_20241231.xlsx");
const OUTPUT_JSON = path.join(ROOT, "data/birds.json");
const META_JSON = path.join(ROOT, "data/bird-dataset-meta.json");
const SHEET_NAME = "조류";

// 조류 시트 컬럼 위치 (0-indexed). source의 실제 header 2행(상위/하위 라벨)을 확인해 고정한 값.
const COL = {
  ktsn: 0,
  orderKo: 8,
  familyKo: 10,
  subspeciesName: 18,
  varietyName: 21,
  formaName: 24,
  scientificName: 26,
  koreanName: 27,
};

if (!existsSync(SOURCE_XLSX)) {
  console.error(`Source XLSX not found: ${SOURCE_XLSX}`);
  console.error("국립생물자원관 국가생물종목록 XLSX를 위 경로에 두고 다시 실행하세요.");
  process.exit(1);
}

const wb = XLSX.readFile(SOURCE_XLSX);
if (!wb.SheetNames.includes(SHEET_NAME)) {
  console.error(`Sheet "${SHEET_NAME}" not found. Sheets: ${wb.SheetNames.join(", ")}`);
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEET_NAME], { header: 1, defval: "" });
const dataRows = rows.slice(2); // row0/row1 = header labels

const sourceRowCount = dataRows.length;
let speciesRowCount = 0;
let infraRowCount = 0;
let missingKorean = 0;
let missingScientific = 0;

const output = [];
const seenIds = new Set();
const byKoreanName = new Map();
const byScientificName = new Map();
const byBoth = new Map();

for (const row of dataRows) {
  const isInfraSpecific = Boolean(
    row[COL.subspeciesName] || row[COL.varietyName] || row[COL.formaName]
  );
  if (isInfraSpecific) {
    infraRowCount++;
    continue; // species 단위만 채택 (source의 명시적 rank 컬럼 기준)
  }
  speciesRowCount++;

  const ktsn = String(row[COL.ktsn] ?? "").trim();
  const koreanName = String(row[COL.koreanName] ?? "").trim();
  const scientificName = String(row[COL.scientificName] ?? "").trim();
  const orderName = String(row[COL.orderKo] ?? "").trim() || undefined;
  const familyName = String(row[COL.familyKo] ?? "").trim() || undefined;

  if (!koreanName) missingKorean++;
  if (!scientificName) missingScientific++;

  const id = `bird-${ktsn}`;
  if (seenIds.has(id)) {
    console.error(`Duplicate KTSN detected: ${ktsn}`);
    process.exit(1);
  }
  seenIds.add(id);

  byKoreanName.set(koreanName, (byKoreanName.get(koreanName) ?? 0) + 1);
  byScientificName.set(scientificName, (byScientificName.get(scientificName) ?? 0) + 1);
  byBoth.set(`${koreanName}|${scientificName}`, (byBoth.get(`${koreanName}|${scientificName}`) ?? 0) + 1);

  output.push({ id, koreanName, scientificName, orderName, familyName });
}

// deterministic sort: scientificName + koreanName (표시/재현성 목적, id는 KTSN 기반으로 이미 안정적)
output.sort((a, b) =>
  a.scientificName.localeCompare(b.scientificName) ||
  a.koreanName.localeCompare(b.koreanName, "ko")
);

const dupKorean = [...byKoreanName.entries()].filter(([, n]) => n > 1);
const dupScientific = [...byScientificName.entries()].filter(([, n]) => n > 1);
const dupBoth = [...byBoth.entries()].filter(([, n]) => n > 1);

writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2) + "\n");

const meta = {
  sourceName: "기후에너지환경부 국립생물자원관_국가생물종목록_20241231 (2025년 국가생물종목록_v1.0.xlsx)",
  sourceOrganization: "국립생물자원관",
  sourceDate: "2024-12-31",
  sourceUrl: "https://www.data.go.kr/data/15048041/fileData.do",
  importedAt: new Date().toISOString(),
  speciesCount: output.length,
  license: "공공저작물 제3유형 (출처표시, 변경금지)",
};
writeFileSync(META_JSON, JSON.stringify(meta, null, 2) + "\n");

console.log("Bird import complete");
console.log("");
console.log(`Source rows: ${sourceRowCount}`);
console.log(`Species rows: ${speciesRowCount}`);
console.log(`Infraspecific rows (excluded): ${infraRowCount}`);
console.log(`Output rows: ${output.length}`);
console.log("");
console.log(`Missing Korean name: ${missingKorean}`);
console.log(`Missing scientific name: ${missingScientific}`);
console.log("");
console.log(`Duplicate Korean names: ${dupKorean.length}${dupKorean.length ? ` (sample: ${dupKorean.slice(0, 3).map(([n]) => n).join(", ")})` : ""}`);
console.log(`Duplicate scientific names: ${dupScientific.length}${dupScientific.length ? ` (sample: ${dupScientific.slice(0, 3).map(([n]) => n).join(", ")})` : ""}`);
console.log(`Duplicate koreanName+scientificName: ${dupBoth.length}`);
console.log("");
console.log(`Output: ${path.relative(ROOT, OUTPUT_JSON)}`);
console.log(`Metadata: ${path.relative(ROOT, META_JSON)}`);
