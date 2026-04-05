// ─── Helpers ────────────────────────────────────────────────────────────────

function db_getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function db_nextId(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 1;
  const ids = data.slice(1).map(r => r[0]).filter(id => id !== '' && id !== null);
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

function db_rowsToObjects(headers, rows) {
  return rows
    .filter(r => r[0] !== '' && r[0] !== null)
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i]; });
      return obj;
    });
}

// ─── Templates ───────────────────────────────────────────────────────────────

function db_getTemplates() {
  const sheet = db_getSheet('_Templates');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return db_rowsToObjects(['id', 'name', 'created_at'], data.slice(1));
}

function db_saveTemplate(name) {
  const sheet = db_getSheet('_Templates');
  const id = db_nextId(sheet);
  sheet.appendRow([id, name, Date.now()]);
  return id;
}

function db_deleteTemplate(templateId) {
  // Delete template row
  const sheet = db_getSheet('_Templates');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === templateId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  // Delete all exercises for this template
  db_deleteTemplateExercises(templateId);
}

// ─── Template Exercises ───────────────────────────────────────────────────────

function db_getTemplateExercises(templateId) {
  const sheet = db_getSheet('_TemplateExercises');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return db_rowsToObjects(
    ['id', 'template_id', 'exercise_name', 'default_sets', 'default_reps', 'position'],
    data.slice(1)
  )
    .filter(r => r.template_id === templateId)
    .sort((a, b) => a.position - b.position);
}

function db_updateTemplateExercises(templateId, exercises) {
  // exercises = [{ exercise_name, default_sets, default_reps }] in display order
  db_deleteTemplateExercises(templateId);
  const sheet = db_getSheet('_TemplateExercises');
  exercises.forEach((ex, index) => {
    const id = db_nextId(sheet);
    sheet.appendRow([id, templateId, ex.exercise_name, ex.default_sets, ex.default_reps, index]);
  });
}

function db_deleteTemplateExercises(templateId) {
  const sheet = db_getSheet('_TemplateExercises');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === templateId) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ─── Workouts (History) ───────────────────────────────────────────────────────

function db_saveWorkout(templateId, name, startedAt, finishedAt) {
  const sheet = db_getSheet('_History');
  const id = db_nextId(sheet);
  sheet.appendRow([id, templateId === null ? '' : templateId, name, startedAt, finishedAt]);
  return id;
}

function db_getWorkouts() {
  const sheet = db_getSheet('_History');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return db_rowsToObjects(['id', 'template_id', 'name', 'started_at', 'finished_at'], data.slice(1))
    .reverse(); // newest first
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

function db_saveSet(workoutId, exerciseName, setNumber, weightKg, reps) {
  const sheet = db_getSheet('_Sets');
  const id = db_nextId(sheet);
  sheet.appendRow([id, workoutId, exerciseName, setNumber, weightKg, reps, Date.now()]);
  return id;
}

function db_getSetsForWorkout(workoutId) {
  const sheet = db_getSheet('_Sets');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return db_rowsToObjects(
    ['id', 'workout_id', 'exercise_name', 'set_number', 'weight_kg', 'reps', 'logged_at'],
    data.slice(1)
  ).filter(r => r.workout_id === workoutId);
}

function db_getLastBestWeight(exerciseName) {
  const setsSheet = db_getSheet('_Sets');
  const historySheet = db_getSheet('_History');

  const sets = setsSheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] !== '' && r[2] === exerciseName)
    .map(r => ({ workout_id: r[1], weight_kg: r[4], logged_at: r[6] }));

  if (sets.length === 0) return null;

  // Find the most recently logged workout that includes this exercise
  const mostRecentLoggedAt = Math.max(...sets.map(s => s.logged_at));
  const mostRecentWorkoutId = sets.find(s => s.logged_at === mostRecentLoggedAt).workout_id;
  const workoutSets = sets.filter(s => s.workout_id === mostRecentWorkoutId);

  return Math.max(...workoutSets.map(s => s.weight_kg));
}

function db_getAllExerciseNames() {
  const sheet = db_getSheet('_Sets');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const names = data.slice(1)
    .filter(r => r[0] !== '')
    .map(r => r[2]);
  return [...new Set(names)].sort();
}

function db_getProgressData(exerciseName) {
  const historySheet = db_getSheet('_History');
  const setsSheet = db_getSheet('_Sets');

  const workouts = historySheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] !== '')
    .map(r => ({ id: r[0], finished_at: r[4] }));

  const sets = setsSheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] !== '' && r[2] === exerciseName)
    .map(r => ({ workout_id: r[1], weight_kg: r[4] }));

  const result = [];
  workouts.forEach(w => {
    const workoutSets = sets.filter(s => s.workout_id === w.id);
    if (workoutSets.length > 0) {
      const maxWeight = Math.max(...workoutSets.map(s => s.weight_kg));
      result.push({ date: new Date(w.finished_at), maxWeight });
    }
  });

  return result.sort((a, b) => a.date - b.date);
}

// ─── Active Workout ────────────────────────────────────────────────────────────

function db_setActiveWorkout(data) {
  const sheet = db_getSheet('_ActiveWorkout');
  // Clear data rows only (keep header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  sheet.appendRow(['data', JSON.stringify(data)]);
}

function db_getActiveWorkout() {
  const sheet = db_getSheet('_ActiveWorkout');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  const row = data.find(r => r[0] === 'data');
  if (!row || !row[1]) return null;
  try {
    return JSON.parse(row[1]);
  } catch (e) {
    return null;
  }
}

function db_clearActiveWorkout() {
  const sheet = db_getSheet('_ActiveWorkout');
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
}
