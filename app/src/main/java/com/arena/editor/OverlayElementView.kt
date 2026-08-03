package com.arena.editor

import android.content.Context
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat

enum class ElementType { WATERMARK, CAPTION, STICKER }

/**
 * A draggable, resizable, lockable overlay placed on top of the video stage.
 * Text elements (watermark / caption) show a TextView.
 * Sticker elements show an ImageView with a real vector icon (no emoji).
 */
class OverlayElementView(
    context: Context,
    val type: ElementType
) : FrameLayout(context) {

    val contentText: TextView?
    val contentIcon: ImageView?
    private val handle: View

    var locked: Boolean = false
        set(value) {
            field = value
            refreshChrome()
        }

    var isSelectedElement: Boolean = false
        set(value) {
            field = value
            refreshChrome()
        }

    /** Called whenever the user taps this element (used to select it). */
    var onTap: (() -> Unit)? = null

    /** Called continuously while resizing via the corner handle. Value is the new size. */
    var onSizeChanging: ((Float) -> Unit)? = null

    private var textSizeSp: Float = 22f
    private var iconSizeDp: Float = 40f

    private var lastRawX = 0f
    private var lastRawY = 0f
    private var handleLastRawY = 0f
    private var handleStartSize = 0f

    init {
        setPadding(dp(6), dp(4), dp(6), dp(4))

        if (type == ElementType.STICKER) {
            contentText = null
            contentIcon = ImageView(context).apply {
                layoutParams = LayoutParams(dp(iconSizeDp.toInt()), dp(iconSizeDp.toInt()))
            }
            addView(contentIcon)
        } else {
            contentIcon = null
            contentText = TextView(context).apply {
                setTextColor(ContextCompat.getColor(context, R.color.text_main))
                textSize = textSizeSp
                setTypeface(typeface, android.graphics.Typeface.BOLD)
                setShadowLayer(6f, 0f, 1f, 0x99000000.toInt())
            }
            addView(contentText)
        }

        handle = View(context).apply {
            background = ContextCompat.getDrawable(context, R.drawable.handle_dot)
            visibility = GONE
        }
        val hp = LayoutParams(dp(18), dp(18))
        hp.gravity = Gravity.BOTTOM or Gravity.END
        addView(handle, hp)

        refreshChrome()
        setupTouch()
    }

    fun setText(text: String) {
        contentText?.text = text
    }

    fun setIcon(resId: Int) {
        contentIcon?.setImageResource(resId)
    }

    fun setElementSize(size: Float) {
        if (type == ElementType.STICKER) {
            iconSizeDp = size
            contentIcon?.layoutParams = LayoutParams(dp(size.toInt()), dp(size.toInt()))
            contentIcon?.requestLayout()
        } else {
            textSizeSp = size
            contentText?.textSize = size
        }
    }

    fun getElementSize(): Float = if (type == ElementType.STICKER) iconSizeDp else textSizeSp

    private fun refreshChrome() {
        handle.visibility = if (isSelectedElement && !locked) VISIBLE else GONE
        background = when {
            locked -> ContextCompat.getDrawable(context, R.drawable.overlay_locked_border)
            isSelectedElement -> ContextCompat.getDrawable(context, R.drawable.overlay_selected_border)
            else -> null
        }
    }

    private fun setupTouch() {
        setOnTouchListener { _, event ->
            if (locked) {
                if (event.actionMasked == MotionEvent.ACTION_UP) onTap?.invoke()
                return@setOnTouchListener true
            }
            val parentView = parent as? View
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    lastRawX = event.rawX
                    lastRawY = event.rawY
                    onTap?.invoke()
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - lastRawX
                    val dy = event.rawY - lastRawY
                    lastRawX = event.rawX
                    lastRawY = event.rawY
                    var newX = x + dx
                    var newY = y + dy
                    if (parentView != null) {
                        newX = newX.coerceIn(0f, (parentView.width - width).coerceAtLeast(0).toFloat())
                        newY = newY.coerceIn(0f, (parentView.height - height).coerceAtLeast(0).toFloat())
                    }
                    x = newX
                    y = newY
                    true
                }
                else -> true
            }
        }

        handle.setOnTouchListener { _, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    handleLastRawY = event.rawY
                    handleStartSize = getElementSize()
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dy = event.rawY - handleLastRawY
                    val minSize = if (type == ElementType.STICKER) 20f else 10f
                    val maxSize = if (type == ElementType.STICKER) 96f else 72f
                    val newSize = (handleStartSize + dy * 0.35f).coerceIn(minSize, maxSize)
                    setElementSize(newSize)
                    onSizeChanging?.invoke(newSize)
                    true
                }
                else -> true
            }
        }
    }

    private fun dp(value: Int): Int =
        (value * context.resources.displayMetrics.density).toInt()
}
