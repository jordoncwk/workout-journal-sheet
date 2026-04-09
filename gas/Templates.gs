function getTemplatesData() {
  const allTemplates = db_getTemplates();
  const allExercises = db_getAllTemplateExercises();
  const exByTemplate = {};
  allExercises.forEach(ex => {
    if (!exByTemplate[ex.template_id]) exByTemplate[ex.template_id] = [];
    exByTemplate[ex.template_id].push(ex);
  });
  return allTemplates.map(t => ({
    id: t.id,
    name: t.name,
    exercises: exByTemplate[t.id] || []
  }));
}

function saveTemplate(templateId, name, exercises) {
  // exercises = [{ exercise_name, default_sets, default_reps }]
  if (templateId === null) {
    templateId = db_saveTemplate(name);
  } else {
    // Update name: delete and re-create to keep it simple
    const sheet = db_getSheet('_Templates');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateId) {
        sheet.getRange(i + 1, 2).setValue(name);
        break;
      }
    }
  }
  db_updateTemplateExercises(templateId, exercises);
  return getTemplatesData();
}

function deleteTemplateById(templateId) {
  db_deleteTemplate(templateId);
  return getTemplatesData();
}
