function runAllDatabaseTests() {
  testTemplates();
  testTemplateExercises();
  testWorkoutsAndSets();
  testActiveWorkout();
  testLastBestWeight();
  Logger.log('=== ALL TESTS PASSED ===');
}

function testTemplates() {
  // Clear test data
  db_getSheet('_Templates').clearContents();
  db_getSheet('_Templates').appendRow(['id', 'name', 'created_at']);

  const id = db_saveTemplate('Upper Day');
  assertEqual(typeof id, 'number', 'saveTemplate returns number id');

  const templates = db_getTemplates();
  assertEqual(templates.length, 1, 'getTemplates returns 1 template');
  assertEqual(templates[0].name, 'Upper Day', 'template name matches');

  db_saveTemplate('Lower Day');
  assertEqual(db_getTemplates().length, 2, 'second template saved');

  db_deleteTemplate(id);
  const remaining = db_getTemplates();
  assertEqual(remaining.length, 1, 'template deleted');
  assertEqual(remaining[0].name, 'Lower Day', 'correct template remains');

  Logger.log('testTemplates: PASS');
}

function testTemplateExercises() {
  db_getSheet('_Templates').clearContents();
  db_getSheet('_Templates').appendRow(['id', 'name', 'created_at']);
  db_getSheet('_TemplateExercises').clearContents();
  db_getSheet('_TemplateExercises').appendRow(['id', 'template_id', 'exercise_name', 'default_sets', 'default_reps', 'position']);

  const templateId = db_saveTemplate('Push Day');

  db_updateTemplateExercises(templateId, [
    { exercise_name: 'Bench Press', default_sets: 4, default_reps: 8 },
    { exercise_name: 'OHP', default_sets: 3, default_reps: 10 },
  ]);

  const exercises = db_getTemplateExercises(templateId);
  assertEqual(exercises.length, 2, 'two exercises saved');
  assertEqual(exercises[0].exercise_name, 'Bench Press', 'first exercise correct');
  assertEqual(exercises[0].position, 0, 'position starts at 0');
  assertEqual(exercises[1].position, 1, 'second position is 1');

  // Update (replace)
  db_updateTemplateExercises(templateId, [
    { exercise_name: 'OHP', default_sets: 3, default_reps: 10 },
  ]);
  assertEqual(db_getTemplateExercises(templateId).length, 1, 'exercises replaced');

  Logger.log('testTemplateExercises: PASS');
}

function testWorkoutsAndSets() {
  db_getSheet('_History').clearContents();
  db_getSheet('_History').appendRow(['id', 'template_id', 'name', 'started_at', 'finished_at']);
  db_getSheet('_Sets').clearContents();
  db_getSheet('_Sets').appendRow(['id', 'workout_id', 'exercise_name', 'set_number', 'weight_kg', 'reps', 'logged_at']);

  const workoutId = db_saveWorkout(null, 'Free-form', Date.now() - 3600000, Date.now());
  assertEqual(typeof workoutId, 'number', 'saveWorkout returns id');

  db_saveSet(workoutId, 'Squat', 1, 100, 5);
  db_saveSet(workoutId, 'Squat', 2, 100, 5);
  db_saveSet(workoutId, 'Deadlift', 1, 120, 3);

  const sets = db_getSetsForWorkout(workoutId);
  assertEqual(sets.length, 3, 'three sets saved');

  const workouts = db_getWorkouts();
  assertEqual(workouts.length, 1, 'one workout in history');

  Logger.log('testWorkoutsAndSets: PASS');
}

function testActiveWorkout() {
  db_clearActiveWorkout();
  assertEqual(db_getActiveWorkout(), null, 'no active workout initially');

  const state = { templateId: 1, templateName: 'Upper Day', startedAt: Date.now(), exercises: [] };
  db_setActiveWorkout(state);

  const retrieved = db_getActiveWorkout();
  assertEqual(retrieved.templateName, 'Upper Day', 'active workout persisted');

  db_clearActiveWorkout();
  assertEqual(db_getActiveWorkout(), null, 'active workout cleared');

  Logger.log('testActiveWorkout: PASS');
}

function testLastBestWeight() {
  db_getSheet('_History').clearContents();
  db_getSheet('_History').appendRow(['id', 'template_id', 'name', 'started_at', 'finished_at']);
  db_getSheet('_Sets').clearContents();
  db_getSheet('_Sets').appendRow(['id', 'workout_id', 'exercise_name', 'set_number', 'weight_kg', 'reps', 'logged_at']);

  assertEqual(db_getLastBestWeight('Bench Press'), null, 'no best weight when no data');

  const w1 = db_saveWorkout(null, 'Day 1', Date.now() - 7200000, Date.now() - 3600000);
  db_saveSet(w1, 'Bench Press', 1, 80, 8);
  db_saveSet(w1, 'Bench Press', 2, 85, 6);

  const w2 = db_saveWorkout(null, 'Day 2', Date.now() - 1800000, Date.now() - 600000);
  db_saveSet(w2, 'Bench Press', 1, 90, 5);

  // Best weight should be from most recent workout (w2 = 90)
  const best = db_getLastBestWeight('Bench Press');
  assertEqual(best, 90, 'last best weight from most recent workout');

  Logger.log('testLastBestWeight: PASS');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
