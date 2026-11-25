/**
 * @file src/utils/scoring.ts
 * @description 瀏覽器本機問答計分與模擬政治案件身分計算邏輯。
 *
 * 【固定配對與平手判定規則】
 * 1. 累計積分：依使用者在 5 題情境題中的選擇，分別統計四種身分的出現次數。
 * 2. 最高分勝出：次數最高之身分即為最終配對結果。
 * 3. 固定平手判定規則（Deterministic Tie-Breaker）：
 *    當最高分出現同分（例如 2-2-1-0）時，為確保結果完全可重現且具時間脈絡意義，
 *    系統採用「最後關鍵抉擇優先」原則：由第 5 題往第 1 題回溯，
 *    最晚被選到的同分身分即勝出（反映當事人在最後緊要關頭的處境傾向）。
 */

import { IDENTITY_ORDER } from '../data/identities';
import type { AnswerRecord, IdentityId, ScoringResult } from '../types/game';

export function calculateSimulationResult(answers: AnswerRecord[]): ScoringResult {
  const scores: Record<IdentityId, number> = {
    study_group: 0,
    speech_investigation: 0,
    implicated_associate: 0,
    print_dissemination: 0,
    acquitted: 0,
  };

  // 統計五種審查結果的選擇次數
  for (const answer of answers) {
    scores[answer.targetIdentity] += 1;
  }

  // 找出最高分
  const maxScore = Math.max(...Object.values(scores));
  const topCandidates = IDENTITY_ORDER.filter((id) => scores[id] === maxScore);

  let primaryIdentity = topCandidates[0];
  let tieBroken = false;

  // 若最高分有複數身分同分，依「最後一題往回推算，最晚選到的同分身分優先」之固定規則決定
  if (topCandidates.length > 1) {
    tieBroken = true;
    for (let i = answers.length - 1; i >= 0; i -= 1) {
      const candidate = answers[i].targetIdentity;
      if (topCandidates.includes(candidate)) {
        primaryIdentity = candidate;
        break;
      }
    }
  }

  // 依分數由高到低排序（同分時將最終配對身分置頂，其餘依固定順序排列）
  const breakdown = [...IDENTITY_ORDER]
    .sort((a, b) => {
      if (scores[b] !== scores[a]) {
        return scores[b] - scores[a];
      }
      if (a === primaryIdentity) return -1;
      if (b === primaryIdentity) return 1;
      return IDENTITY_ORDER.indexOf(a) - IDENTITY_ORDER.indexOf(b);
    })
    .map((identityId) => ({
      identityId,
      count: scores[identityId],
    }));

  return {
    primaryIdentity,
    scores,
    tieBroken,
    breakdown,
  };
}
