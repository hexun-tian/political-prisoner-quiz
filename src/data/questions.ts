/**
 * @file src/data/questions.ts
 * @description 五題單選情境問答題庫與固定配對規則（精簡調查筆錄版）。
 *
 * 【配對規則說明（方便後續維護與擴充）】
 * 1. 本版共有 5 題情境題，每題固定設有 A、B、C、D、E 五個選項。
 * 2. 每一題的五個選項皆採「一對一固定配對」：
 *    - `study_group`（讀書會參與者）
 *    - `speech_investigation`（言論遭調查者）
 *    - `implicated_associate`（人際關係受牽連者）
 *    - `print_dissemination`（文字傳播遭調查者）
 *    - `acquitted`（選擇拒絕涉入，最後獲判無罪）
 * 3. `detail` 欄位為選填，可依教學需要自行補充或維持精簡單句呈現。
 */

import type { QuestionItem, QuestionOption } from '../types/game';

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 依單次測驗產生選項順序隨機打亂之題組（保留每題原本固定身分對應） */
export function createShuffledQuestions(
  baseQuestions: readonly QuestionItem[] = QUIZ_QUESTIONS
): QuestionItem[] {
  return baseQuestions.map((q) => ({
    ...q,
    options: shuffleArray<QuestionOption>(q.options),
  }));
}

export const QUIZ_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    stepNumber: 1,
    title: '借一本沒署名的書',
    eraContext: '校園生活',
    locationContext: '宿舍走廊',
    scenario:
      '朋友拿來一本沒印出版社的書，約週末一起討論，還想先寄放在你這。',
    prompt: '你會怎麼做？',
    options: [
      {
        id: 'A',
        label: '去參加週末讀書會，一起討論書裡內容。',
        targetIdentity: 'study_group',
      },
      {
        id: 'B',
        label: '只翻看幾頁，隔天在課堂直接引用來發言。',
        targetIdentity: 'speech_investigation',
      },
      {
        id: 'C',
        label: '不去也不看，只幫朋友把書收進置物櫃。',
        targetIdentity: 'implicated_associate',
      },
      {
        id: 'D',
        label: '借來抄下幾頁重點，寄信給外地朋友看。',
        targetIdentity: 'print_dissemination',
      },
      {
        id: 'E',
        label: '當面拒絕借閱和寄放，只看學校發的書。',
        targetIdentity: 'acquitted',
      },
    ],
  },
  {
    id: 'q2',
    stepNumber: 2,
    title: '茶水間抱怨物價',
    eraContext: '職場日常',
    locationContext: '辦公室茶水間',
    scenario:
      '午休時同事低聲抱怨生活很苦、報紙卻只寫好話，說完大家突然看向你。',
    prompt: '你會怎麼回應？',
    options: [
      {
        id: 'A',
        label: '直接接話贊同，抱怨現在管得太嚴了。',
        targetIdentity: 'speech_investigation',
      },
      {
        id: 'B',
        label: '先不說話，下班後私約他找書一起討論。',
        targetIdentity: 'study_group',
      },
      {
        id: 'C',
        label: '當時不表態，私下借他看朋友寫的文章。',
        targetIdentity: 'print_dissemination',
      },
      {
        id: 'D',
        label: '提醒他小心說話，之後還是照常一起吃飯。',
        targetIdentity: 'implicated_associate',
      },
      {
        id: 'E',
        label: '假裝沒聽到，端著茶杯安靜離開茶水間。',
        targetIdentity: 'acquitted',
      },
    ],
  },
  {
    id: 'q3',
    stepNumber: 3,
    title: '半夜來敲門的朋友',
    eraContext: '人際往來',
    locationContext: '市區住處',
    scenario:
      '半夜十一點，老同學帶著筆記和剪報敲門，說老家有人被約談，想借住兩晚。',
    prompt: '你會怎麼處理？',
    options: [
      {
        id: 'A',
        label: '先留他住兩晚，隔天幫他買車票離開。',
        targetIdentity: 'implicated_associate',
      },
      {
        id: 'B',
        label: '連夜幫他把怕被搜走的筆記重抄一份留存。',
        targetIdentity: 'print_dissemination',
      },
      {
        id: 'C',
        label: '留他坐下來泡茶，徹夜討論他帶來的文章。',
        targetIdentity: 'study_group',
      },
      {
        id: 'D',
        label: '沒留他住，但隔天在公司罵不該亂約談人。',
        targetIdentity: 'speech_investigation',
      },
      {
        id: 'E',
        label: '怕惹上麻煩，隔著門婉拒他來借住。',
        targetIdentity: 'acquitted',
      },
    ],
  },
  {
    id: 'q4',
    stepNumber: 4,
    title: '海外寄來的剪報',
    eraContext: '資訊傳遞',
    locationContext: '家門信箱',
    scenario:
      '你收到海外親戚寄來的信，裡面夾著兩張台灣報紙沒報過的評論剪報。',
    prompt: '你會怎麼做？',
    options: [
      {
        id: 'A',
        label: '把剪報內容抄幾份，拿去分送給朋友傳閱。',
        targetIdentity: 'print_dissemination',
      },
      {
        id: 'B',
        label: '收進書包裡，帶去讀書聚會當討論材料。',
        targetIdentity: 'study_group',
      },
      {
        id: 'C',
        label: '剪報留在家裡，吃飯時直接照內容談時局。',
        targetIdentity: 'speech_investigation',
      },
      {
        id: 'D',
        label: '把剪報收進抽屜不說，之後照常跟親戚通信。',
        targetIdentity: 'implicated_associate',
      },
      {
        id: 'E',
        label: '當場燒掉或丟掉，並寫信叫親戚別再寄來。',
        targetIdentity: 'acquitted',
      },
    ],
  },
  {
    id: 'q5',
    stepNumber: 5,
    title: '單位發下調查表',
    eraContext: '日常盤查',
    locationContext: '單位辦公室',
    scenario:
      '單位發下調查表，要求寫出「最近看的書、常聯絡的親友，以及對政令的感想」。',
    prompt: '你會怎麼填？',
    options: [
      {
        id: 'A',
        label: '在感想欄直接寫出對言論管制的不滿。',
        targetIdentity: 'speech_investigation',
      },
      {
        id: 'B',
        label: '表格只填一般書名，私下通知書友小心。',
        targetIdentity: 'study_group',
      },
      {
        id: 'C',
        label: '表格從簡填寫，回家把剪報和抄本藏好。',
        targetIdentity: 'print_dissemination',
      },
      {
        id: 'D',
        label: '怕連累朋友，交表前先打電話跟熟人串好說法。',
        targetIdentity: 'implicated_associate',
      },
      {
        id: 'E',
        label: '不留敏感書單與意見，只照規定填普通心得。',
        targetIdentity: 'acquitted',
      },
    ],
  },
];
