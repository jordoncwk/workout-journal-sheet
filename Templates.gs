function getTemplatesData() {
  const templates = db_getTemplates();
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    exercises: db_getTemplateExercises(t.id)
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
