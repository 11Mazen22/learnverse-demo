import assert from "node:assert/strict";
import test from "node:test";
import {
  STREAK_MILESTONES,
  computeExamAchievementSummary,
  computeLessonAchievementSummary,
  evaluateStreakMilestones,
} from "./achievement-milestones.ts";

test("STREAK_MILESTONES includes 3, 7, 14, and 30 day milestones", () => {
  assert.deepEqual([...STREAK_MILESTONES], [3, 7, 14, 30]);
});

test("evaluateStreakMilestones handles 0, 2, 3, 7, 14, 30, and 45 day streaks", () => {
  const zero = evaluateStreakMilestones(0);
  assert.equal(zero.currentMilestone, null);
  assert.equal(zero.nextMilestone.days, 3);
  assert.equal(zero.daysToNext, 3);
  assert.equal(zero.progressPct, 0);
  assert.equal(zero.allCompleted, false);

  const two = evaluateStreakMilestones(2);
  assert.equal(two.currentMilestone, null);
  assert.equal(two.nextMilestone.days, 3);
  assert.equal(two.daysToNext, 1);
  assert.equal(two.progressPct, 67);

  const three = evaluateStreakMilestones(3);
  assert.equal(three.currentMilestone?.days, 3);
  assert.equal(three.nextMilestone.days, 7);
  assert.equal(three.daysToNext, 4);
  assert.equal(three.milestones.filter((m) => m.unlocked).length, 1);

  const seven = evaluateStreakMilestones(7);
  assert.equal(seven.currentMilestone?.days, 7);
  assert.equal(seven.nextMilestone.days, 14);
  assert.equal(seven.daysToNext, 7);
  assert.equal(seven.milestones.filter((m) => m.unlocked).length, 2);

  const fourteen = evaluateStreakMilestones(14);
  assert.equal(fourteen.currentMilestone?.days, 14);
  assert.equal(fourteen.nextMilestone.days, 30);
  assert.equal(fourteen.daysToNext, 16);

  const thirty = evaluateStreakMilestones(30);
  assert.equal(thirty.currentMilestone?.days, 30);
  assert.equal(thirty.allCompleted, true);
  assert.equal(thirty.daysToNext, 0);
  assert.equal(thirty.progressPct, 100);
  assert.equal(thirty.milestones.every((m) => m.unlocked), true);

  const fortyFive = evaluateStreakMilestones(45);
  assert.equal(fortyFive.allCompleted, true);
  assert.equal(fortyFive.progressPct, 100);
});

test("computeLessonAchievementSummary classifies 100%, 92%, and 80% accurately", () => {
  const perfect = computeLessonAchievementSummary({
    scorePct: 100,
    xpReward: 60,
    coinReward: 25,
    verifiedGems: 8,
  });
  assert.equal(perfect.rank, "S+");
  assert.equal(perfect.tierColor, "gold");
  assert.equal(perfect.gemBreakdown.base90Gems, 5);
  assert.equal(perfect.gemBreakdown.perfect100BonusGems, 3);
  assert.equal(perfect.gemBreakdown.totalEligibleGems, 8);

  const ninetyTwo = computeLessonAchievementSummary({
    scorePct: 92,
    xpReward: 50,
    coinReward: 20,
    verifiedGems: 5,
  });
  assert.equal(ninetyTwo.rank, "S");
  assert.equal(ninetyTwo.tierColor, "emerald");
  assert.equal(ninetyTwo.gemBreakdown.totalEligibleGems, 5);

  const eighty = computeLessonAchievementSummary({
    scorePct: 80,
    xpReward: 40,
    coinReward: 15,
    verifiedGems: 0,
  });
  assert.equal(eighty.rank, "A");
  assert.equal(eighty.tierColor, "indigo");
  assert.equal(eighty.gemBreakdown.totalEligibleGems, 0);
});

test("computeExamAchievementSummary handles sealed, opened gold box, and failed attempt", () => {
  const sealedPass = computeExamAchievementSummary({
    passed: true,
    scorePct: 95,
    correctCount: 9,
    totalQuestions: 10,
    shieldsLeft: 2,
    xpReward: 140,
    coinReward: 60,
    hasServerBox: true,
    boxOpened: false,
    boxTier: "gold",
  });
  assert.equal(sealedPass.rank, "S+");
  assert.equal(sealedPass.giftTier, "gold");
  assert.equal(sealedPass.boxOpened, false);

  const openedPass = computeExamAchievementSummary({
    passed: true,
    scorePct: 88,
    correctCount: 7,
    totalQuestions: 8,
    shieldsLeft: 1,
    xpReward: 120,
    coinReward: 50,
    hasServerBox: true,
    boxOpened: true,
    boxTier: "silver",
    boxCoins: 75,
    boxXp: 40,
  });
  assert.equal(openedPass.rank, "S");
  assert.equal(openedPass.giftTier, "silver");
  assert.equal(openedPass.boxOpened, true);
  assert.equal(openedPass.boxCoins, 75);
  assert.equal(openedPass.boxXp, 40);

  const failed = computeExamAchievementSummary({
    passed: false,
    scorePct: 50,
    correctCount: 4,
    totalQuestions: 8,
    shieldsLeft: 0,
    xpReward: 0,
    coinReward: 0,
    hasServerBox: false,
    boxOpened: false,
  });
  assert.equal(failed.passed, false);
  assert.equal(failed.rank, "B");
  assert.equal(failed.giftTier, "bronze");
});
