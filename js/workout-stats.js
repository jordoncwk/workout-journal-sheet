/**
 * Builds a stats map for each exercise in the active workout.
 * @param {Array} workouts - All saved workout objects from history
 * @param {string[]} exerciseNames - Exercise names in the current active workout
 * @returns {Object} Map keyed by lowercased exercise name:
 *   { best: { weight_kg, reps } | null, last: { weight_kg, reps } | null }
 */
export function buildExerciseStats(workouts, exerciseNames) {
  const result = {};

  for (const rawName of exerciseNames) {
    const key = rawName.toLowerCase();
    if (key in result) continue;

    let best = null;
    let lastWorkoutTime = -1;
    let last = null;

    for (const workout of workouts) {
      for (const ex of workout.exercises) {
        if (ex.exercise_name.toLowerCase() !== key) continue;

        for (const set of ex.sets) {
          // Update best: heaviest weight, tiebreak most reps
          if (
            best === null ||
            set.weight_kg > best.weight_kg ||
            (set.weight_kg === best.weight_kg && set.reps > best.reps)
          ) {
            best = { weight_kg: set.weight_kg, reps: set.reps };
          }
        }

        // Update last: from most recent workout containing this exercise
        if (workout.finishedAt > lastWorkoutTime) {
          lastWorkoutTime = workout.finishedAt;
          // Pick best set from this session
          last = null;
          for (const set of ex.sets) {
            if (
              last === null ||
              set.weight_kg > last.weight_kg ||
              (set.weight_kg === last.weight_kg && set.reps > last.reps)
            ) {
              last = { weight_kg: set.weight_kg, reps: set.reps };
            }
          }
        }
      }
    }

    result[key] = { best, last };
  }

  return result;
}
