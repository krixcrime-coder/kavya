package com.example.touchlock

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.WindowManager

/**
 * Singleton that adds/removes the full-screen lock overlay.
 * When active, the overlay consumes all touches (blocking ghost-touch / accidental taps)
 * and shows a brief "tick" marker wherever a touch happened, plus a small lock icon.
 */
object OverlayController {

    private var lockView: LockOverlayView? = null
    private var windowManager: WindowManager? = null

    val isLocked: Boolean
        get() = lockView != null

    fun showLock(context: Context) {
        if (lockView != null) return // already shown

        val wm = context.applicationContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        windowManager = wm

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            overlayType,
            // NOT_FOCUSABLE so it doesn't steal keyboard/system focus,
            // deliberately NOT including FLAG_NOT_TOUCHABLE so touches ARE captured/blocked here.
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        val view = LockOverlayView(context.applicationContext)
        lockView = view
        wm.addView(view, params)
    }

    fun hideLock(context: Context) {
        val wm = windowManager ?: context.applicationContext
            .getSystemService(Context.WINDOW_SERVICE) as WindowManager
        lockView?.let {
            wm.removeView(it)
        }
        lockView = null
    }
}
