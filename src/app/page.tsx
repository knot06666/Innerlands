"use client";

import { AnimatePresence, motion } from "framer-motion";
import { track } from "@vercel/analytics";
import { ArrowRight, Camera, Droplets, Leaf, Mountain, RefreshCcw, Sparkles, Volume2, VolumeX, Wind } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { interludes, questions, results } from "@/data/quiz";
import { getNatureResult, scoreChoices } from "@/lib/personality";
import type { AnswerChoice, NatureResult } from "@/types/quiz";
import type { CSSProperties, MutableRefObject, RefObject } from "react";

const totalQuestions = questions.length;

const sceneVariants = {
  enter: { opacity: 0, scale: 1.04, filter: "blur(12px) brightness(1.3)" },
  center: { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" },
  exit: { opacity: 0, scale: 0.97, filter: "blur(8px) brightness(0.7)" }
};

const quietFade = {
  enter: { opacity: 0, scale: 1.015 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.99 }
};

type Phase = "intro" | "question" | "interlude" | "result";

type SceneParticleType = "mist" | "dust" | "rain" | "stars" | "wind" | "shimmer";

const SCENE_PARTICLE_MAP: Record<string, { type: SceneParticleType; count: number }> = {
  "mist-forest": { type: "mist", count: 14 },
  "morning-meadow": { type: "dust", count: 11 },
  "clouded-sea": { type: "shimmer", count: 10 },
  "mountain-wind": { type: "wind", count: 8 },
  "rain-garden": { type: "rain", count: 18 },
  "river-valley": { type: "shimmer", count: 12 },
  "desert-stars": { type: "stars", count: 16 },
  "tropical-rainforest": { type: "rain", count: 22 },
  "frozen-lake": { type: "shimmer", count: 14 },
  "twilight-valley": { type: "stars", count: 10 },
  "volcanic-island": { type: "dust", count: 16 },
  "deep-cave": { type: "shimmer", count: 8 },
};

const JOURNEY_ICONS = [Leaf, Wind, Droplets, Mountain, Sparkles];

type AmbientAudio = {
  element: HTMLAudioElement;
  fadeFrame: number | null;
};

type DownloadFallback = {
  url: string;
  fileName: string;
  hostedUrl?: string;
};

type ResultImage = {
  blob: Blob;
  dataUrl: string;
};

const ambientVolume = 0.38;
const siteCredit = "made by knotji";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerChoice[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "downloaded">("idle");
  const [downloadFallback, setDownloadFallback] = useState<DownloadFallback | null>(null);
  const audioRef = useRef<AmbientAudio | null>(null);
  const downloadResetTimerRef = useRef<number | null>(null);
  const introHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const interludeHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const currentQuestion = questions[step];
  const interlude = interludes[Math.min(answers.length, interludes.length - 1)] ?? interludes[0];
  const completedResult = useMemo(() => {
    if (answers.length < totalQuestions) return null;
    return getNatureResult(scoreChoices(answers));
  }, [answers]);

  const result = phase === "result" ? completedResult : null;

  // Shuffled once on the client after mount — avoids SSR/client mismatch.
  const [sessionImages, setSessionImages] = useState<string[]>(() =>
    Object.values(results).map(r => r.imageUrl)
  );

  const interludeImage =
    answers.length >= totalQuestions
      ? completedResult?.imageUrl
      : sessionImages[answers.length + 1] ?? sessionImages[0];

  const activeImage =
    phase === "interlude"
      ? interludeImage ?? sessionImages[0]
      : phase === "question"
      ? sessionImages[step + 1] ?? sessionImages[0]
      : phase === "result"
      ? result?.imageUrl ?? sessionImages[0]
      : sessionImages[0];

  useEffect(() => {
    const urls = Object.values(results).map(r => r.imageUrl);
    const shuffled = [...urls];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSessionImages(shuffled);
    preloadImages(shuffled);

    return () => {
      clearDownloadResetTimer(downloadResetTimerRef);
      stopAmbientAudio(audioRef.current);
    };
  }, []);

  function ensureAudio(): HTMLAudioElement {
    if (!audioRef.current) {
      const audio = new Audio("/sound/sound.mp3");
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      audioRef.current = { element: audio, fadeFrame: null };
    }
    return audioRef.current.element;
  }

  function beginJourney() {
    const audio = ensureAudio();
    void audio.play().catch(() => undefined);
    setIsMuted(false);
    fadeAmbientVolume(audioRef.current, ambientVolume, 1800);
    trackJourneyEvent("journey_started");
    setPhase("interlude");
  }

  function chooseAnswer(choice: AnswerChoice) {
    if (isAdvancing) {
      return;
    }

    setIsAdvancing(true);
    const nextAnswers = [...answers.slice(0, step), choice];
    trackJourneyEvent("question_answered", {
      choiceId: choice.id,
      questionId: currentQuestion.id,
      questionStep: step + 1
    });
    setAnswers(nextAnswers);
    setPhase("interlude");
  }

  function continueJourney() {
    if (answers.length >= totalQuestions && completedResult) {
      trackJourneyEvent("journey_completed", {
        resultId: completedResult.id,
        resultName: completedResult.worldName
      });
      trackJourneyEvent("result_viewed", {
        resultId: completedResult.id,
        resultName: completedResult.worldName
      });
      setPhase("result");
      return;
    }

    setStep(answers.length);
    setIsAdvancing(false);
    setPhase("question");
  }

  function restart() {
    trackJourneyEvent("journey_restarted", {
      fromPhase: phase,
      answeredCount: answers.length
    });
    setAnswers([]);
    setStep(0);
    setIsAdvancing(false);
    clearDownloadResetTimer(downloadResetTimerRef);
    closeDownloadFallback();
    setSaveStatus("idle");
    setIsMuted(true);
    fadeAmbientVolume(audioRef.current, 0, 900);
    setPhase("intro");
  }

  function toggleSound() {
    const nextMuted = !isMuted;
    const audio = ensureAudio();
    if (!nextMuted) {
      void audio.play().catch(() => undefined);
    }
    setIsMuted(nextMuted);
    fadeAmbientVolume(audioRef.current, nextMuted ? 0 : ambientVolume, nextMuted ? 900 : 1400);
  }

  async function saveResultImage() {
    if (!result) {
      return;
    }

    setIsSaving(true);
    clearDownloadResetTimer(downloadResetTimerRef);
    setSaveStatus("idle");
    trackJourneyEvent("result_save_clicked", {
      isInAppBrowser: isInAppBrowser(),
      resultId: result.id,
      resultName: result.worldName
    });

    try {
      const resultImage = await createResultImage(result);
      const fileName = `lok-khang-nai-${result.id}.png`;
      const file = new File([resultImage.blob], fileName, { type: "image/png" });
      const hostedUrl = getHostedResultImageUrl(result.id);

      if (isInAppBrowser() && shouldUseNativeFileShare(file)) {
        const didShare = await shareResultFile(file, result);
        if (didShare) {
          markResultSaved();
          return;
        }
      }

      if (isInAppBrowser()) {
        showDownloadFallback(resultImage, fileName, hostedUrl);
        trackJourneyEvent("result_save_fallback_shown", {
          reason: "in_app_browser_actions",
          resultId: result.id,
          resultName: result.worldName
        });
        return;
      }

      if (shouldUseNativeFileShare(file)) {
        try {
          await navigator.share({
            files: [file],
            text: `โลกข้างในของฉันคือ ${result.worldName}`,
            title: "โลกข้างใน"
          });
          trackJourneyEvent("result_save_completed", {
            method: "native_share",
            resultId: result.id,
            resultName: result.worldName
          });
          markResultSaved();
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      downloadBlob(resultImage.blob, fileName);

      if (shouldShowLongPressFallback()) {
        showDownloadFallback(resultImage, fileName, hostedUrl);
        trackJourneyEvent("result_save_fallback_shown", {
          resultId: result.id,
          resultName: result.worldName
        });
      }

      trackJourneyEvent("result_save_completed", {
        method: shouldShowLongPressFallback() ? "browser_download_with_fallback" : "browser_download",
        resultId: result.id,
        resultName: result.worldName
      });
      markResultSaved();
    } finally {
      setIsSaving(false);
    }
  }

  async function shareResultFile(file: File, currentResult: NatureResult) {
    try {
      await navigator.share({
        files: [file],
        text: `โลกข้างในของฉันคือ ${currentResult.worldName}`,
        title: "โลกข้างใน"
      });
      trackJourneyEvent("result_save_completed", {
        method: "native_share",
        resultId: currentResult.id,
        resultName: currentResult.worldName
      });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return true;
      }

      return false;
    }
  }

  function markResultSaved() {
    setSaveStatus("downloaded");
    downloadResetTimerRef.current = window.setTimeout(() => {
      setSaveStatus("idle");
      downloadResetTimerRef.current = null;
    }, 2600);
  }

  function showDownloadFallback(resultImage: ResultImage, fileName: string, hostedUrl?: string) {
    setDownloadFallback({ fileName, hostedUrl, url: resultImage.dataUrl });
  }

  function closeDownloadFallback() {
    setDownloadFallback(null);
  }

  async function copyResultImageLink() {
    if (!downloadFallback?.hostedUrl) {
      return;
    }

    await navigator.clipboard?.writeText(new URL(downloadFallback.hostedUrl, window.location.href).toString()).catch(() => undefined);
    trackJourneyEvent("result_image_link_copied", {
      resultId: result?.id ?? "unknown",
      resultName: result?.worldName ?? "unknown"
    });
  }

  function trackResultImageOpened() {
    trackJourneyEvent("result_image_opened", {
      resultId: result?.id ?? "unknown",
      resultName: result?.worldName ?? "unknown"
    });
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-ink text-white">
      <NatureBackdrop imageUrl={activeImage} />

      {phase !== "intro" ? (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
          className="fixed right-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-mist backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          {isMuted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
        </button>
      ) : null}

      {downloadFallback ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/72 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="บันทึกรูปผลลัพธ์"
            className="w-full max-w-sm rounded-lg border border-white/25 bg-white p-4 text-ink shadow-mist"
          >
            <h2 className="font-display-thai text-lg font-semibold">บันทึกรูปผลลัพธ์</h2>
            <p className="font-poem-thai mt-2 text-sm leading-6 text-ink/70">
              เบราว์เซอร์ในแอปบางตัวไม่ยอมบันทึกรูปโดยตรง ลองใช้ปุ่มด้านล่างเพื่อเปิดรูปหรือคัดลอกลิงก์แทน
            </p>
            {downloadFallback.hostedUrl ? (
              <p className="font-poem-thai mt-2 text-sm leading-6 text-ink/70">
                ถ้า IG ยังไม่ขึ้นเมนูบันทึก ให้เปิดรูปเต็มจอ แล้วกดเมนูของ IG เพื่อเปิดต่อใน Safari หรือ Chrome
              </p>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={downloadFallback.url}
              alt="รูปผลลัพธ์โลกข้างในสำหรับบันทึก"
              className="pointer-events-auto mt-4 max-h-[52svh] w-full select-auto rounded-md bg-ink/5 object-contain"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeDownloadFallback}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink/15 px-4 text-sm font-medium text-ink transition hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-ink/30"
              >
                ปิด
              </button>
              <a
                href={downloadFallback.hostedUrl ?? downloadFallback.url}
                target={downloadFallback.hostedUrl ? "_blank" : undefined}
                rel={downloadFallback.hostedUrl ? "noreferrer" : undefined}
                download={downloadFallback.hostedUrl ? undefined : downloadFallback.fileName}
                onClick={trackResultImageOpened}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white transition hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink/30"
              >
                เปิดรูปเต็มจอ
              </a>
              {downloadFallback.hostedUrl ? (
                <button
                  type="button"
                  onClick={copyResultImageLink}
                  className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-ink/15 px-4 text-sm font-medium text-ink transition hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-ink/30"
                >
                  คัดลอกลิงก์รูป
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <motion.section
            key="intro"
            variants={quietFade}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={(definition) => focusSceneHeading(definition, introHeadingRef)}
            className="relative z-10 flex min-h-svh flex-col justify-end px-5 py-8 sm:justify-center"
          >
            <div className="mx-auto w-full max-w-lg pb-8 sm:pb-0">
              <p className="font-kicker-thai text-sm font-medium leading-7 text-white/72">เว็บเดินทางสั้น ๆ ผ่านธรรมชาติของใจ</p>
              <h1
                ref={introHeadingRef}
                tabIndex={-1}
                className="font-display-thai mt-3 text-balance text-5xl font-semibold leading-[1.05] text-white outline-none sm:text-6xl"
              >
                โลกข้างใน
              </h1>
              <p className="font-poem-thai mt-5 max-w-md text-pretty text-lg font-medium leading-9 text-white/78">
                ลองเดินผ่านป่า หมอก น้ำ ลม และแสง เพื่อค้นพบว่าคุณอาศัยอยู่ในโลกธรรมชาติแบบไหน
              </p>
              <button
                type="button"
                onClick={beginJourney}
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-ink shadow-mist transition hover:bg-mistBlue focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                เริ่มเดินทาง
              </button>
              <p className="font-kicker-thai mt-5 text-xs leading-5 text-white/58">
                ประสบการณ์นี้เป็นพื้นที่สะท้อนใจเพื่อความบันเทิง ไม่ใช่การประเมินทางจิตวิทยา
              </p>
              <p className="font-kicker-thai mt-2 text-xs leading-5 text-white/42">{siteCredit}</p>
            </div>
          </motion.section>
        ) : null}

        {phase === "interlude" ? (
          <motion.section
            key={`interlude-${step}-${answers.length}`}
            variants={quietFade}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={(definition) => focusSceneHeading(definition, interludeHeadingRef)}
            className="relative z-10 flex min-h-svh items-center justify-center px-6 text-center"
          >
            <div className="mx-auto max-w-sm">
              <motion.div
                className="relative mx-auto h-32 w-32 rounded-full border border-white/20 bg-white/10 shadow-mist backdrop-blur"
                animate={{ scale: [1, 1.07, 1], opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.span
                  className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
                  animate={{ y: [-18, 18, -18], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.span
                  className="absolute inset-5 rounded-full border border-white/18"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <p className="font-kicker-thai mt-8 text-sm font-medium leading-7 text-white/68">{interlude.eyebrow}</p>
              <h2
                ref={interludeHeadingRef}
                tabIndex={-1}
                className="font-display-thai mt-2 text-balance text-[27px] font-semibold leading-tight text-white outline-none"
              >
                {interlude.title}
              </h2>
              <p className="font-poem-thai mt-4 text-pretty text-[17px] font-medium leading-8 text-white/76">{interlude.body}</p>
              <motion.button
                type="button"
                onClick={continueJourney}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.45, ease: "easeOut" }}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-ink shadow-mist transition hover:bg-mistBlue focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                {answers.length >= totalQuestions ? "ดูโลกของฉัน" : "เดินต่อ"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            </div>
          </motion.section>
        ) : null}

        {phase === "question" && currentQuestion ? (
          <motion.section
            key={currentQuestion.id}
            variants={sceneVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.58, ease: "easeOut" }}
            onAnimationComplete={(definition) => focusSceneHeading(definition, questionHeadingRef)}
            className="relative z-10 flex min-h-svh flex-col px-5 py-4 max-[340px]:px-4 sm:py-6"
          >
            <header className="mx-auto flex w-full max-w-md items-center justify-between pr-12 text-sm text-white/72">
              <span>{currentQuestion.scene}</span>
              <div className="flex items-center gap-1.5" aria-label={`ขั้นตอนที่ ${step + 1} จาก ${totalQuestions}`}>
                {JOURNEY_ICONS.map((Icon, index) => (
                  <Icon
                    key={index}
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 transition-all duration-500 ${
                      index < step
                        ? "text-white"
                        : index === step
                        ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                        : "text-white/28"
                    }`}
                  />
                ))}
              </div>
            </header>

            <div className="mx-auto mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/20 sm:mt-4">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={false}
                animate={{ width: `${((step + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.42, ease: "easeOut" }}
              />
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-5 max-[340px]:py-2 min-[700px]:py-10">
              <p className="font-kicker-thai mb-2 text-sm font-medium leading-7 text-white/70 min-[700px]:mb-4">โลกข้างใน</p>
              <h1
                ref={questionHeadingRef}
                tabIndex={-1}
                className="font-display-thai text-balance text-[27px] font-semibold leading-tight text-white outline-none max-[340px]:text-[23px] min-[700px]:text-[34px]"
              >
                {currentQuestion.title}
              </h1>
              <p className="font-poem-thai mt-3 text-pretty text-[16px] font-medium leading-8 text-white/78 max-[340px]:mt-2 max-[340px]:text-[15px] max-[340px]:leading-7 min-[700px]:mt-5 min-[700px]:text-lg min-[700px]:leading-9">
                {currentQuestion.prompt}
              </p>

              <div className="mt-5 grid gap-2.5 max-[340px]:mt-3 max-[340px]:gap-2 min-[700px]:mt-9 min-[700px]:gap-3">
                {currentQuestion.choices.map((choice, index) => (
                  <motion.button
                    key={choice.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 + index * 0.05 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => chooseAnswer(choice)}
                    disabled={isAdvancing}
                    className="group min-h-20 rounded-lg border border-white/20 bg-white/14 px-4 py-3 text-left shadow-mist backdrop-blur-md transition hover:border-white/40 hover:bg-white/22 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-wait disabled:opacity-70 max-[340px]:min-h-[72px] max-[340px]:py-2.5 min-[700px]:min-h-24 min-[700px]:py-4"
                  >
                    <span className="font-display-thai block text-[15px] font-semibold leading-6 text-white max-[340px]:text-sm max-[340px]:leading-5 min-[700px]:text-base min-[700px]:leading-7">
                      {choice.text}
                    </span>
                    <span className="font-poem-thai mt-1 block text-sm font-medium leading-6 text-white/62 max-[340px]:text-[13px] max-[340px]:leading-5 min-[700px]:leading-6">
                      {choice.subtext}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <p className="font-kicker-thai mx-auto w-full max-w-md pb-1 text-xs leading-5 text-white/54">
              ประสบการณ์นี้เป็นพื้นที่สะท้อนใจเพื่อความบันเทิง ไม่ใช่การประเมินทางจิตวิทยา
            </p>
          </motion.section>
        ) : null}

        {phase === "result" && result ? (
          <motion.section
            key="result"
            variants={quietFade}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.62, ease: "easeOut" }}
            onAnimationComplete={(definition) => focusSceneHeading(definition, resultHeadingRef)}
            className="relative z-10 flex min-h-svh flex-col px-4 py-4 max-[340px]:px-3 sm:py-6"
          >
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start py-2 min-[700px]:max-w-[440px] min-[700px]:justify-center min-[700px]:py-6">
              <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-lg border border-white/24 bg-white/12 px-5 py-5 shadow-mist backdrop-blur-md max-[340px]:gap-3 max-[340px]:px-4 max-[340px]:py-4 min-[700px]:aspect-[9/16] min-[700px]:justify-between min-[700px]:gap-5 min-[700px]:px-7 min-[700px]:py-7">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,rgba(9,20,25,0.24))]" />
                <div className="relative">
                  <p className="font-kicker-thai text-xs font-medium leading-6 text-white/66">โลกธรรมชาติของคุณ</p>
                  <h1
                    ref={resultHeadingRef}
                    tabIndex={-1}
                    className="font-display-thai mt-2 text-balance text-[34px] font-semibold leading-[1.08] text-white outline-none max-[340px]:text-[30px] min-[700px]:text-[42px]"
                  >
                    {result.worldName}
                  </h1>
                  <p className="font-display-thai mt-3 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-semibold leading-5 text-white backdrop-blur">
                    {result.relatedNature}
                  </p>
                </div>

                <blockquote className="font-poem-thai relative text-pretty text-[18px] font-semibold leading-8 text-white/90 max-[340px]:text-[16px] max-[340px]:leading-7 min-[700px]:text-[20px] min-[700px]:leading-9">
                  {result.poster.quote}
                </blockquote>

                <div className="relative grid gap-4 max-[340px]:gap-3">
                  <div>
                    <h2 className="font-display-thai text-sm font-semibold text-white">ทำไมคุณถึงได้โลกนี้</h2>
                    <p className="font-poem-thai mt-1.5 text-pretty text-[15px] font-medium leading-7 text-white/78 max-[340px]:text-sm max-[340px]:leading-6 min-[700px]:mt-2 min-[700px]:text-[16px] min-[700px]:leading-8">
                      {result.poster.summary}
                    </p>
                  </div>

                  <div>
                    <h2 className="font-display-thai text-sm font-semibold text-white">พลังของคุณ</h2>
                    <div className="mt-2 flex flex-wrap gap-2 max-[340px]:gap-1.5">
                      {result.strengths.map((strength) => (
                        <span key={strength} className="font-poem-thai rounded-full border border-white/18 bg-white/14 px-3 py-1.5 text-xs font-medium leading-5 text-white/78 backdrop-blur max-[340px]:px-2.5">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display-thai text-sm font-semibold text-white">ในวันที่คุณเหนื่อย</h2>
                    <p className="font-poem-thai mt-1.5 text-pretty text-sm font-medium leading-7 text-white/76 max-[340px]:leading-6 min-[700px]:mt-2 min-[700px]:text-[15px]">
                      {result.poster.tiredMessage}
                    </p>
                  </div>
                </div>

                <div className="relative border-t border-white/18 pt-3">
                  <p className="font-kicker-thai text-xs font-semibold leading-5 text-white/70">โลกข้างใน</p>
                  <p className="font-kicker-thai mt-1 text-[11px] leading-5 text-white/52">
                    ประสบการณ์สะท้อนใจ ไม่ใช่การประเมินทางจิตวิทยา
                  </p>
                </div>
              </div>

              <p className="font-kicker-thai mt-3 text-center text-xs leading-5 text-white/58">แคปหน้าจอโปสเตอร์นี้ไว้ได้เลย</p>

              <div className="mx-auto mt-2 grid w-full grid-cols-2 gap-2 rounded-lg bg-ink/32 p-1 backdrop-blur-md min-[700px]:bg-transparent min-[700px]:p-0 min-[700px]:backdrop-blur-0">
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/24 bg-white/14 px-3 text-sm font-medium text-white shadow-mist transition hover:bg-white/22 focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  เริ่มใหม่
                </button>
                <button
                  type="button"
                  onClick={saveResultImage}
                  disabled={isSaving}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/24 bg-white/14 px-3 text-sm font-medium text-white shadow-mist transition hover:bg-white/22 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-wait disabled:opacity-80"
                >
                  <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isSaving ? "กำลังเตรียมรูป" : saveStatus === "downloaded" ? "บันทึกแล้ว" : "บันทึกผลลัพธ์"}
                </button>
              </div>

              <details className="group mt-6 rounded-lg border border-white/18 bg-white/10 px-4 py-3 text-white shadow-mist backdrop-blur-md">
                <summary className="font-display-thai flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 [&::-webkit-details-marker]:hidden">
                  อ่านรายละเอียดเพิ่มเติม
                  <span className="text-lg leading-none text-white/62 transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>

                <div className="pt-4">
                  <p className="font-kicker-thai text-sm font-medium leading-7 text-white/68">โลกธรรมชาติของคุณ</p>
                  <h2
                    className="font-display-thai mt-3 text-balance text-[38px] font-semibold leading-[1.08] text-white outline-none min-[700px]:mt-4 min-[700px]:text-5xl"
                  >
                    {result.worldName}
                  </h2>
                  <p className="font-kicker-thai mt-3 text-sm font-medium leading-6 text-white/58">ทำไมคุณถึงได้โลกนี้</p>
                  <p className="font-poem-thai mt-2 text-[16px] font-medium leading-8 text-white/78 min-[700px]:text-lg min-[700px]:leading-9">
                    {result.poster.summary}
                  </p>

                  <blockquote className="font-poem-thai mt-5 border-l-2 border-white/28 pl-4 text-[17px] font-semibold leading-8 text-white/86 min-[700px]:mt-6 min-[700px]:text-lg min-[700px]:leading-9">
                    {result.quote}
                  </blockquote>

                  <div className="mt-5 flex items-center gap-3 border-y border-white/20 py-3 min-[700px]:mt-7 min-[700px]:py-4">
                    <span className="font-kicker-thai text-sm text-white/58">ธรรมชาติที่รายล้อม</span>
                    <span className="font-display-thai rounded-full bg-white/18 px-3 py-1 text-sm font-semibold text-white backdrop-blur">{result.relatedNature}</span>
                  </div>

                  <section className="mt-5 min-[700px]:mt-7">
                    <h2 className="font-display-thai text-base font-semibold text-white">พลังของโลกนี้</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.strengths.map((strength) => (
                        <span key={strength} className="font-poem-thai rounded-full border border-white/20 bg-white/14 px-3 py-2 text-sm font-medium text-white/78 backdrop-blur">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="mt-5 grid gap-4 min-[700px]:mt-7 min-[700px]:gap-5">
                    <div>
                      <h2 className="font-display-thai text-base font-semibold text-white">ความรู้สึกที่ซ่อนอยู่</h2>
                      <p className="font-poem-thai mt-2 text-[16px] font-medium leading-8 text-white/76 min-[700px]:text-lg min-[700px]:leading-9">
                        {result.hiddenFeelings}
                      </p>
                    </div>
                    <div>
                      <h2 className="font-display-thai text-base font-semibold text-white">ในวันที่คุณเหนื่อย</h2>
                      <p className="font-poem-thai mt-2 text-[16px] font-medium leading-8 text-white/76 min-[700px]:text-lg min-[700px]:leading-9">
                        {result.tiredMessage}
                      </p>
                    </div>
                  </section>

                  <p className="font-kicker-thai mt-5 text-xs leading-5 text-white/54 min-[700px]:mt-7">
                    ประสบการณ์นี้เป็นพื้นที่สะท้อนใจเพื่อความบันเทิง ไม่ใช่การประเมินทางจิตวิทยา
                  </p>
                </div>
              </details>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function focusSceneHeading(definition: unknown, ref: RefObject<HTMLHeadingElement>) {
  if (definition !== "center") {
    return;
  }

  ref.current?.focus({ preventScroll: true });
}

function clearDownloadResetTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current === null) {
    return;
  }

  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function trackJourneyEvent(name: string, properties?: Record<string, string | number | boolean>) {
  try {
    track(name, properties);
  } catch {
    // Analytics should never block the reflective journey.
  }
}

function fadeAmbientVolume(ambient: AmbientAudio | null, targetVolume: number, duration: number) {
  if (!ambient) {
    return;
  }

  if (ambient.fadeFrame !== null) {
    window.cancelAnimationFrame(ambient.fadeFrame);
    ambient.fadeFrame = null;
  }

  if (targetVolume > 0 && ambient.element.paused) {
    void ambient.element.play();
  }

  const startVolume = ambient.element.volume;
  const startedAt = window.performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    ambient.element.volume = startVolume + (targetVolume - startVolume) * easedProgress;

    if (progress < 1) {
      ambient.fadeFrame = window.requestAnimationFrame(step);
      return;
    }

    ambient.element.volume = targetVolume;
    ambient.fadeFrame = null;

    if (targetVolume === 0) {
      ambient.element.pause();
    }
  };

  ambient.fadeFrame = window.requestAnimationFrame(step);
}

function stopAmbientAudio(ambient: AmbientAudio | null) {
  if (!ambient) {
    return;
  }

  if (ambient.fadeFrame !== null) {
    window.cancelAnimationFrame(ambient.fadeFrame);
  }

  ambient.element.pause();
  ambient.element.src = "";
}

function NatureBackdrop({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.div
          key={imageUrl}
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 1.75, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_22rem),linear-gradient(180deg,rgba(9,20,25,0.24),rgba(9,20,25,0.44)_46%,rgba(9,20,25,0.66))]" />
      <AnimatePresence initial={false}>
        <NatureParticles key={`p-${imageUrl}`} imageUrl={imageUrl} />
      </AnimatePresence>
      <motion.div
        className="absolute inset-x-[-20%] top-1/4 h-48 bg-white/10 blur-3xl"
        animate={{ x: ["-8%", "8%", "-8%"], opacity: [0.24, 0.38, 0.24] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

async function createResultImage(result: NatureResult): Promise<ResultImage> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  const image = await loadCanvasImage(result.imageUrl);
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(11, 25, 31, 0.42)");
  gradient.addColorStop(0.26, "rgba(11, 25, 31, 0.56)");
  gradient.addColorStop(0.78, "rgba(11, 25, 31, 0.72)");
  gradient.addColorStop(1, "rgba(11, 25, 31, 0.92)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const cardX = 74;
  const cardY = 226;
  const cardWidth = width - cardX * 2;
  const cardHeight = 1360;

  context.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundRect(context, cardX, cardY, cardWidth, cardHeight, 34);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.22)";
  context.lineWidth = 2;
  context.stroke();

  const left = 128;
  let y = 320;

  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.font = canvasFont(34, 500);
  context.fillText("โลกธรรมชาติของฉัน", left, y);

  y += 108;
  context.fillStyle = "#ffffff";
  context.font = canvasFont(78, 700);
  y = drawWrappedText(context, result.worldName, left, y, 830, 92);

  y += 20;
  context.fillStyle = "rgba(255, 255, 255, 0.78)";
  context.font = canvasFont(35, 500);
  y = drawWrappedText(context, result.relatedNature, left, y, 830, 46);

  y += 66;
  context.strokeStyle = "rgba(255, 255, 255, 0.22)";
  context.beginPath();
  context.moveTo(left, y);
  context.lineTo(width - left, y);
  context.stroke();

  y += 74;
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.font = canvasFont(42, 600);
  y = drawWrappedText(context, result.poster.quote, left, y, 830, 62, 3);

  y += 62;
  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.font = canvasFont(38, 600);
  context.fillText("ทำไมคุณถึงได้โลกนี้", left, y);

  y += 58;
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = canvasFont(38, 400);
  y = drawWrappedText(context, result.poster.summary, left, y, 830, 58, 4);

  y += 58;
  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.font = canvasFont(38, 600);
  context.fillText("พลังของคุณ", left, y);

  y += 48;
  context.font = canvasFont(31, 500);
  let chipX = left;
  let chipY = y;
  for (const strength of result.strengths) {
    const metrics = context.measureText(strength);
    const chipWidth = metrics.width + 58;

    if (chipX + chipWidth > width - left) {
      chipX = left;
      chipY += 68;
    }

    context.fillStyle = "rgba(255, 255, 255, 0.16)";
    roundRect(context, chipX, chipY - 34, chipWidth, 52, 26);
    context.fill();
    context.fillStyle = "rgba(255, 255, 255, 0.84)";
    context.fillText(strength, chipX + 29, chipY);
    chipX += chipWidth + 18;
  }

  y = chipY + 96;
  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.font = canvasFont(38, 600);
  context.fillText("ในวันที่คุณเหนื่อย", left, y);

  y += 58;
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = canvasFont(38, 400);
  drawWrappedText(context, result.poster.tiredMessage, left, y, 830, 58, 3);

  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.font = canvasFont(30, 500);
  context.fillText("โลกข้างใน", left, height - 232);
  context.fillStyle = "rgba(255, 255, 255, 0.52)";
  context.font = canvasFont(25, 400);
  context.fillText("ประสบการณ์สะท้อนใจ ไม่ใช่การประเมินทางจิตวิทยา", left, height - 184);

  const dataUrl = canvas.toDataURL("image/png");

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create result image."));
        return;
      }

      resolve({ blob, dataUrl });
    }, "image/png");
  });
}

function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Number.POSITIVE_INFINITY
) {
  const lines: string[] = [];
  let line = "";

  for (const char of Array.from(text)) {
    const testLine = line + char;

    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      continue;
    }

    if (line) {
      lines.push(line);
    }
    line = char;
  }

  if (line) {
    lines.push(line);
  }

  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines && visibleLines.length > 0) {
    let lastLine = visibleLines[visibleLines.length - 1] + "…";
    while (context.measureText(lastLine).width > maxWidth && lastLine.length > 1) {
      lastLine = lastLine.slice(0, -2) + "…";
    }
    visibleLines[visibleLines.length - 1] = lastLine;
  }

  visibleLines.forEach((visibleLine, index) => {
    context.fillText(visibleLine, x, y + index * lineHeight);
  });

  return y + visibleLines.length * lineHeight;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function canvasFont(size: number, weight: number) {
  return `${weight} ${size}px "Sarabun", "Noto Sans Thai", "Leelawadee UI", "Segoe UI", sans-serif`;
}

function shouldUseNativeFileShare(file: File) {
  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return hasTouch && hasCoarsePointer && Boolean(navigator.canShare?.({ files: [file] })) && Boolean(navigator.share);
}

function getHostedResultImageUrl(resultId: NatureResult["id"]) {
  return `/result-image/${resultId}`;
}

function getNatureImageUrls() {
  return Array.from(new Set([...questions.map((question) => question.imageUrl), ...Object.values(results).map((result) => result.imageUrl)]));
}

function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  });
}

function shouldShowLongPressFallback() {
  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return hasTouch || hasCoarsePointer || isInAppBrowser();
}

function isInAppBrowser() {
  return /instagram|line\/|fban|fbav|fb_iab|messenger|twitter|tiktok|; wv\)/.test(navigator.userAgent.toLowerCase());
}

function seeded(index: number, salt: number): number {
  return ((index * 9301 + salt * 49297 + 233) % 23328) / 23328;
}

function getParticleStyle(type: SceneParticleType, index: number): CSSProperties {
  const x = seeded(index, 1);
  const y = seeded(index, 2);
  const delay = seeded(index, 3) * 5;
  const duration = 3 + seeded(index, 4) * 4;
  const size = 2 + seeded(index, 5) * 3;

  switch (type) {
    case "mist":
      return {
        position: "absolute",
        left: `${x * 100}%`,
        top: `${20 + y * 60}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.5)",
        filter: "blur(1.5px)",
        animation: `particle-float ${duration + 3}s ${delay}s infinite ease-in-out`,
      };
    case "dust":
      return {
        position: "absolute",
        left: `${x * 100}%`,
        top: `${15 + y * 65}%`,
        width: `${size - 0.5}px`,
        height: `${size - 0.5}px`,
        borderRadius: "50%",
        background: "rgba(255,212,95,0.62)",
        filter: "blur(1px)",
        animation: `particle-float ${duration + 2}s ${delay}s infinite ease-in-out`,
      };
    case "rain":
      return {
        position: "absolute",
        left: `${x * 100}%`,
        top: 0,
        width: "1px",
        height: `${10 + seeded(index, 6) * 8}px`,
        background: "rgba(180,215,255,0.4)",
        borderRadius: "1px",
        animation: `particle-rain ${0.5 + seeded(index, 7) * 0.5}s ${delay * 0.4}s infinite linear`,
      };
    case "stars":
      return {
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 65}%`,
        width: `${size - 0.5}px`,
        height: `${size - 0.5}px`,
        borderRadius: "50%",
        background: "rgba(255,252,200,0.88)",
        boxShadow: "0 0 5px rgba(255,248,180,0.6)",
        animation: `particle-twinkle ${2 + seeded(index, 8) * 3}s ${delay}s infinite ease-in-out`,
      };
    case "wind":
      return {
        position: "absolute",
        left: "-5%",
        top: `${15 + y * 70}%`,
        width: `${50 + seeded(index, 9) * 70}px`,
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.36), transparent)",
        animation: `particle-wind ${1.5 + seeded(index, 10) * 2}s ${delay}s infinite ease-in-out`,
      };
    case "shimmer":
      return {
        position: "absolute",
        left: `${x * 100}%`,
        top: `${10 + y * 75}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "rgba(150,210,255,0.72)",
        filter: "blur(0.5px)",
        animation: `particle-shimmer ${2 + seeded(index, 11) * 3}s ${delay}s infinite ease-in-out`,
      };
  }
}

function NatureParticles({ imageUrl }: { imageUrl: string }) {
  const sceneKey = imageUrl.split("/").pop()?.replace(/\.(png|svg|webp|jpg)$/, "") ?? "";
  const config = SCENE_PARTICLE_MAP[sceneKey];
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4 }}
      className="nature-particles pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: config.count }, function(_, i) {
        return <span key={i} aria-hidden="true" style={getParticleStyle(config.type, i)} />;
      })}
    </motion.div>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
