/**
 * @file src/utils/caseNumber.ts
 * @description 產生每次測驗不重複的模擬案件檔案編號（格式：PF-1970-XXXX）。
 */

const usedCaseNumbers = new Set<string>();

/**
 * 產生不重複的隨機案件編號（例如 PF-1970-4829）
 */
export function generateUniqueCaseNumber(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `PF-1970-${num}`;
    if (!usedCaseNumbers.has(candidate)) {
      usedCaseNumbers.add(candidate);
      return candidate;
    }
  }
  const fallback = `PF-1970-${String(Date.now()).slice(-4)}`;
  usedCaseNumbers.add(fallback);
  return fallback;
}
