export type NatureWorldId =
  | "mist-forest"
  | "morning-meadow"
  | "clouded-sea"
  | "mountain-wind"
  | "rain-garden"
  | "river-valley"
  | "desert-stars"
  | "tropical-rainforest"
  | "frozen-lake"
  | "twilight-valley"
  | "volcanic-island"
  | "deep-cave";

export type NatureWeights = Partial<Record<NatureWorldId, number>>;

export type AnswerChoice = {
  id: string;
  text: string;
  subtext: string;
  weights: NatureWeights;
};

export type JourneyQuestion = {
  id: string;
  scene: string;
  title: string;
  prompt: string;
  choices: AnswerChoice[];
};

export type JourneyInterlude = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

export type NatureResult = {
  id: NatureWorldId;
  worldName: string;
  relatedNature: string;
  imageUrl: string;
  poster: {
    quote: string;
    summary: string;
    tiredMessage: string;
  };
  quote: string;
  strengths: string[];
  hiddenFeelings: string;
  tiredMessage: string;
};

export type ScoreState = Record<NatureWorldId, number>;
