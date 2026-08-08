package com.example.touchlock

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View

/**
 * Full-screen transparent view.
 * - Consumes every touch (returns true) so nothing underneath receives it -> blocks ghost touches.
 * - Draws a small lock icon in a corner so the user knows the lock is active.
 * - Draws a short-lived "tick" dot at the touch location so the user can see where a
 *   ghost touch (or their own touch) happened, without it actually registering as a click.
 */
class LockOverlayView(context: Context) : View(context) {

    private data class Tick(val x: Float, val y: Float, val bornAt: Long)

    private val ticks = mutableListOf<Tick>()
    private val handler = Handler(Looper.getMainLooper())

    private val tickPaint = Paint().apply {
        color = Color.parseColor("#FF5252")
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val lockIconPaint = Paint().apply {
        color = Color.parseColor("#4CAF50")
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val lockIconTextPaint = Paint().apply {
        color = Color.WHITE
        textSize = 24f
        isAntiAlias = true
        textAlign = Paint.Align.CENTER
    }

    private val tickLifetimeMs = 600L

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_DOWN) {
            addTick(event.x, event.y)
        }
        // Consuming the event (returning true) prevents it from reaching apps below.
        return true
    }

    private fun addTick(x: Float, y: Float) {
        ticks.add(Tick(x, y, System.currentTimeMillis()))
        invalidate()
        handler.postDelayed({
            ticks.removeAll { System.currentTimeMillis() - it.bornAt > tickLifetimeMs }
            invalidate()
        }, tickLifetimeMs + 50)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // Draw touch ticks (fading circles marking where a touch/ghost-touch happened).
        val now = System.currentTimeMillis()
        for (t in ticks) {
            val age = now - t.bornAt
            if (age > tickLifetimeMs) continue
            val fraction = 1f - (age.toFloat() / tickLifetimeMs)
            tickPaint.alpha = (fraction * 255).toInt().coerceIn(0, 255)
            canvas.drawCircle(t.x, t.y, 18f + (1f - fraction) * 12f, tickPaint)
        }

        // Draw a small lock badge, top-right corner, so the user knows the lock is ON.
        val badgeRadius = 28f
        val cx = width - 50f
        val cy = 90f
        lockIconPaint.alpha = 220
        canvas.drawCircle(cx, cy, badgeRadius, lockIconPaint)
        canvas.drawText("🔒", cx, cy + 8f, lockIconTextPaint)
    }
}
