import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

const LOCATION_TASK_NAME = "background-location-task";

export async function startBackgroundLocationTracking() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return false;

  const bgStatus = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus.status !== "granted") return false;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60000, // 60 seconds
    distanceInterval: 100, // 100 meters
  });

  return true;
}

export async function stopBackgroundLocationTracking() {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const lastLocation = locations[locations.length - 1];
    // Optionally: save to device storage, send to server, etc.
    console.log("Background location:", lastLocation);
  }
});
