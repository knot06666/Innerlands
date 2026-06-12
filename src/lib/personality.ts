import { results, worldOrder } from "@/data/quiz";
import type { AnswerChoice, NatureResult, NatureWorldId, ScoreState } from "@/types/quiz";

export const initialScores: ScoreState = worldOrder.reduce((scores, worldId) => {
  scores[worldId] = 0;
  return scores;
}, {} as ScoreState);

export function addChoiceScores(scores: ScoreState, choice: AnswerChoice): ScoreState {
  const next = { ...scores };

  for (const [worldId, value] of Object.entries(choice.weights) as Array<[NatureWorldId, number]>) {
    next[worldId] += value;
  }

  return next;
}

export function scoreChoices(choices: AnswerChoice[]): ScoreState {
  return choices.reduce(addChoiceScores, { ...initialScores });
}

export function calculateNatureWorld(scores: ScoreState): NatureWorldId {
  return worldOrder.reduce<NatureWorldId>((bestWorld, worldId) => {
    return scores[worldId] > scores[bestWorld] ? worldId : bestWorld;
  }, worldOrder[0]);
}

export function getNatureResult(scores: ScoreState): NatureResult {
  return results[calculateNatureWorld(scores)];
}
