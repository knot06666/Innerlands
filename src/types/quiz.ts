export type NatureWorldId =
  | "mist-forest"
  | "morning-meadow"
  | "clouded-sea"
  | "mountain-wind"
  | "rain-garden"
  | "river-valley"
  | "desert-stars"
  | "tropical-rainforest";

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
  imageUrl: string;
  ambient: string;
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
    description: string;
    tiredMessage: string;
  };
  quote: string;
  description: string;
  strengths: string[];
  hiddenFeelings: string;
  tiredMessage: string;
};

export type ScoreState = Record<NatureWorldId, number>;
