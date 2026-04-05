function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const dataSheets = [
    { name: '_Templates',         headers: ['id', 'name', 'created_at'] },
    { name: '_TemplateExercises', headers: ['id', 'template_id', 'exercise_name', 'default_sets', 'default_reps', 'position'] },
    { name: '_History',           headers: ['id', 'template_id', 'name', 'started_at', 'finished_at'] },
    { name: '_Sets',              headers: ['id', 'workout_id', 'exercise_name', 'set_number', 'weight_kg', 'reps', 'logged_at'] },
    { name: '_ActiveWorkout',     headers: ['key', 'value'] },
  ];

  dataSheets.forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    sheet.hideSheet();
  });

  // Create Home sheet
  if (!ss.getSheetByName('Home')) {
    const home = ss.insertSheet('Home');
    ss.setActiveSheet(home);
    ss.moveActiveSheet(1);
    home.setTabColor('#4a86e8');
  }

  // Create Progress sheet
  if (!ss.getSheetByName('Progress')) {
    const progress = ss.insertSheet('Progress');
    ss.setActiveSheet(progress);
    ss.moveActiveSheet(2);
    progress.setTabColor('#6aa84f');
  }

  // Delete default Sheet1 if empty
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) ss.deleteSheet(sheet1);

  Logger.log('Setup complete! All sheets created.');
}

function styleHomeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Home');

  sheet.clear();
  sheet.setTabColor('#4a86e8');

  // Title
  sheet.getRange('A1').setValue('Workout Journal').setFontSize(24).setFontWeight('bold').setFontColor('#4a86e8');
  sheet.getRange('A2').setValue('Tap a button below to get started').setFontColor('#888').setFontSize(12);

  // Merge and size rows for visual spacing
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
  sheet.setRowHeight(1, 50);
  sheet.setRowHeight(2, 30);
  sheet.setRowHeight(4, 70);
  sheet.setRowHeight(6, 70);

  // Button labels (drawings will be added manually — see step 3)
  sheet.getRange('A4').setValue('▶  Start Workout').setFontSize(14).setFontWeight('bold')
    .setBackground('#4a86e8').setFontColor('white').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('B4').setValue('☰  Templates').setFontSize(14).setFontWeight('bold')
    .setBackground('#34a853').setFontColor('white').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('A6').setValue('📋  History').setFontSize(14).setFontWeight('bold')
    .setBackground('#f9a825').setFontColor('white').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange('B6').setValue('📈  Progress').setFontSize(14).setFontWeight('bold')
    .setBackground('#e53935').setFontColor('white').setHorizontalAlignment('center').setVerticalAlignment('middle');

  Logger.log('Home sheet styled.');
}

function seedDefaultTemplates() {
  const existing = db_getTemplates();
  if (existing.length > 0) {
    Logger.log('Templates already exist — skipping seed.');
    return;
  }

  const upperDayId = db_saveTemplate('Upper Day');
  db_updateTemplateExercises(upperDayId, [
    { exercise_name: 'Bench Press', default_sets: 4, default_reps: 8 },
    { exercise_name: 'Overhead Press', default_sets: 3, default_reps: 10 },
    { exercise_name: 'Barbell Row', default_sets: 4, default_reps: 8 },
    { exercise_name: 'Pull Up', default_sets: 3, default_reps: 8 },
    { exercise_name: 'Tricep Pushdown', default_sets: 3, default_reps: 12 },
    { exercise_name: 'Bicep Curl', default_sets: 3, default_reps: 12 },
  ]);

  const lowerDayId = db_saveTemplate('Lower Day');
  db_updateTemplateExercises(lowerDayId, [
    { exercise_name: 'Squat', default_sets: 4, default_reps: 6 },
    { exercise_name: 'Romanian Deadlift', default_sets: 3, default_reps: 10 },
    { exercise_name: 'Leg Press', default_sets: 3, default_reps: 12 },
    { exercise_name: 'Leg Curl', default_sets: 3, default_reps: 12 },
    { exercise_name: 'Calf Raise', default_sets: 4, default_reps: 15 },
  ]);

  Logger.log('Default templates created: Upper Day and Lower Day.');
}
