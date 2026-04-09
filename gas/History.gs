function getHistoryData() {
  const workouts = db_getWorkouts(); // newest first
  const allSets = db_getAllSets();
  const setsByWorkout = {};
  allSets.forEach(s => {
    if (!setsByWorkout[s.workout_id]) setsByWorkout[s.workout_id] = [];
    setsByWorkout[s.workout_id].push(s);
  });
  return workouts.map(w => ({
    id: w.id,
    name: w.name,
    started_at: w.started_at,
    finished_at: w.finished_at,
    sets: setsByWorkout[w.id] || []
  }));
}

function deleteWorkout(workoutId) {
  // Delete from _History
  const histSheet = db_getSheet('_History');
  const histData = histSheet.getDataRange().getValues();
  for (let i = histData.length - 1; i >= 1; i--) {
    if (histData[i][0] === workoutId) {
      histSheet.deleteRow(i + 1);
      break;
    }
  }
  // Delete all sets for this workout
  const setsSheet = db_getSheet('_Sets');
  const setsData = setsSheet.getDataRange().getValues();
  for (let i = setsData.length - 1; i >= 1; i--) {
    if (setsData[i][1] === workoutId) {
      setsSheet.deleteRow(i + 1);
    }
  }
}