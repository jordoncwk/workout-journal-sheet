function doGet(e) {
  try {
    if (e.parameter.action === 'getAll') {
      const allTemplates = db_getTemplates();
      const allExercises = db_getAllTemplateExercises();
      const exByTemplate = {};
      allExercises.forEach(ex => {
        if (!exByTemplate[ex.template_id]) exByTemplate[ex.template_id] = [];
        exByTemplate[ex.template_id].push(ex);
      });
      const templates = allTemplates.map(t => ({
        id: String(t.id),
        name: t.name,
        updatedAt: t.created_at,
        exercises: (exByTemplate[t.id] || []).map(ex => ({
          exercise_name: ex.exercise_name,
          default_sets: ex.default_sets,
          default_reps: ex.default_reps,
          order: ex.position,
        })),
      }));

      const allWorkouts = db_getWorkouts();
      const allSets = db_getAllSets();
      const setsByWorkout = {};
      allSets.forEach(s => {
        if (!setsByWorkout[s.workout_id]) setsByWorkout[s.workout_id] = [];
        setsByWorkout[s.workout_id].push(s);
      });

      const exerciseNames = [...new Set(allSets.map(s => s.exercise_name))];
      const bests = exerciseNames.length > 0 ? db_getBestSetsForExercises(exerciseNames) : {};

      const workouts = allWorkouts.map(w => {
        const sets = setsByWorkout[w.id] || [];
        const exerciseMap = {};
        sets.forEach(s => {
          if (!exerciseMap[s.exercise_name]) exerciseMap[s.exercise_name] = [];
          exerciseMap[s.exercise_name].push({ weight_kg: s.weight_kg, reps: s.reps, logged: true });
        });
        return {
          id: String(w.id),
          templateId: w.template_id ? String(w.template_id) : null,
          templateName: w.name,
          startedAt: w.started_at,
          finishedAt: w.finished_at,
          updatedAt: w.finished_at,
          exercises: Object.entries(exerciseMap).map(([name, sets]) => ({ exercise_name: name, sets })),
        };
      });

      return jsonOrJsonp(e, { ok: true, templates, workouts });
    }
    return jsonOrJsonp(e, { ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOrJsonp(e, { ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'upsertWorkout') {
      const w = data.workout;
      // Find existing by id or insert new
      const histSheet = db_getSheet('_History');
      const rows = histSheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(w.id)) {
          // Already exists — skip (idempotent)
          found = true;
          break;
        }
      }
      if (!found) {
        const id = db_nextId(histSheet);
        histSheet.appendRow([id, w.templateId || '', w.templateName || 'Free-form', w.startedAt, w.finishedAt]);
        const workoutId = id;
        w.exercises.forEach(ex => {
          ex.sets.forEach((s, i) => {
            db_saveSet(workoutId, ex.exercise_name, i + 1, s.weight_kg, s.reps);
          });
        });
      }
      return json({ ok: true });
    }

    if (data.action === 'deleteWorkout') {
      deleteWorkout(Number(data.id) || data.id);
      return json({ ok: true });
    }

    if (data.action === 'upsertTemplate') {
      const t = data.template;
      const sheet = db_getSheet('_Templates');
      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(t.id)) {
          sheet.getRange(i + 1, 2).setValue(t.name);
          found = true;
          break;
        }
      }
      if (!found) {
        const id = db_nextId(sheet);
        sheet.appendRow([id, t.name, Date.now()]);
      }
      // Re-sync exercises (replace)
      const tplRows = sheet.getDataRange().getValues();
      const tplRow = tplRows.slice(1).find(r => String(r[0]) === String(t.id));
      if (tplRow) {
        db_updateTemplateExercises(tplRow[0], t.exercises);
      }
      return json({ ok: true });
    }

    if (data.action === 'deleteTemplate') {
      db_deleteTemplate(Number(data.id) || data.id);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOrJsonp(e, obj) {
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService
      .createTextOutput(`${cb}(${JSON.stringify(obj)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json(obj);
}
