const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const SERVICE_SOURCE = `package com.kavya.assistant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.app.NotificationCompat

class KavyaVoiceService : Service(), RecognitionListener {
  private var recognizer: SpeechRecognizer? = null
  private val channelId = "kavya_voice"
  private var isServiceDestroyed = false

  override fun onCreate() {
    super.onCreate()
    createChannel()
    val openIntent = Intent(this, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
      this, 0, openIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val notification = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setContentTitle("Kavya listening")
      .setContentText("“Hey Kavya” bolo to assistant activate hoga")
      .setOngoing(true)
      .setContentIntent(pendingIntent)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(7001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
    } else {
      startForeground(7001, notification)
    }
    startRecognizer()
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, "Kavya voice assistant", NotificationManager.IMPORTANCE_LOW)
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  private fun startRecognizer() {
    if (!SpeechRecognizer.isRecognitionAvailable(this)) {
      stopSelf()
      return
    }
    recognizer?.destroy()
    recognizer = SpeechRecognizer.createSpeechRecognizer(this).also {
      it.setRecognitionListener(this)
      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
      }
      try { it.startListening(intent) } catch (_: Exception) { restartRecognizer() }
    }
  }

  private fun restartRecognizer() {
    android.os.Handler(mainLooper).postDelayed({ if (!isServiceDestroyed) startRecognizer() }, 500)
  }

  private fun handleTranscript(transcript: String) {
    val normalized = transcript.trim().lowercase()
    val wakeIndex = normalized.indexOf("kavya")
    if (wakeIndex < 0) return
    val command = transcript.substring((wakeIndex + "kavya".length).coerceAtMost(transcript.length))
      .trim().trimStart(',', '.', ':', '!', '?', '-')
    val launchIntent = Intent(this, MainActivity::class.java).apply {
      action = Intent.ACTION_VIEW
      data = Uri.parse("kavya-assistant://wake?text=\${Uri.encode(command)}")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    try { startActivity(launchIntent) } catch (_: Exception) {}
  }

  override fun onResults(results: Bundle?) {
    results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let(::handleTranscript)
    restartRecognizer()
  }
  override fun onError(error: Int) { restartRecognizer() }
  override fun onDestroy() { isServiceDestroyed = true; recognizer?.destroy(); recognizer = null; super.onDestroy() }
  override fun onBind(intent: Intent?): IBinder? = null
  override fun onReadyForSpeech(params: Bundle?) {}
  override fun onBeginningOfSpeech() {}
  override fun onRmsChanged(rmsdB: Float) {}
  override fun onBufferReceived(buffer: ByteArray?) {}
  override fun onEndOfSpeech() {}
  override fun onPartialResults(partialResults: Bundle?) {}
  override fun onEvent(eventType: Int, params: Bundle?) {}
}
`;

module.exports = function withKavyaBackgroundVoice(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const permissions = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
    ];
    manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
    for (const permission of permissions) {
      if (!manifest.manifest['uses-permission'].some((item) => item?.$?.['android:name'] === permission)) {
        manifest.manifest['uses-permission'].push({ $: { 'android:name': permission } });
      }
    }
    const application = manifest.manifest.application?.[0];
    if (application) {
      application.service = application.service || [];
      if (!application.service.some((item) => item?.$?.['android:name'] === '.KavyaVoiceService')) {
        application.service.push({
          $: {
            'android:name': '.KavyaVoiceService',
            'android:enabled': 'true',
            'android:exported': 'false',
            'android:foregroundServiceType': 'microphone',
          },
        });
      }
    }
    return config;
  });

  return withDangerousMod(config, ['android', async (config) => {
    const androidRoot = config.modRequest.platformProjectRoot;
    const javaRoot = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'kavya', 'assistant');
    fs.mkdirSync(javaRoot, { recursive: true });
    fs.writeFileSync(path.join(javaRoot, 'KavyaVoiceService.kt'), SERVICE_SOURCE);

    const activityPath = path.join(javaRoot, 'MainActivity.kt');
    let activity = fs.readFileSync(activityPath, 'utf8');
    if (!activity.includes('KAVYA_BACKGROUND_VOICE')) {
      activity = activity.replace('import android.os.Bundle', 'import android.os.Bundle\nimport android.content.Intent\nimport android.content.pm.PackageManager');
      activity = activity.replace(
        '    super.onCreate(null)',
        '    super.onCreate(null)\n    // KAVYA_BACKGROUND_VOICE: service starts when the app moves to background.'
      );
      activity = activity.replace(
        '\n  /**\n   * Returns the name',
        '\n  override fun onResume() {\n    super.onResume()\n    stopService(Intent(this, KavyaVoiceService::class.java))\n  }\n\n  override fun onPause() {\n    super.onPause()\n    if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {\n      try { startForegroundService(Intent(this, KavyaVoiceService::class.java)) } catch (_: Exception) {}\n    }\n  }\n\n  /**\n   * Returns the name'
      );
      fs.writeFileSync(activityPath, activity);
    }
    return config;
  }]);
};