/**
 * @file src/data/identities.ts
 * @description 四種模擬政治案件身分檔案定義。
 *
 * 【可自行更改內容說明】
 * 結果頁「個人調查檔案」調查單所顯示的欄位皆可在此直接修改替換：
 * - `caseNumber`：檔案編號（例如：PF-1970-001）
 * - `title`：政治犯身分（模擬身分名稱）
 * - `fileStatus`：案件狀態（例如：遭列入調查）
 * - `investigationReason`：涉嫌事由
 * - `investigationRecord`：調查紀錄
 * - `reflectionPrompt`：人權反思
 *
 * 注意：此為教育性模擬分類，並非真實個人檔案或單一歷史判決。
 */

import type { IdentityId, IdentityProfile } from '../types/game';

/** 固定排序清單，用於畫面索引與平手時之預設顯示順序 */
export const IDENTITY_ORDER: IdentityId[] = [
  'study_group',
  'speech_investigation',
  'implicated_associate',
  'print_dissemination',
  'acquitted',
];

export const IDENTITY_PROFILES: Record<IdentityId, IdentityProfile> = {
  study_group: {
    id: 'study_group',
    caseNumber: 'PF-1970-001',
    archiveCode: 'EDU-SIM-01',
    title: '讀書會參與者',
    fileStatus: '遭列入調查',
    subtitle: '思想結社與私下共讀脈絡',
    stampText: '模擬立案',
    investigationReason:
      '因參與私下讀書聚會，並與他人討論社會思想書籍，而遭當局懷疑具有政治思想問題。',
    investigationRecord:
      '日常共讀與筆記交流行為受到關注，聚會往來名單與討論內容可能被作為調查依據。',
    summary:
      '在您的五項情境抉擇中，多數傾向於「共同閱讀、知識交流與討論思想議題」。在戒嚴時期的社會控管下，即使未曾採取實際政治行動，私下聚集閱讀哲學、歷史、社會科學或禁書清單上的著作，仍常被情治機關視為潛在「非法組織」的開端。',
    investigationTrigger:
      '校園或職場同儕間自發組成的讀書小組、輪流借閱未經審查的譯本或左翼／民主思潮書籍、在筆記本中摘錄討論重點與心得。',
    historicalContext:
      '戒嚴時期實施嚴格的出版審查與結社限制，治安單位常以「預防叛亂」為名監控青年與知識分子的聚會。單純的求知與思辨，在當時的檢肅架構下往往被擴張解釋為思想傾向問題。',
    reflectionPrompt:
      '閱讀一本書並與朋友討論，是否足以成為一個人被懷疑與調查的理由？',
  },
  speech_investigation: {
    id: 'speech_investigation',
    caseNumber: 'PF-1970-002',
    archiveCode: 'EDU-SIM-02',
    title: '言論遭調查者',
    fileStatus: '遭列入調查',
    subtitle: '公開發言與私人評論受監控脈絡',
    stampText: '言論查核',
    investigationReason:
      '因在日常對話或公開場合評論時政與管制措施，而遭當局懷疑散播不滿言論。',
    investigationRecord:
      '課堂發言、職場談話與意見紀錄受到關注，口頭評論內容可能被作為調查依據。',
    summary:
      '您的抉擇多半反映了「對公共事務提出疑問、不滿或直率評論」的行動傾向。在戒嚴體制下，無論是在課堂、職場茶水間、書信或日記中對時局與政策提出批評，都可能因他人檢舉或監聽而被列入調查。',
    investigationTrigger:
      '對時政、物價、選舉制度或教育體制表達質疑；在非公開場合抱怨生活困境與威權措施；於通信或日記中留下對現況的批判語句。',
    historicalContext:
      '在缺乏言論免責與新聞自由保障的年代，「不滿現狀」的言辭很容易與「動搖人心」或「為匪宣傳」等罪名連結。許多案件並非源於有組織的行動，而是起於一時的口頭發言或私人文字。',
    reflectionPrompt:
      '當日常抱怨與公開批評都可能引來風險，社會還能如何聽見真實的聲音？',
  },
  implicated_associate: {
    id: 'implicated_associate',
    caseNumber: 'PF-1970-003',
    archiveCode: 'EDU-SIM-03',
    title: '人際關係受牽連者',
    fileStatus: '遭列入調查',
    subtitle: '連坐盤查與社交網絡牽連脈絡',
    stampText: '關聯清查',
    investigationReason:
      '因協助親友留宿、保管物件或頻繁往來照應，而在連坐清查中受到牽連。',
    investigationRecord:
      '日常人際往來、留宿協助與親友名單受到關注，社交關聯可能被作為清查依據。',
    summary:
      '您的抉擇顯現出重視「同儕情誼、親屬互助與日常人際往來」。在戒嚴時期的政治案件偵辦中，一旦某人成為調查對象，其親友、室友、同事、擔保人甚至僅曾同行或留宿的友人，皆常被要求配合約談並面臨「知情不報」的指控風險。',
    investigationTrigger:
      '曾替遭調查的朋友轉交物品、暫借住處、出面作保，或僅是名單、通訊錄與合照上出現過的熟識者。',
    historicalContext:
      '當時的保防制度與《檢肅匪諜條例》等規範強調舉報責任與連帶關係，使整個社交網絡承受巨大壓力。許多受牽連者未必理解案件全貌，卻因正常的人情往來而長期背負政治檔案註記與生活限制。',
    reflectionPrompt:
      '當制度要求人們對身邊親友保持戒心甚至舉報時，人際信任會面臨什麼考驗？',
  },
  print_dissemination: {
    id: 'print_dissemination',
    caseNumber: 'PF-1970-004',
    archiveCode: 'EDU-SIM-04',
    title: '文字傳播遭調查者',
    fileStatus: '遭列入調查',
    subtitle: '刊物印製、抄寫與訊息流傳脈絡',
    stampText: '刊物查扣',
    investigationReason:
      '因手抄筆記、翻譯複寫或傳遞未經審查之剪報文章，而遭當局懷疑涉及文字傳播。',
    investigationRecord:
      '手抄稿件、私人書信與剪報資料的流通受到關注，留存之文字載體可能被作為調查依據。',
    summary:
      '您的選擇傾向於「記錄、轉抄、保存或傳遞文字訊息」。在資訊受高度管制的時期，油印傳單、手抄筆記、地下刊物、剪報或跨海寄送的書信與雜誌，皆被視為重點查緝對象，傳播行為本身便可能成為調查核心。',
    investigationTrigger:
      '協助校對或油印非官方刊物、轉寄海外新聞剪報、妥善保存可能遭銷毀的文字資料，或協助複印敏感文章給朋友。',
    historicalContext:
      '戒嚴時期透過《出版法》與警備總部文化審檢機制，嚴密管制文字的生產與流通。即使未具政治企圖，協助保存或分享不同觀點的文字載體，仍常在偵查中被視為「散布不當思想」的證據。',
    reflectionPrompt:
      '在資訊受封鎖的年代，抄寫、保存與傳遞不同觀點的文字為何需要承擔代價？',
  },
  acquitted: {
    id: 'acquitted',
    caseNumber: 'PF-1970-000',
    archiveCode: 'EDU-SIM-00',
    title: '獲判無罪',
    fileStatus: '查無實據・無罪結案',
    subtitle: '全面迴避與自我審查脈絡',
    stampText: '查無實據',
    investigationReason:
      '雖經例行清查，惟各項情境均明確拒絕參與、不留存亦不傳述敏感訊息，查無違法事證。',
    investigationRecord:
      '未參加私下共讀、未公開評論時政、亦未協助親友寄放或傳遞未經審查之文字物件。',
    summary:
      '在您的五項情境抉擇中，多數選擇了「明確拒絕、保持距離與謹慎自保」，因而未觸及當時的治安紅線，在模擬審查中獲判無罪、未予起訴。然而在戒嚴體制下，「安全」往往必須靠著對知識、言論與親友求助一再說不來換取。',
    investigationTrigger:
      '在高度監控的環境下，唯有徹底拒絕未審書籍、封口不談時政，並與高風險往來劃清界線，才較有機會免於立案追查。',
    historicalContext:
      '白色恐怖時期並非人人都會成為政治犯，但嚴刑峻法與連坐舉報機制迫使無數普通人在日常生活中學會「自我審查」與「拒絕往來」，使恐懼滲透進校園、職場與家庭。',
    reflectionPrompt:
      '當一個人必須靠著不斷拒絕討論、拒絕閱讀與拒絕助人才能換取「無罪」，這樣的社會算真正安全嗎？',
  },
};
