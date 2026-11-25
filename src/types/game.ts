/**
 * @file src/types/game.ts
 * @description 《假如我是政治犯》核心型別定義檔。
 * 涵蓋流程：首頁 → 拍照／上傳 → 五題測驗 → 分析過場 → 李武忠案歷史介紹 → 人權反思 → 案件結果與下載／QR Code。
 */

/** 遊戲主狀態機 */
export type GamePhase =
  | 'TITLE'
  | 'PHOTO'
  | 'QUIZ'
  | 'ANALYZING'
  | 'HISTORY'
  | 'REFLECTION'
  | 'RESULT';

/** 五種模擬案件審查結果識別碼（四種政治犯模擬身分 ＋ 一種拒絕涉案之無罪結果） */
export type IdentityId =
  | 'study_group'
  | 'speech_investigation'
  | 'implicated_associate'
  | 'print_dissemination'
  | 'acquitted';

/** 選項代碼（A–D 對應四類涉案情境，E 為拒絕／保持距離） */
export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

/** 人權反思頁選項（不計分、不判定立場） */
export type ReflectionChoice = 'yes' | 'no' | 'rethink';

/** 照片濾鏡預設樣式（兼顧歷史復古質感與現代年輕人喜愛的底片／CCD／印刷風格） */
export type PhotoFilterPreset =
  | 'none'
  | 'ccd_2000'
  | 'kodak_film'
  | 'polaroid_fade'
  | 'newspaper_halftone'
  | 'classic_bw'
  | 'aged_sepia_bw'
  | 'crimson_darkroom';

/** 照片語句擺放位置 */
export type PhotoCaptionPlacement =
  | 'none'
  | 'above_head'
  | 'bottom_text'
  | 'border_top_bottom';

/** 照片語句／邊框配色風格 */
export type PhotoCaptionColorStyle = 'vermilion' | 'ink_tape' | 'paper_stamp';

/** 照片邊框與頭頂標語設定 */
export interface PhotoOverlayConfig {
  /** 顯示的語句文字（例如「我是政治犯」、「我有罪」或自訂短語，空字串代表無語句） */
  text: string;
  /** 擺放位置或邊框樣式 */
  placement: PhotoCaptionPlacement;
  /** 標語與邊框配色 */
  colorStyle: PhotoCaptionColorStyle;
}

/** 玩家本機檔案存照資料（僅存於瀏覽器記憶體，不上傳伺服器） */
export interface PhotoRecord {
  /** 經裁切與尺寸最佳化後的原始影像 DataURL，用於即時切換不同濾鏡與邊框 */
  originalDataUrl: string;
  /** 套用濾鏡與邊框／語句效果後的最終影像 DataURL */
  processedDataUrl: string;
  /** 目前選用的照片濾鏡預設 */
  preset: PhotoFilterPreset;
  /** 目前選用的邊框／頭上語句設定 */
  overlay?: PhotoOverlayConfig;
  /** 影像來源：裝置鏡頭拍攝或本機檔案上傳 */
  source: 'camera' | 'upload';
}

/** 單一問題選項結構 */
export interface QuestionOption {
  /** 選項代號（A / B / C / D / E） */
  id: OptionKey;
  /** 選項主要文字 */
  label: string;
  /** 補充行為描述（選填） */
  detail?: string;
  /** 固定配對規則：此選項對應的模擬政治案件身分 */
  targetIdentity: IdentityId;
}

/** 單一情境問答題目結構 */
export interface QuestionItem {
  /** 題目唯一識別碼 */
  id: string;
  /** 題號（1 起算） */
  stepNumber: number;
  /** 檔案章節標題 */
  title: string;
  /** 時代背景標記（純文字呈現） */
  eraContext: string;
  /** 情境發生地點或場域 */
  locationContext: string;
  /** 情境敘述本文 */
  scenario: string;
  /** 提問引導語 */
  prompt: string;
  /** 五個固定配對之單選選項 */
  options: QuestionOption[];
}

/** 模擬政治案件身分檔案結構 */
export interface IdentityProfile {
  /** 身分識別碼 */
  id: IdentityId;
  /** 檔案編號（例如：PF-1970-001） */
  caseNumber: string;
  /** 模擬檔案分類碼（例如：EDU-SIM-01） */
  archiveCode: string;
  /** 政治犯身分（教育性模擬名稱） */
  title: string;
  /** 檔案狀態標示 */
  fileStatus: string;
  /** 副標題／調查類型說明 */
  subtitle: string;
  /** 紅印章蓋印文字 */
  stampText: string;
  /** 涉嫌事由 */
  investigationReason: string;
  /** 調查紀錄 */
  investigationRecord: string;
  /** 詳細模擬情境解析 */
  summary: string;
  /** 常見被立案調查的觸發脈絡 */
  investigationTrigger: string;
  /** 時代背景與法制環境說明 */
  historicalContext: string;
  /** 人權反思提問 */
  reflectionPrompt: string;
}

/** 使用者單題作答紀錄 */
export interface AnswerRecord {
  questionId: string;
  optionId: OptionKey;
  targetIdentity: IdentityId;
}

/** 本機計分與配對結果 */
export interface ScoringResult {
  /** 最終配對到的模擬政治案件身分 */
  primaryIdentity: IdentityId;
  /** 五種審查結果各自的累積次數（最高 5 次） */
  scores: Record<IdentityId, number>;
  /** 是否因同分而啟用固定平手判定規則 */
  tieBroken: boolean;
  /** 依作答結果整理之各身分統計列表（由高至低排序） */
  breakdown: Array<{
    identityId: IdentityId;
    count: number;
  }>;
}

/** 李武忠案歷史時間軸單一節點 */
export interface HistoricalTimelineEvent {
  date: string;
  event: string;
  detail?: string;
}

/** 李武忠案歷史介紹頁資料結構 */
export interface HistoricalCaseReference {
  mainHeading: string;
  subHeading: string;
  caseTitle: string;
  introParagraphs: string[];
  timeline: HistoricalTimelineEvent[];
  sourceNote: string;
}
