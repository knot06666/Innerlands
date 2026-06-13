import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { results } from "@/data/quiz";
import type { NatureWorldId } from "@/types/quiz";
import ResultShareView from "./ResultShareView";

type Props = { params: { id: string } };

export async function generateStaticParams() {
  return Object.keys(results).map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(params.id in results)) return {};
  const result = results[params.id as NatureWorldId];
  return {
    title: `โลก${result.worldName} — โลกข้างใน`,
    description: result.poster.summary,
    openGraph: {
      title: `โลก${result.worldName} — โลกข้างใน`,
      description: result.poster.summary,
      images: [{ url: `/result-image/${params.id}`, width: 1080, height: 1920 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function ResultPage({ params }: Props) {
  if (!(params.id in results)) notFound();
  const result = results[params.id as NatureWorldId];
  return <ResultShareView result={result} />;
}
