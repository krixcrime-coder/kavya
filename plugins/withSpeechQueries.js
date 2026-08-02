/**
 * withSpeechQueries.js
 * --------------------
 * Adds a <queries> entry to AndroidManifest.xml so the app can see/bind to
 * the on-device speech recognition service on Android 11+ (package
 * visibility restrictions). Without this, @react-native-voice/voice can
 * silently fail to find a recognizer on some devices/OEMs.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withSpeechQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [{}];
    }
    const queries = manifest.queries[0];

    if (!queries.intent) {
      queries.intent = [];
    }

    queries.intent.push({
      action: [{ $: { "android:name": "android.speech.RecognitionService" } }],
    });

    const schemesNeedingQuery = ["whatsapp", "geo", "tel", "sms", "vnd.youtube", "spotify", "https"];
    for (const scheme of schemesNeedingQuery) {
      queries.intent.push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": scheme } }],
      });
    }

    queries.intent.push({
      action: [{ $: { "android:name": "android.intent.action.PICK" } }],
      data: [{ $: { "android:mimeType": "vnd.android.cursor.dir/contact" } }],
    });

    return config;
  });
};
