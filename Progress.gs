function getExercisePRs() {
  const names = db_getAllExerciseNames();
  return names.map(function(name) {
    const data = db_getProgressData(name);
    const pr = data.length > 0 ? Math.max.apply(null, data.map(function(d) { return d.maxWeight; })) : 0;
    return { name: name, pr: pr };
  }).sort(function(a, b) { return a.name.localeCompare(b.name); });
}

function refreshProgressChart() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Progress');

  // Read selected exercise from B2
  const exerciseName = sheet.getRange('B2').getValue();
  if (!exerciseName) {
    SpreadsheetApp.getUi().alert('Select an exercise from the dropdown in cell B2 first.');
    return;
  }

  const data = db_getProgressData(exerciseName);
  if (data.length === 0) {
    SpreadsheetApp.getUi().alert('No data found for: ' + exerciseName);
    return;
  }

  // Write data to a staging area starting at D1
  sheet.getRange('D1:E1').setValues([['Date', 'Max Weight (kg)']]);
  sheet.getRange('D1:E1').setFontWeight('bold');

  // Clear old staging data
  if (sheet.getLastRow() > 1) {
    const existingRows = sheet.getLastRow() - 1;
    if (existingRows > 0) sheet.getRange(2, 4, existingRows, 2).clearContent();
  }

  data.forEach((point, i) => {
    sheet.getRange(i + 2, 4).setValue(point.date);
    sheet.getRange(i + 2, 4).setNumberFormat('MM/dd/yyyy');
    sheet.getRange(i + 2, 5).setValue(point.maxWeight);
  });

  // Find PR (max weight overall)
  const maxWeight = Math.max(...data.map(d => d.maxWeight));

  // Remove existing charts
  sheet.getCharts().forEach(c => sheet.removeChart(c));

  // Build chart
  const dataRange = sheet.getRange(1, 4, data.length + 1, 2);
  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange)
    .setPosition(4, 1, 0, 0)
    .setNumHeaders(1)
    .setOption('title', exerciseName + ' — Max Weight per Session')
    .setOption('hAxis', { title: 'Date' })
    .setOption('vAxis', { title: 'Weight (kg)' })
    .setOption('legend', { position: 'none' })
    .setOption('width', 600)
    .setOption('height', 350)
    .build();

  sheet.insertChart(chart);

  // Annotate PR in cell F1
  sheet.getRange('F1').setValue('PR: ' + maxWeight + ' kg');
  sheet.getRange('F1').setFontWeight('bold').setFontColor('#e53935');
}

function setupProgressSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Progress');

  sheet.getRange('A2').setValue('Exercise:');
  sheet.getRange('A2').setFontWeight('bold');

  // Populate B2 dropdown with all logged exercise names
  const names = db_getAllExerciseNames();
  if (names.length > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(names, true)
      .build();
    sheet.getRange('B2').setDataValidation(rule);
    sheet.getRange('B2').setValue(names[0]);
  }

  sheet.getRange('A1').setValue('Select an exercise and use Workout → Refresh Progress Chart');
  sheet.getRange('A1').setFontColor('#888');
}
