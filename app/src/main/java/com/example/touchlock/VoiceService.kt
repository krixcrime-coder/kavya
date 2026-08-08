package com.example.touchlock

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Runs continuously in the foreground, restarting speech recognition after every
 * result / error, listening for command letters: A, B, C, D.
 *
 * NOTE: This uses Android's on-device/Google SpeechRecognizer, which listens in short
 * bursts (not a true always-on wake-word engine). It restarts itself automatically so
 * from the user's point of view it behaves like continuous listening, with a brief
 * pause between phrases.
 *
 * DEBUG: The notification text updates live with the last heard text / last error,
 * so you can pull down the notification shade to see exactly what the recognizer is
 * doing without needing logcat.
 */
class VoiceService : Service() {

    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var listening = false
    private val channelId = "touchlock_voice_channel"

    private val recognizerIntent by lazy {
        Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        }
    }

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification("Shuru ho raha hai...")

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            updateNotification("❌ Microphone permission NAHI hai! App kholkar permission dein.")
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            updateNotification("❌ Device par speech recognition available nahi hai (Google app check karein).")
            return
        }

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
        recognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: android.os.Bundle?) {
                    updateNotification("🎤 Sun raha hoon... (A/B/C/D bolen)")
                }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}

                override fun onError(error: Int) {
                    updateNotification("⚠️ Error: ${errorName(error)} — dobara try ho raha hai...")
                    restartListening()
                }

                override fun onResults(results: android.os.Bundle?) {
                    val heard = extractText(results)
                    if (heard.isNotBlank()) {
                        updateNotification("✅ Suna: \"$heard\"")
                    }
                    handleResults(results)
                    restartListening()
                }

                override fun onPartialResults(partialResults: android.os.Bundle?) {
                    val heard = extractText(partialResults)
                    if (heard.isNotBlank()) {
                        updateNotification("👂 Partial: \"$heard\"")
                    }
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

    private fun extractText(bundle: android.os.Bundle?): String {
        val matches = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            ?: return ""
        return matches.joinToString(" | ")
    }

    private fun handleResults(bundle: android.os.Bundle?) {
        val matches = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            ?: return
        val text = matches.joinToString(" ").lowercase()
        processCommand(text)
    }

    /**
     * Command letters (easier for the recognizer to catch reliably than full words):
     *   A -> lock ON
     *   B -> lock OFF
     *   C -> scroll UP
     *   D -> scroll DOWN
     * We also keep the old full words as a fallback in case the recognizer returns them.
     */
    private fun processCommand(text: String) {
        when {
            containsLetterOrWord(text, "a", listOf("on", "lock", "hey", "e")) -> {
                OverlayController.showLock(applicationContext)
                updateNotification("🔒 LOCK ON")
            }
            containsLetterOrWord(text, "b", listOf("off", "unlock", "bee", "be")) -> {
                OverlayController.hideLock(applicationContext)
                updateNotification("🔓 LOCK OFF")
            }
            containsLetterOrWord(text, "c", listOf("up", "see", "sea")) -> {
                TouchLockAccessibilityService.instance
                    ?.performScroll(TouchLockAccessibilityService.Direction.UP)
                if (TouchLockAccessibilityService.instance == null) {
                    updateNotification("⚠️ 'C' suna, par Accessibility service ON nahi hai!")
                }
            }
            containsLetterOrWord(text, "d", listOf("down", "dee", "de")) -> {
                TouchLockAccessibilityService.instance
                    ?.performScroll(TouchLockAccessibilityService.Direction.DOWN)
                if (TouchLockAccessibilityService.instance == null) {
                    updateNotification("⚠️ 'D' suna, par Accessibility service ON nahi hai!")
                }
            }
        }
    }

    private fun containsLetterOrWord(text: String, letter: String, altWords: List<String>): Boolean {
        val cleaned = text.trim()
        if (Regex("\\b$letter\\b").containsMatchIn(cleaned)) return true
        for (w in altWords) {
            if (Regex("\\b$w\\b").containsMatchIn(cleaned)) return true
        }
        return false
    }

    private fun errorName(code: Int): String = when (code) {
        SpeechRecognizer.ERROR_AUDIO -> "AUDIO error"
        SpeechRecognizer.ERROR_CLIENT -> "CLIENT error"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "PERMISSION missing"
        SpeechRecognizer.ERROR_NETWORK -> "NETWORK error (internet check karein)"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "NETWORK TIMEOUT"
        SpeechRecognizer.ERROR_NO_MATCH -> "kuch samajh nahi aaya"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RECOGNIZER busy"
        SpeechRecognizer.ERROR_SERVER -> "SERVER error"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "kuch bola nahi gaya (timeout)"
        else -> "code $code"
    }

    private fun startForegroundNotification(initialText: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "TouchLock Voice Assistant",
                NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("TouchLock: A(on) B(off) C(up) D(down)")
            .setContentText(initialText)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
    }

    private fun updateNotification(text: String) {
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("TouchLock: A(on) B(off) C(up) D(down)")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()
        val nm = getSystemService(NotificationManager::class.java)
        nm.notify(1, notification)
    }
}
