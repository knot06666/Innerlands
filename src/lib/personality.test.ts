import { describe, expect, it } from "vitest";
import { questions, results, worldOrder } from "@/data/quiz";
import { calculateNatureWorld, getNatureResult, initialScores, scoreChoices } from "@/lib/personality";
import type { AnswerChoice, NatureWorldId } from "@/types/quiz";

describe("nature world scoring", () => {
  it("accumulates answer weights and resolves to a deterministic world", () => {
    const choices = [
      questions[0].choices[0],
      questions[1].choices[1],
      questions[2].choices[2],
      questions[3].choices[0],
      questions[4].choices[0]
    ];

    expect(calculateNatureWorld(scoreChoices(choices))).toBe("mist-forest");
  });

  it("uses worldOrder as the stable tie-breaker", () => {
    expect(calculateNatureWorld(initialScores)).toBe(worldOrder[0]);
  });

  it("returns result content for the calculated world", () => {
    const result = getNatureResult({
      ...initialScores,
      "clouded-sea": 7,
      "river-valley": 4
    });

    expect(result.id).toBe("clouded-sea");
    expect(result.quote.length).toBeGreaterThan(20);
  });

  it("has at least one answer path to every nature world", () => {
    const distribution = countResultDistribution();

    for (const worldId of worldOrder) {
      expect(distribution[worldId], `${worldId} should be reachable`).toBeGreaterThan(0);
    }
  });

  it("keeps result distribution within a reasonable balance", () => {
    const distribution = countResultDistribution();
    const counts = worldOrder.map((worldId) => distribution[worldId]);
    const min = Math.min(...counts);
    const max = Math.max(...counts);

    expect(distribution).toMatchInlineSnapshot(`
      {
        "clouded-sea": 148,
        "desert-stars": 97,
        "mist-forest": 203,
        "morning-meadow": 156,
        "mountain-wind": 90,
        "rain-garden": 144,
        "river-valley": 71,
        "tropical-rainforest": 115,
      }
    `);
    expect(max / min).toBeLessThanOrEqual(4);
  });

  it("keeps every result poster concise enough for mobile screenshots", () => {
    for (const worldId of worldOrder) {
      const poster = results[worldId].poster;

      expect(poster.quote.length, `${worldId} poster quote`).toBeLessThanOrEqual(58);
      expect(poster.summary.length, `${worldId} poster summary`).toBeLessThanOrEqual(96);
      expect(poster.description.length, `${worldId} poster description`).toBeLessThanOrEqual(82);
      expect(poster.tiredMessage.length, `${worldId} poster tired message`).toBeLessThanOrEqual(92);
    }
  });
});

function countResultDistribution() {
  return getAllAnswerPaths().reduce<Record<NatureWorldId, number>>((distribution, choices) => {
    const result = calculateNatureWorld(scoreChoices(choices));
    distribution[result] += 1;
    return distribution;
  }, createEmptyDistribution());
}

function getAllAnswerPaths() {
  return questions.reduce<AnswerChoice[][]>(
    (paths, question) => paths.flatMap((path) => question.choices.map((choice) => [...path, choice])),
    [[]]
  );
}

function createEmptyDistribution() {
  return worldOrder.reduce<Record<NatureWorldId, number>>((distribution, worldId) => {
    distribution[worldId] = 0;
    return distribution;
  }, {} as Record<NatureWorldId, number>);
}
