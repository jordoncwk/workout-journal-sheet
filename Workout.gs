function getWorkoutInitialData() {
  const templates = db_getTemplates().map(t => ({
    id: t.id,
    name: t.name,
    exercises: db_getTemplateExercises(t.id)
  }));
  const activeWorkout = db_getActiveWorkout();
  return { templates, activeWorkout };
}

function startWorkout(templateId, templateName, exerciseList) {
  // exerciseList = [{ exercise_name, default_sets, default_reps }]
  const startedAt = Date.now();
  const exercises = exerciseList.map(ex => ({
    exercise_name: ex.exercise_name,
    sets: Array.from({ length: ex.default_sets }, () => ({ weight_kg: '', reps: '', logged: false }))
  }));
  const state = { templateId, templateName, startedAt, exercises, currentExerciseIndex: 0 };
  db_setActiveWorkout(state);
  return state;
}

function getBestWeightForExercise(exerciseName) {
  return db_getLastBestWeight(exerciseName);
}

function saveActiveWorkoutState(state) {
  db_setActiveWorkout(state);
}

function finishWorkout(state) {
  // state = { templateId, templateName, startedAt, exercises }
  // exercises = [{ exercise_name, sets: [{ weight_kg, reps, logged }] }]
  const finishedAt = Date.now();
  const workoutId = db_saveWorkout(
    state.templateId || null,
    state.templateName || 'Free-form',
    state.startedAt,
    finishedAt
  );

  const allSets = [];
  state.exercises.forEach(ex => {
    ex.sets.forEach((s, i) => {
      if (s.logged && s.weight_kg !== '' && s.reps !== '') {
        const wkg = parseFloat(s.weight_kg) || 0;
        const reps = parseInt(s.reps) || 0;
        db_saveSet(workoutId, ex.exercise_name, i + 1, wkg, reps);
        allSets.push({ weight_kg: wkg, reps });
      }
    });
  });

  db_clearActiveWorkout();

  const duration = finishedAt - state.startedAt;
  const exerciseCount = state.exercises.filter(ex => ex.sets.some(s => s.logged)).length;
  const totalVolume = allSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);

  return {
    duration,
    exerciseCount,
    setCount: allSets.length,
    totalVolume: Math.round(totalVolume)
  };
}

function discardActiveWorkout() {
  db_clearActiveWorkout();
}
