package com.example.touchlock

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.DisplayMetrics
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility gestures are injected at the system input level, so they still work
 * even while our overlay (OverlayController) is blocking normal touches.
 * This lets "up" / "down" voice commands scroll a reel/feed while the lock is active.
 */
class TouchLockAccessibilityService : AccessibilityService() {

    enum class Direction { UP, DOWN }

    companion object {
        var instance: TouchLockAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not used - we only need this service for dispatching gestures.
    }

    override fun onInterrupt() {}

    /**
     * Performs a full-screen swipe to move to the next/previous reel-style content.
     * DOWN command -> content moves up the screen (like scrolling to next reel):
     *   swipe finger from bottom to top.
     * UP command -> content moves down the screen (previous reel):
     *   swipe finger from top to bottom.
     */
    fun performScroll(direction: Direction) {
        val metrics: DisplayMetrics = resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels

        val startX = width / 2f
        val startY: Float
        val endY: Float

        if (direction == Direction.DOWN) {
            // next reel: swipe up
            startY = height * 0.75f
            endY = height * 0.25f
        } else {
            // previous reel: swipe down
            startY = height * 0.25f
            endY = height * 0.75f
        }

        val path = Path()
        path.moveTo(startX, startY)
        path.lineTo(startX, endY)

        val strokeDescription = GestureDescription.StrokeDescription(path, 0, 300)
        val gestureBuilder = GestureDescription.Builder()
        gestureBuilder.addStroke(strokeDescription)

        dispatchGesture(gestureBuilder.build(), null, null)
    }
}
