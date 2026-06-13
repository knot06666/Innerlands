"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { NatureResult } from "@/types/quiz";

export default function ResultShareView({ result }: { result: NatureResult }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  async function handleTakeQuiz() {
    window.location.href = "/";
  }

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `โลก${result.worldName} — โลกข้างใน`, url });
      } catch {
        // user dismissed
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <main
      className="relative min-h-svh overflow-hidden bg-ink text-white"
      style={{ backgroundImage: `url(${result.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.1),transparent_22rem),linear-gradient(180deg,rgba(9,20,25,0.24),rgba(9,20,25,0.44)_46%,rgba(9,20,25,0.66))]" />

      <div className="relative z-10 flex min-h-svh flex-col px-4 py-4 max-[340px]:px-3 sm:py-6">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start py-2 min-[700px]:max-w-[440px] min-[700px]:justify-center min-[700px]:py-6">

          {/* Poster card */}
          <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-lg border border-white/24 bg-white/12 px-5 py-5 shadow-mist backdrop-blur-md max-[340px]:gap-3 max-[340px]:px-4 max-[340px]:py-4 min-[700px]:gap-5 min-[700px]:px-7 min-[700px]:py-7">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,rgba(9,20,25,0.24))]" />

            <div className="relative">
              <p className="font-kicker-thai text-xs font-medium leading-6 text-white/66">โลกธรรมชาติของคุณ</p>
              <h1 className="font-display-thai mt-2 text-balance text-[34px] font-semibold leading-[1.08] text-white max-[340px]:text-[30px] min-[700px]:text-[42px]">
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

          {/* CTA */}
          <div className="mt-5 text-center">
            <p className="font-poem-thai mb-4 text-sm font-medium text-white/72">คุณเป็นโลกธรรมชาติแบบไหน?</p>
            <button
              type="button"
              onClick={handleTakeQuiz}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-ink shadow-mist transition hover:bg-mistBlue focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              ลองทำแบบทดสอบ
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Details accordion */}
          <details className="group mt-6 rounded-lg border border-white/18 bg-white/10 px-4 py-3 text-white shadow-mist backdrop-blur-md">
            <summary className="font-display-thai flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 [&::-webkit-details-marker]:hidden">
              อ่านรายละเอียดเพิ่มเติม
              <span className="text-lg leading-none text-white/62 transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>

            <div className="pt-4">
              <p className="font-kicker-thai text-sm font-medium leading-7 text-white/68">โลกธรรมชาติของคุณ</p>
              <h2 className="font-display-thai mt-3 text-balance text-[38px] font-semibold leading-[1.08] text-white min-[700px]:mt-4 min-[700px]:text-5xl">
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

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="font-kicker-thai mx-auto mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-medium text-white/78 backdrop-blur transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {copied ? "คัดลอก link แล้ว ✓" : "แชร์หน้านี้"}
          </button>

          <p className="font-kicker-thai mt-6 pb-6 text-center text-[11px] leading-5 text-white/38">made by knotji</p>
        </div>
      </div>
    </main>
  );
}
