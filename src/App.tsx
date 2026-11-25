/**
 * @file src/App.tsx
 * @description 《假如我是政治犯》主應用程式進入點與遊戲狀態機管理。
 * 包含：
 * 1. 所有頁面跳轉皆採用柔和的漸出／漸入（Fade-out / Fade-in）轉場效果。
 * 2. 隨首次互動自動啟動沉重莊嚴的歷史氛圍配樂與翻頁／蓋印音效，並可隨時靜音。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { HistoricalDeskBackdrop } from './components/HistoricalDeskBackdrop';
import { HistoryScreen } from './components/HistoryScreen';
import { PageTurnTransition } from './components/PageTurnTransition';
import { PhotoScreen } from './components/PhotoScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReflectionScreen } from './components/ReflectionScreen';
import { ResultScreen } from './components/ResultScreen';
import { SharedFileScreen } from './components/SharedFileScreen';
import { StageIntroAnimation } from './components/StageIntroAnimation';
import { TitleScreen } from './components/TitleScreen';
import { createShuffledQuestions } from './data/questions';
import type {
  AnswerRecord,
  GamePhase,
  OptionKey,
  PhotoRecord,
  QuestionItem,
  ReflectionChoice,
} from './types/game';
import { generateUniqueCaseNumber } from './utils/caseNumber';
import { calculateSimulationResult } from './utils/scoring';
import {
  playPageTransitionSound,
  playPaperSelectSound,
  syncAmbientMusic,
} from './utils/sound';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [sessionQuestions, setSessionQuestions] = useState<QuestionItem[]>(() =>
    createShuffledQuestions()
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, OptionKey>>({});
  const [photoRecord, setPhotoRecord] = useState<PhotoRecord | null>(null);
  const [reflectionChoice, setReflectionChoice] = useState<ReflectionChoice | null>(null);
  const [sessionCaseNumber, setSessionCaseNumber] = useState<string>(() =>
    generateUniqueCaseNumber()
  );
  const [clearedNotice, setClearedNotice] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [activeShareToken, setActiveShareToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = new URLSearchParams(window.location.search).get('share');
    return token ? token.trim() : null;
  });
  const [previewingShareFromResult, setPreviewingShareFromResult] = useState<boolean>(false);

  const currentQuestion = sessionQuestions[currentQuestionIndex];

  // 首次使用者互動後解除瀏覽器音訊限制並啟動沉重氛圍配樂
  useEffect(() => {
    if (audioUnlocked) {
      syncAmbientMusic(muted);
      return;
    }

    const unlock = () => {
      setAudioUnlocked(true);
      syncAmbientMusic(muted);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioUnlocked, muted]);

  const handleToggleMute = useCallback(() => {
    setAudioUnlocked(true);
    setMuted((prev) => {
      const nextMuted = !prev;
      syncAmbientMusic(nextMuted);
      return nextMuted;
    });
  }, []);

  /** 首頁 → 拍照或上傳照片 */
  const handleStartGame = useCallback(() => {
    setAudioUnlocked(true);
    syncAmbientMusic(muted);
    playPageTransitionSound(muted);
    setClearedNotice(false);
    setPhase('PHOTO');
  }, [muted]);

  /** 拍照頁 → 返回首頁 */
  const handleBackToTitle = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('TITLE');
  }, [muted]);

  /** 確認使用存照 → 進入五題問答 */
  const handleConfirmPhoto = useCallback(
    (record: PhotoRecord) => {
      playPageTransitionSound(muted);
      setPhotoRecord(record);
      setPhase('QUIZ');
    },
    [muted]
  );

  /** 略過拍照 → 進入五題問答 */
  const handleSkipPhoto = useCallback(() => {
    playPageTransitionSound(muted);
    setPhotoRecord(null);
    setPhase('QUIZ');
  }, [muted]);

  /** 問答頁 → 回拍照建檔頁調整照片 */
  const handleBackToPhoto = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('PHOTO');
  }, [muted]);

  /** 選擇單一題目選項 */
  const handleSelectOption = useCallback(
    (optionId: OptionKey) => {
      if (!currentQuestion) return;
      playPaperSelectSound(muted);
      setAnswersByQuestionId((prev) => ({
        ...prev,
        [currentQuestion.id]: optionId,
      }));
    },
    [currentQuestion, muted]
  );

  /** 下一題，或送出進入案件分析過場 */
  const handleNextQuestion = useCallback(() => {
    if (!currentQuestion || !answersByQuestionId[currentQuestion.id]) return;

    if (currentQuestionIndex < sessionQuestions.length - 1) {
      playPageTransitionSound(muted);
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      playPageTransitionSound(muted);
      setPhase('ANALYZING');
    }
  }, [answersByQuestionId, currentQuestion, currentQuestionIndex, muted, sessionQuestions.length]);

  /** 返回上一題 */
  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      playPageTransitionSound(muted);
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex, muted]);

  /** 分析過場完成 → 李武忠案歷史介紹 */
  const handleAnalysisComplete = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('HISTORY');
  }, [muted]);

  /** 歷史介紹 → 回問答筆錄 */
  const handleBackToQuiz = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('QUIZ');
  }, [muted]);

  /** 李武忠案歷史介紹 → 人權反思 */
  const handleGoToReflection = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('REFLECTION');
  }, [muted]);

  /** 人權反思 → 回李武忠案歷史介紹 */
  const handleBackToHistory = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('HISTORY');
  }, [muted]);

  /** 選擇人權反思選項（不評分） */
  const handleSelectReflection = useCallback(
    (choice: ReflectionChoice) => {
      playPaperSelectSound(muted);
      setReflectionChoice(choice);
    },
    [muted]
  );

  /** 人權反思完成 → 翻頁進入案件結果頁（再於 ResultScreen 同步觸發自動蓋印動畫與音效） */
  const handleRevealResult = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('RESULT');
  }, [muted]);

  /** 案件結果 → 回人權反思 */
  const handleBackToReflection = useCallback(() => {
    playPageTransitionSound(muted);
    setPhase('REFLECTION');
  }, [muted]);

  /** 結束並清除資料：徹底清空照片、答案、反思選擇，並重新產生案件編號與題目選項順序 */
  const handleEndAndClear = useCallback(() => {
    playPageTransitionSound(muted);
    setAnswersByQuestionId({});
    setSessionQuestions(createShuffledQuestions());
    setCurrentQuestionIndex(0);
    setPhotoRecord(null);
    setReflectionChoice(null);
    setSessionCaseNumber(generateUniqueCaseNumber());
    setClearedNotice(true);
    setActiveShareToken(null);
    setPreviewingShareFromResult(false);
    setPhase('TITLE');
  }, [muted]);

  const handleOpenSharePreview = useCallback((token: string) => {
    setPreviewingShareFromResult(true);
    setActiveShareToken(token);
  }, []);

  const handleExitShareToQuiz = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('share')) {
        url.searchParams.delete('share');
        window.history.replaceState({}, '', url.toString());
      }
    }
    setActiveShareToken(null);
    setPreviewingShareFromResult(false);
    setPhase('TITLE');
  }, []);

  /** 整理完整作答陣列並計算配對結果（純依情境作答，不依人臉特徵） */
  const orderedAnswers: AnswerRecord[] = useMemo(() => {
    return sessionQuestions.flatMap((q) => {
      const selectedId = answersByQuestionId[q.id];
      const matchedOption = q.options.find((opt) => opt.id === selectedId);
      if (!selectedId || !matchedOption) return [];
      return [
        {
          questionId: q.id,
          optionId: selectedId,
          targetIdentity: matchedOption.targetIdentity,
        },
      ];
    });
  }, [answersByQuestionId, sessionQuestions]);

  const scoringResult = useMemo(() => {
    return calculateSimulationResult(orderedAnswers);
  }, [orderedAnswers]);

  // 以 phase 與題號作為轉場索引，並傳入當前頁面類型由 PageTurnTransition 微調翻頁節奏
  const transitionKey = phase === 'QUIZ' ? `QUIZ-${currentQuestionIndex}` : phase;

  return (
    <MotionConfig reducedMotion="user">
      <div className="archival-desk-bg relative min-h-screen text-[var(--ink-primary)] selection:bg-[#8e1e1a] selection:text-[#e4ddcc] overflow-x-hidden">
        <HistoricalDeskBackdrop currentPhase={phase} />
        {/* 全域陳舊新聞紙張紋理與泛黃雜訊圖層 */}
        <div
          aria-hidden="true"
          className="archival-global-newsprint-layer pointer-events-none fixed inset-0 z-[1]"
        />
        <StageIntroAnimation phase={phase} />
        {activeShareToken ? (
          <div className="archival-global-newsprint relative z-10 min-h-screen w-full">
            <SharedFileScreen
              shareToken={activeShareToken}
              onPlayQuiz={handleExitShareToQuiz}
              onBackToResult={
                previewingShareFromResult
                  ? () => {
                      setActiveShareToken(null);
                      setPreviewingShareFromResult(false);
                    }
                  : undefined
              }
              muted={muted}
              onToggleMute={handleToggleMute}
            />
          </div>
        ) : (
        <PageTurnTransition transitionKey={transitionKey} pageType={phase}>
          <div className="archival-global-newsprint relative z-10 min-h-screen w-full">
            {phase === 'TITLE' && (
              <TitleScreen
                onStart={handleStartGame}
                muted={muted}
                onToggleMute={handleToggleMute}
                clearedNotice={clearedNotice}
                onDismissClearedNotice={() => setClearedNotice(false)}
              />
            )}

            {phase === 'PHOTO' && (
              <PhotoScreen
                initialPhoto={photoRecord}
                onConfirmPhoto={handleConfirmPhoto}
                onSkip={handleSkipPhoto}
                onBackToTitle={handleBackToTitle}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            )}

            {phase === 'QUIZ' && currentQuestion && (
              <QuizScreen
                question={currentQuestion}
                currentIndex={currentQuestionIndex}
                totalCount={sessionQuestions.length}
                selectedOptionId={answersByQuestionId[currentQuestion.id]}
                onSelectOption={handleSelectOption}
                onNext={handleNextQuestion}
                onPrev={handlePrevQuestion}
                onBackToTitle={handleBackToPhoto}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            )}

            {phase === 'ANALYZING' && (
              <AnalyzingScreen
                onComplete={handleAnalysisComplete}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            )}

            {phase === 'HISTORY' && (
              <HistoryScreen
                onNext={handleGoToReflection}
                onBackToQuiz={handleBackToQuiz}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            )}

            {phase === 'REFLECTION' && (
              <ReflectionScreen
                selectedChoice={reflectionChoice}
                onSelectChoice={handleSelectReflection}
                onNext={handleRevealResult}
                onBackToHistory={handleBackToHistory}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            )}

            {phase === 'RESULT' && (
              <ResultScreen
                result={scoringResult}
                caseNumber={sessionCaseNumber}
                questions={sessionQuestions}
                answers={orderedAnswers}
                photoRecord={photoRecord}
                onBackToReflection={handleBackToReflection}
                onEndAndClear={handleEndAndClear}
                onPreviewSharedToken={handleOpenSharePreview}
                muted={muted}
                onToggleMute={handleToggleMute}
              />
            )}
          </div>
        </PageTurnTransition>
        )}
      </div>
    </MotionConfig>
  );
}
