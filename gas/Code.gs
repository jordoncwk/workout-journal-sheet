function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Workout Journal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Workout')
    .addItem('Start Workout', 'openWorkoutDialog')
    .addItem('Templates', 'openTemplatesDialog')
    .addItem('History', 'openHistoryDialog')
    .addSeparator()
    .addItem('Refresh Progress Chart', 'refreshProgressChart')
    .addSeparator()
    .addItem('Setup Sheets', 'setupSheets')
    .addToUi();
}

function openWorkoutDialog() {
  const html = HtmlService.createHtmlOutputFromFile('WorkoutDialog')
    .setWidth(800)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Workout');
}

function openTemplatesDialog() {
  const html = HtmlService.createHtmlOutputFromFile('TemplatesDialog')
    .setWidth(800)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Templates');
}

function openHistoryDialog() {
  const html = HtmlService.createHtmlOutputFromFile('HistoryDialog')
    .setWidth(800)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'History');
}
