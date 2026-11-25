/**
 * @file src/data/leeWuChungCase.ts
 * @description 「李武忠案」歷史介紹頁資料檔（言簡意賅、史實完整版）。
 * 依據國家人權博物館、國史館《戰後臺灣政治案件—李武忠案史料彙編》及促進轉型正義委員會公開紀錄整理，
 * 絕不自行編造未經查證之史實。
 */

import type { HistoricalCaseReference } from '../types/game';

export const LEE_WU_CHUNG_CASE_DATA: HistoricalCaseReference = {
  mainHeading: '如果這不只是遊戲呢？',
  subHeading: '從虛構檔案，走入真實歷史',
  caseTitle: '李武忠案',
  introParagraphs: [
    '李武忠（1919－）任教於省立臺北工專期間，因閱讀與談論左翼書籍遭捕判刑，直到半世紀後才正式獲得平反。',
  ],
  timeline: [
    {
      date: '1970年9月8日',
      event: '遭到逮捕',
      detail: '任教臺北工專期間，因閱讀《唯物辯證法》與言論指控遭捕。',
    },
    {
      date: '1971年',
      event: '軍法重判',
      detail: '警總初審判無期徒刑，更審改判12年、減刑為8年。',
    },
    {
      date: '1978年9月7日',
      event: '刑滿獲釋',
      detail: '歷經近八年牢獄後開釋。',
    },
    {
      date: '2001年',
      event: '獲准補償',
      detail: '認定原案屬思想言論層次，證據亦有爭議。',
    },
    {
      date: '2019年5月',
      event: '撤銷原判',
      detail: '促轉會公告撤銷有罪判決，正式回復清白。',
    },
  ],
  sourceNote:
    '史料來源：國家人權博物館、國史館《李武忠案史料彙編》、促進轉型正義委員會。',
};
