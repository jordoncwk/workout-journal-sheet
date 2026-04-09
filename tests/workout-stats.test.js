import { buildExerciseStats } from '../js/workout-stats.js';

const workouts = [
  {
    id: 'w1',
    finishedAt: 1000,
    exercises: [
      { exercise_name: 'Bench Press', sets: [{ weight_kg: 80, reps: 8 }, { weight_kg: 90, reps: 5 }] },
    ],
  },
  {
    id: 'w2',
    finishedAt: 2000,
    exercises: [
      { exercise_name: 'Bench Press', sets: [{ weight_kg: 85, reps: 6 }] },
      { exercise_name: 'Squat', sets: [{ weight_kg: 100, reps: 5 }] },
    ],
  },
];

test('best set is heaviest weight', () => {
  const stats = buildExerciseStats(workouts, ['bench press']);
  expect(stats['bench press'].best).toEqual({ weight_kg: 90, reps: 5 });
});

test('best set tiebreaks on most reps', () => {
  const ws = [{ id: 'w1', finishedAt: 1000, exercises: [
    { exercise_name: 'OHP', sets: [{ weight_kg: 60, reps: 5 }, { weight_kg: 60, reps: 8 }] },
  ]}];
  const stats = buildExerciseStats(ws, ['ohp']);
  expect(stats['ohp'].best).toEqual({ weight_kg: 60, reps: 8 });
});

test('last is best set from most recent workout containing exercise', () => {
  const stats = buildExerciseStats(workouts, ['bench press']);
  // w2 is more recent (finishedAt: 2000), only one set: 85kg×6
  expect(stats['bench press'].last).toEqual({ weight_kg: 85, reps: 6 });
});

test('exercise name matching is case-insensitive', () => {
  const stats = buildExerciseStats(workouts, ['BENCH PRESS']);
  expect(stats['bench press'].best).toEqual({ weight_kg: 90, reps: 5 });
});

test('returns null for exercise with no history', () => {
  const stats = buildExerciseStats(workouts, ['deadlift']);
  expect(stats['deadlift'].best).toBeNull();
  expect(stats['deadlift'].last).toBeNull();
});

test('exercise not in active workout is not included in result', () => {
  const stats = buildExerciseStats(workouts, ['bench press']);
  expect(stats['squat']).toBeUndefined();
});
