package com.key.overlay

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.MotionEvent
import android.view.View
import android.view.animation.OvershootInterpolator
import com.key.hardware.KeyActionDispatcher
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Edge Arc / Semi-Circle Jog Wheel docked directly against the phone edge bezel.
 *
 * Supports rotary finger swiping along the arc and vertical swiping,
 * featuring graduated precision tick marks, luminous progress stroke,
 * dynamic speaker icon, and tactile haptic feedback.
 */
@SuppressLint("ViewConstructor")
class VolumeDialView(
    context: Context,
    private val actionDispatcher: KeyActionDispatcher,
    private var edge: String = "right", // "left" or "right"
    private val onClose: () -> Unit
) : View(context) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var streamType = "media"

    private var currentVol = 7
    private var maxVol = 15

    // Visual Paints (Pure Transparent & Monochrome Black and White by default)
    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#1A000000") // Transparent crystal glass (~90% transparent)
    }

    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dpToPx(1.5f)
        color = Color.WHITE // Crisp white monochrome border
    }

    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dpToPx(7f)
        strokeCap = Paint.Cap.ROUND
        color = Color.parseColor("#33FFFFFF") // Translucent white track (20% alpha)
    }

    private val progressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dpToPx(7f)
        strokeCap = Paint.Cap.ROUND
        color = Color.WHITE // Solid crisp white active progress arc
    }

    private val tickPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dpToPx(1.5f)
        strokeCap = Paint.Cap.ROUND
    }

    private val knobOuterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.WHITE
    }

    private val knobInnerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.BLACK
    }

    private val textPercentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textAlign = Paint.Align.CENTER
        textSize = dpToPx(21f)
        isFakeBoldText = true
    }

    private val textLabelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#D4D4D8")
        textAlign = Paint.Align.CENTER
        textSize = dpToPx(9.5f)
        isFakeBoldText = true
        letterSpacing = 0.08f
    }

    private val speakerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dpToPx(1.8f)
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        color = Color.WHITE
    }

    private val speakerFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.WHITE
    }

    private val jogBgPath = Path()
    private val arcBounds = RectF()

    // Touch & Rotary Gesture Tracking
    private var lastTouchAngle = 0f
    private var lastTouchY = 0f
    private var accumulatedAngle = 0f
    private val degreesPerStep = 13f // Smooth rotary angle threshold per volume step

    private var scaleAnim = 0f
    private val autoDismissRunnable = Runnable { dismissWithAnimation() }

    init {
        refreshVolume()
        animateOpen()
    }

    fun setEdge(newEdge: String) {
        if (this.edge != newEdge) {
            this.edge = newEdge
            invalidate()
        }
    }

    fun setStream(stream: String) {
        this.streamType = stream
        refreshVolume()
        invalidate()
    }

    private fun refreshVolume() {
        currentVol = actionDispatcher.getStreamVolume(streamType)
        maxVol = actionDispatcher.getStreamMaxVolume(streamType).coerceAtLeast(1)
    }

    fun animateOpen() {
        val anim = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 220
            interpolator = OvershootInterpolator(1.15f)
            addUpdateListener {
                scaleAnim = it.animatedValue as Float
                alpha = scaleAnim
                invalidate()
            }
        }
        anim.start()
        resetAutoDismiss()
    }

    fun dismissWithAnimation() {
        mainHandler.removeCallbacks(autoDismissRunnable)
        val anim = ValueAnimator.ofFloat(scaleAnim, 0f).apply {
            duration = 160
            addUpdateListener {
                scaleAnim = it.animatedValue as Float
                alpha = scaleAnim
                invalidate()
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    onClose()
                }
            })
        }
        anim.start()
    }

    private fun resetAutoDismiss() {
        mainHandler.removeCallbacks(autoDismissRunnable)
        mainHandler.postDelayed(autoDismissRunnable, 3500)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val cx = if (edge == "right") width.toFloat() else 0f
        val cy = height / 2f

        val dx = event.x - cx
        val dy = event.y - cy
        val dist = hypot(dx.toDouble(), dy.toDouble()).toFloat()
        val rOuter = width - dpToPx(6f)

        val touchAngle = Math.toDegrees(atan2(dy.toDouble(), dx.toDouble())).toFloat()

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                // If tapped well outside the semi-circle jog wheel, dismiss it
                if (dist > rOuter + dpToPx(24f)) {
                    dismissWithAnimation()
                    return true
                }

                lastTouchAngle = touchAngle
                lastTouchY = event.y
                accumulatedAngle = 0f
                resetAutoDismiss()
                parent?.requestDisallowInterceptTouchEvent(true)
                return true
            }

            MotionEvent.ACTION_MOVE -> {
                var deltaAngle = touchAngle - lastTouchAngle
                if (deltaAngle > 180) deltaAngle -= 360
                if (deltaAngle < -180) deltaAngle += 360

                val deltaY = event.y - lastTouchY
                lastTouchAngle = touchAngle
                lastTouchY = event.y

                // On right edge, clockwise (increasing angle towards top) raises volume.
                // On left edge, counter-clockwise (decreasing angle towards top) raises volume.
                // Upward swipe (deltaY < 0) also raises volume naturally.
                val effectiveRotary = if (edge == "right") deltaAngle else -deltaAngle
                val effectiveVertical = -deltaY * 0.45f
                val combinedDelta = effectiveRotary + effectiveVertical

                accumulatedAngle += combinedDelta

                if (Math.abs(accumulatedAngle) >= degreesPerStep) {
                    val steps = (accumulatedAngle / degreesPerStep).toInt()
                    accumulatedAngle -= steps * degreesPerStep

                    if (steps > 0) {
                        for (i in 0 until steps) {
                            currentVol = actionDispatcher.increaseVolume(streamType, showUi = false, step = 1)
                            actionDispatcher.triggerHapticFeedback("tick")
                        }
                    } else if (steps < 0) {
                        for (i in 0 until Math.abs(steps)) {
                            currentVol = actionDispatcher.decreaseVolume(streamType, showUi = false, step = 1)
                            actionDispatcher.triggerHapticFeedback("tick")
                        }
                    }
                    invalidate()
                }
                resetAutoDismiss()
                return true
            }

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                resetAutoDismiss()
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val cx = if (edge == "right") width.toFloat() else 0f
        val cy = height / 2f

        canvas.save()
        // Anchor scale animation to docked edge bezel
        canvas.scale(scaleAnim, scaleAnim, cx, cy)

        val rOuter = width - dpToPx(6f)
        val rTrack = width - dpToPx(16f)

        // 1. Draw Semi-Circular Translucent Background docked flush to bezel
        jogBgPath.reset()
        val bgRect = RectF(cx - rOuter, cy - rOuter, cx + rOuter, cy + rOuter)
        if (edge == "right") {
            jogBgPath.moveTo(cx, cy - rOuter)
            jogBgPath.arcTo(bgRect, 270f, -180f, false)
            jogBgPath.lineTo(cx, cy + rOuter)
            jogBgPath.close()
        } else {
            jogBgPath.moveTo(cx, cy - rOuter)
            jogBgPath.arcTo(bgRect, 270f, 180f, false)
            jogBgPath.lineTo(cx, cy + rOuter)
            jogBgPath.close()
        }
        canvas.drawPath(jogBgPath, bgPaint)
        canvas.drawPath(jogBgPath, borderPaint)

        // 2. Volume Arc Calculation
        // On Right: starts at 100° (bottom) and sweeps 160° clockwise up to 260° (top)
        // On Left: starts at 80° (bottom) and sweeps -160° counter-clockwise up to -80°/280° (top)
        val startAngle = if (edge == "right") 100f else 80f
        val totalSweep = if (edge == "right") 160f else -160f
        val percent = (currentVol.toFloat() / maxVol.toFloat()).coerceIn(0f, 1f)
        val activeSweep = totalSweep * percent

        arcBounds.set(cx - rTrack, cy - rTrack, cx + rTrack, cy + rTrack)

        // Draw track
        canvas.drawArc(arcBounds, startAngle, totalSweep, false, trackPaint)

        // Draw active progress arc
        canvas.drawArc(arcBounds, startAngle, activeSweep, false, progressPaint)

        // 3. Graduated Precision Tick Marks (11 ticks from 0% to 100%)
        for (i in 0..10) {
            val tickPercent = i / 10f
            val tickAngleDeg = startAngle + totalSweep * tickPercent
            val tickRad = Math.toRadians(tickAngleDeg.toDouble())

            val isMajor = (i == 0 || i == 5 || i == 10)
            val tickLen = if (isMajor) dpToPx(8f) else dpToPx(4.5f)
            val rTickStart = rTrack - dpToPx(7f)
            val rTickEnd = rTickStart - tickLen

            val x1 = cx + rTickStart * cos(tickRad).toFloat()
            val y1 = cy + rTickStart * sin(tickRad).toFloat()
            val x2 = cx + rTickEnd * cos(tickRad).toFloat()
            val y2 = cy + rTickEnd * sin(tickRad).toFloat()

            val isTickActive = tickPercent <= percent + 0.02f
            tickPaint.color = if (isTickActive) Color.WHITE else Color.parseColor("#4DFFFFFF")
            canvas.drawLine(x1, y1, x2, y2, tickPaint)
        }

        // 4. Rotary Indicator Knob / Thumb Handle
        val knobAngleRad = Math.toRadians((startAngle + activeSweep).toDouble())
        val knobX = cx + rTrack * cos(knobAngleRad).toFloat()
        val knobY = cy + rTrack * sin(knobAngleRad).toFloat()

        canvas.drawCircle(knobX, knobY, dpToPx(6.5f), knobOuterPaint)
        canvas.drawCircle(knobX, knobY, dpToPx(3.2f), knobInnerPaint)

        // 5. Center Information Display (Inside the Belly of the Semi-Circle)
        val bellyCenterX = if (edge == "right") cx - rTrack * 0.54f else cx + rTrack * 0.54f
        drawCenterInfo(canvas, bellyCenterX, cy)

        canvas.restore()
    }

    private fun drawCenterInfo(canvas: Canvas, cx: Float, cy: Float) {
        // Speaker icon
        val iconSize = dpToPx(13f)
        val iconY = cy - dpToPx(19f)
        drawSpeakerIcon(canvas, cx, iconY, iconSize)

        // Volume Percentage
        val percentVal = ((currentVol.toFloat() / maxVol.toFloat()) * 100).roundToInt()
        canvas.drawText("$percentVal%", cx, cy + dpToPx(7f), textPercentPaint)

        // Stream Label Badge
        val label = streamType.uppercase()
        canvas.drawText(label, cx, cy + dpToPx(22f), textLabelPaint)
    }

    private fun drawSpeakerIcon(canvas: Canvas, cx: Float, cy: Float, size: Float) {
        val r = size / 2f
        val bodyPath = Path().apply {
            moveTo(cx - r * 0.7f, cy - r * 0.35f)
            lineTo(cx - r * 0.28f, cy - r * 0.35f)
            lineTo(cx + r * 0.05f, cy - r * 0.75f)
            lineTo(cx + r * 0.05f, cy + r * 0.75f)
            lineTo(cx - r * 0.28f, cy + r * 0.35f)
            lineTo(cx - r * 0.7f, cy + r * 0.35f)
            close()
        }
        canvas.drawPath(bodyPath, speakerFillPaint)

        // Sound wave arcs
        if (currentVol > 0) {
            val waveRect1 = RectF(cx + r * 0.1f, cy - r * 0.45f, cx + r * 0.6f, cy + r * 0.45f)
            canvas.drawArc(waveRect1, -60f, 120f, false, speakerPaint)
        }
        if (currentVol > maxVol / 2) {
            val waveRect2 = RectF(cx + r * 0.35f, cy - r * 0.75f, cx + r * 0.95f, cy + r * 0.75f)
            canvas.drawArc(waveRect2, -60f, 120f, false, speakerPaint)
        }
    }

    private fun dpToPx(dp: Float): Float {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            context.resources.displayMetrics
        )
    }
}
