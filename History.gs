function getHistoryData() {
  const workouts = db_getWorkouts(); // newest first
  return workouts.map(w => ({
    id: w.id,
    name: w.name,
    started_at: w.started_at,
    finished_at: w.finished_at,
    sets: db_getSetsForWorkout(w.id)
  }));
}