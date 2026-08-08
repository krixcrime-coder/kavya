package com.example.touchlock

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.app.NotificationCompat

/**
 * Runs continuously in the foreground, restarting speech recognition after every
 * result / error, listening for simple keywords: on, off, up, down (also lock/unlock).
 *
 * NOTE: This uses Android's on-device/Google SpeechRecognizer, which listens in short
 * bursts (not a true always-on wake-word engine). It restarts itself automatically so
 * from the user's point of view it behaves like continuous listening, with a brief
 * pause between phrases.
 */
class VoiceService : Service() {

    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var listening = false

    private val recognizerIntent by lazy {
        Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        }
    }

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification()
        mainHandler.post { setupRecognizer() }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        listening = false
        recognizer?.destroy()
        recognizer = null
        super.onDestroy()
    }

    private fun setupRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            return
        }
        recognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: android.os.Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}

                override fun onError(error: Int) {
                    restartListening()
                }

                override fun onResults(results: android.os.Bundle?) {
                    handleResults(results)
                    restartListening()
                }

                override fun onPartialResults(partialResults: android.os.Bundle?) {
                    handleResults(partialResults)
                }

                override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
            })
        }
        startListening()
    }

    private fun startListening() {
        if (listening) return
        listening = true
        recognizer?.startListening(recognizerIntent)
    }

    private fun restartListening() {
        listening = false
        // Small delay avoids a tight restart loop that can spam errors.
        mainHandler.postDelayed({
            startListening()
        }, 400)
    }

    private fun handleResults(bundle: android.os.Bundle?) {
        val matches = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            ?: return
        val text = matches.joinToString(" ").lowercase()
        processCommand(text)
    }

    private fun processCommand(text: String) {
        when {
            containsWord(text, "on") || text.contains("lock") -> {
                OverlayController.showLock(applicationContext)
            }
            containsWord(text, "off") || text.contains("unlock") -> {
                OverlayController.hideLock(applicationContext)
            }
            containsWord(text, "up") -> {
                TouchLockAccessibilityService.instance
                    ?.performScroll(TouchLockAccessibilityService.Direction.UP)
            }
            containsWord(text, "down") -> {
                TouchLockAccessibilityService.instance
                    ?.performScroll(TouchLockAccessibilityService.Direction.DOWN)
            }
        }
    }

    private fun containsWord(text: String, word: String): Boolean {
        return Regex("\\b$word\\b").containsMatchIn(text)
    }

    private fun startForegroundNotification() {
        val channelId = "touchlock_voice_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "TouchLock Voice Assistant",
                NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("TouchLock voice assistant chal raha hai")
            .setContentText("Bolen: on / off / up / down")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
    }
}
