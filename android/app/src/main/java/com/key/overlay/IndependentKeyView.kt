package com.key.overlay

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
import com.key.hardware.KeyActionDispatcher
import org.json.JSONObject

@SuppressLint("ViewConstructor")
class IndependentKeyView(
    context: Context,
    private val actionDispatcher: KeyActionDispatcher,
    val keyId: String,
    private var keyData: JSONObject,
    private val dragListener: DragListener,
    private val onOpenVolumeDial: (keyId: String, edge: String, yPx: Int) -> Unit
) : View(context) {

    interface DragListener {
        fun onMove(keyId: String, deltaX: Float, deltaY: Float, rawX: Float, rawY: Float)
        fun onDragEnd(keyId: String, rawX: Float, rawY: Float)
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    var edge: String = keyData.optString("edge", "right") // "left" or "right"
        private set

    private var hapticEnabled: Boolean = true
    private var colorHex: String = keyData.optString("color", "#FFFFFF")

    // Reduced by 50% from side (was 48dp, now 24dp) for ultra-minimalist edge bezel tab
    val keyWidthPx = dpToPx(24f)
    val keyHeightPx = dpToPx(50f)

    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#1A000000") // Transparent crystal glass (~90% transparent)
    }

    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = dpToPx(1.5f).toFloat()
        color = Color.parseColor(colorHex)
    }

    private val gripPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#80FFFFFF") // Monochrome translucent white grip
    }

    private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        strokeWidth = dpToPx(1.8f).toFloat()
        color = Color.WHITE
    }

    // Touch & Gesture state
    private var startRawX = 0f
    private var startRawY = 0f
    private var lastRawX = 0f
    private var lastRawY = 0f
    private var isDragging = false
    private var isLongPressTriggered = false
    private var isHoldRepeatActive = false
    private var lastTapUpTime = 0L
    private val touchSlop = dpToPx(8f)

    private var scaleVal = 1.0f
    private val btnBounds = RectF()
    private val pillPath = Path()

    private val longPressRunnable = Runnable {
        if (!isDragging) {
            isLongPressTriggered = true
            if (hapticEnabled) {
                actionDispatcher.triggerHapticFeedback("heavy")
            }
            animatePulse()

            val longAct = keyData.optString("longPress", getDefaultLongPressAction(keyId))
            executeAction(longAct)

            // Hold-to-repeat loop for continuous volume
            val isContinuous = longAct == "volume_up_continuous" || longAct == "volume_down_continuous" ||
                longAct == "volume_up" || longAct == "volume_down"
            if (isContinuous) {
                isHoldRepeatActive = true
                mainHandler.post(repeatRunnable)
            }
        }
    }

    private val repeatRunnable = object : Runnable {
        override fun run() {
            if (isHoldRepeatActive) {
                if (keyId == "volume_up") {
                    val stream = keyData.optString("stream", "media")
                    val showUi = keyData.optBoolean("showUi", true)
                    val step = keyData.optInt("step", 1)
                    actionDispatcher.increaseVolume(stream, showUi, step)
                } else if (keyId == "volume_down") {
                    val stream = keyData.optString("stream", "media")
                    val showUi = keyData.optBoolean("showUi", true)
                    val step = keyData.optInt("step", 1)
                    actionDispatcher.decreaseVolume(stream, showUi, step)
                }
                if (hapticEnabled) {
                    actionDispatcher.triggerHapticFeedback("tick")
                }
                mainHandler.postDelayed(this, 120L)
            }
        }
    }

    private val singleTapRunnable = Runnable {
        val singleAct = keyData.optString("singleTap", getDefaultSingleTapAction(keyId))
        executeAction(singleAct)

        // If this is a volume button, append and show the rotary volume dial right next to this key!
        if (keyId == "volume_up" || keyId == "volume_down") {
            onOpenVolumeDial(keyId, edge, top)
        }
    }

    init {
        applyData(keyData)
        setupGestures()
    }

    fun applyData(data: JSONObject) {
        this.keyData = data
        this.edge = data.optString("edge", this.edge)
        this.colorHex = data.optString("color", getDefaultColor(keyId))
        borderPaint.color = Color.parseColor(colorHex)
        invalidate()
    }

    fun setEdge(newEdge: String) {
        if (this.edge != newEdge) {
            this.edge = newEdge
            invalidate()
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupGestures() {
        setOnTouchListener { _, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startRawX = event.rawX
                    startRawY = event.rawY
                    lastRawX = event.rawX
                    lastRawY = event.rawY
                    isDragging = false
                    isLongPressTriggered = false
                    isHoldRepeatActive = false

                    val now = System.currentTimeMillis()
                    val doubleAct = keyData.optString("doubleTap", "none")
                    if (doubleAct != "none" && (now - lastTapUpTime) < 300L) {
                        mainHandler.removeCallbacks(singleTapRunnable)
                    }

                    mainHandler.removeCallbacks(longPressRunnable)
                    mainHandler.postDelayed(longPressRunnable, 400L)

                    animateScale(0.88f)
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val totalDx = Math.abs(event.rawX - startRawX)
                    val totalDy = Math.abs(event.rawY - startRawY)

                    if (!isDragging && (totalDx > touchSlop || totalDy > touchSlop)) {
                        isDragging = true
                        mainHandler.removeCallbacks(longPressRunnable)
                        stopHoldRepeat()
                        animateScale(1.0f)
                    }

                    if (isDragging) {
                        val dx = event.rawX - lastRawX
                        val dy = event.rawY - lastRawY
                        dragListener.onMove(keyId, dx, dy, event.rawX, event.rawY)
                        lastRawX = event.rawX
                        lastRawY = event.rawY
                    }
                    true
                }

                MotionEvent.ACTION_UP -> {
                    mainHandler.removeCallbacks(longPressRunnable)
                    stopHoldRepeat()
                    animateScale(1.0f)

                    if (isDragging) {
                        dragListener.onDragEnd(keyId, event.rawX, event.rawY)
                        isDragging = false
                        return@setOnTouchListener true
                    }

                    if (isLongPressTriggered) {
                        isLongPressTriggered = false
                        return@setOnTouchListener true
                    }

                    // Handle Taps
                    val now = System.currentTimeMillis()
                    val doubleAct = keyData.optString("doubleTap", "none")
                    if (doubleAct != "none" && (now - lastTapUpTime) < 300L) {
                        mainHandler.removeCallbacks(singleTapRunnable)
                        lastTapUpTime = 0L
                        if (hapticEnabled) actionDispatcher.triggerHapticFeedback("double")
                        executeAction(doubleAct)
                    } else {
                        lastTapUpTime = now
                        if (doubleAct != "none") {
                            mainHandler.postDelayed(singleTapRunnable, 200L)
                        } else {
                            val singleAct = keyData.optString("singleTap", getDefaultSingleTapAction(keyId))
                            executeAction(singleAct)
                            if (keyId == "volume_up" || keyId == "volume_down") {
                                onOpenVolumeDial(keyId, edge, top)
                            }
                        }
                    }
                    true
                }

                MotionEvent.ACTION_CANCEL -> {
                    mainHandler.removeCallbacks(longPressRunnable)
                    mainHandler.removeCallbacks(singleTapRunnable)
                    stopHoldRepeat()
                    animateScale(1.0f)
                    isDragging = false
                    isLongPressTriggered = false
                    isHoldRepeatActive = false
                    true
                }

                else -> false
            }
        }
    }

    private fun stopHoldRepeat() {
        isHoldRepeatActive = false
        mainHandler.removeCallbacks(repeatRunnable)
    }

    private fun executeAction(action: String) {
        if (action == "none" || action.isEmpty()) return

        if (hapticEnabled) {
            actionDispatcher.triggerHapticFeedback("click")
        }

        when (action) {
            "lock_screen" -> actionDispatcher.lockScreen()
            "power_menu" -> actionDispatcher.openPowerMenu()
            "volume_up" -> {
                val stream = keyData.optString("stream", "media")
                val showUi = keyData.optBoolean("showUi", true)
                val step = keyData.optInt("step", 1)
                actionDispatcher.increaseVolume(stream, showUi, step)
            }
            "volume_down" -> {
                val stream = keyData.optString("stream", "media")
                val showUi = keyData.optBoolean("showUi", true)
                val step = keyData.optInt("step", 1)
                actionDispatcher.decreaseVolume(stream, showUi, step)
            }
            "volume_max" -> {
                val stream = keyData.optString("stream", "media")
                val showUi = keyData.optBoolean("showUi", true)
                actionDispatcher.setMaxVolume(stream, showUi)
            }
            "volume_mute" -> {
                val stream = keyData.optString("stream", "media")
                val showUi = keyData.optBoolean("showUi", true)
                actionDispatcher.muteVolume(stream, showUi)
            }
            "volume_up_continuous" -> {
                val stream = keyData.optString("stream", "media")
                val showUi = keyData.optBoolean("showUi", true)
                val step = keyData.optInt("step", 1)
                actionDispatcher.increaseVolume(stream, showUi, step)
            }
            "volume_down_continuous" -> {
                val stream = keyData.optString("stream", "media")
                val showUi = keyData.optBoolean("showUi", true)
                val step = keyData.optInt("step", 1)
                actionDispatcher.decreaseVolume(stream, showUi, step)
            }
            "toggle_silent" -> actionDispatcher.toggleSilentMode()
            "toggle_dnd" -> actionDispatcher.toggleDND()
            "toggle_vibrate" -> actionDispatcher.toggleVibrate()
            "play_sound" -> {
                val sound = keyData.optString("alertSound", "beep")
                actionDispatcher.playAlertSound(sound)
            }
            "custom_notification" -> {
                actionDispatcher.sendCustomNotification("Virtual Alert Key", "Alert action triggered")
            }
            "launch_app" -> {
                val pkg = keyData.optString("customAppPackage", "")
                actionDispatcher.launchApp(pkg)
            }
            "emergency_dial" -> {
                val num = keyData.optString("emergencyNumber", "911")
                actionDispatcher.triggerEmergencyShortcut(num)
            }
        }
    }

    private fun animatePulse() {
        ValueAnimator.ofFloat(0.88f, 1.14f, 1.0f).apply {
            duration = 200
            addUpdateListener {
                scaleVal = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    private fun animateScale(target: Float) {
        ValueAnimator.ofFloat(scaleVal, target).apply {
            duration = 80
            addUpdateListener {
                scaleVal = it.animatedValue as Float
                invalidate()
            }
            start()
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val cy = height / 2f

        canvas.save()
        canvas.scale(scaleVal, scaleVal, cx, cy)

        val strokeOffset = borderPaint.strokeWidth / 2f
        btnBounds.set(strokeOffset, strokeOffset, width - strokeOffset, height - strokeOffset)

        // Pill docked geometry
        val rLarge = (height - strokeOffset * 2) * 0.45f
        val rFlush = dpToPx(5f).toFloat()

        pillPath.reset()
        val radii = if (edge == "right") {
            // Rounded on left, docked/flatter on right
            floatArrayOf(rLarge, rLarge, rFlush, rFlush, rFlush, rFlush, rLarge, rLarge)
        } else {
            // Docked on left, rounded on right
            floatArrayOf(rFlush, rFlush, rLarge, rLarge, rLarge, rLarge, rFlush, rFlush)
        }
        pillPath.addRoundRect(btnBounds, radii, Path.Direction.CW)

        // Draw background & border
        canvas.drawPath(pillPath, bgPaint)
        canvas.drawPath(pillPath, borderPaint)

        // Draw docked bezel grip accent line (ultra-subtle)
        val gripX = if (edge == "right") width - dpToPx(2.5f).toFloat() else dpToPx(2.5f).toFloat()
        val gripH = dpToPx(16f).toFloat()
        canvas.drawLine(gripX, cy - gripH / 2f, gripX, cy + gripH / 2f, gripPaint)

        // Draw hardware icon scaled for sleek 24dp bezel tab
        val iconCenterOffset = if (edge == "right") -dpToPx(1.5f) else dpToPx(1.5f)
        drawIcon(canvas, cx + iconCenterOffset, cy, dpToPx(13f).toFloat())

        canvas.restore()
    }

    private fun drawIcon(canvas: Canvas, cx: Float, cy: Float, size: Float) {
        val r = size / 2f

        when (keyId) {
            "power" -> {
                val arcRect = RectF(cx - r, cy - r, cx + r, cy + r)
                canvas.drawArc(arcRect, 135f, 270f, false, iconPaint)
                canvas.drawLine(cx, cy - r, cx, cy, iconPaint)
            }

            "volume_up" -> {
                val path = Path().apply {
                    moveTo(cx - r * 0.55f, cy - r * 0.22f)
                    lineTo(cx - r * 0.22f, cy - r * 0.22f)
                    lineTo(cx + r * 0.12f, cy - r * 0.52f)
                    lineTo(cx + r * 0.12f, cy + r * 0.52f)
                    lineTo(cx - r * 0.22f, cy + r * 0.22f)
                    lineTo(cx - r * 0.55f, cy + r * 0.22f)
                    close()
                }
                canvas.drawPath(path, iconPaint)
                // Plus sign
                canvas.drawLine(cx + r * 0.35f, cy, cx + r * 0.75f, cy, iconPaint)
                canvas.drawLine(cx + r * 0.55f, cy - r * 0.2f, cx + r * 0.55f, cy + r * 0.2f, iconPaint)
            }

            "volume_down" -> {
                val path = Path().apply {
                    moveTo(cx - r * 0.55f, cy - r * 0.22f)
                    lineTo(cx - r * 0.22f, cy - r * 0.22f)
                    lineTo(cx + r * 0.12f, cy - r * 0.52f)
                    lineTo(cx + r * 0.12f, cy + r * 0.52f)
                    lineTo(cx - r * 0.22f, cy + r * 0.22f)
                    lineTo(cx - r * 0.55f, cy + r * 0.22f)
                    close()
                }
                canvas.drawPath(path, iconPaint)
                // Minus sign
                canvas.drawLine(cx + r * 0.35f, cy, cx + r * 0.75f, cy, iconPaint)
            }

            "alert" -> {
                val bellPath = Path().apply {
                    moveTo(cx, cy - r * 0.75f)
                    quadTo(cx + r * 0.55f, cy - r * 0.5f, cx + r * 0.6f, cy + r * 0.45f)
                    lineTo(cx - r * 0.6f, cy + r * 0.45f)
                    quadTo(cx - r * 0.55f, cy - r * 0.5f, cx, cy - r * 0.75f)
                    close()
                }
                canvas.drawPath(bellPath, iconPaint)
                canvas.drawCircle(cx, cy + r * 0.62f, r * 0.16f, iconPaint)
            }
        }
    }

    private fun getDefaultSingleTapAction(id: String): String = when (id) {
        "power" -> "lock_screen"
        "volume_up" -> "volume_up"
        "volume_down" -> "volume_down"
        "alert" -> "toggle_silent"
        else -> "none"
    }

    private fun getDefaultLongPressAction(id: String): String = when (id) {
        "power" -> "power_menu"
        "volume_up" -> "volume_up_continuous"
        "volume_down" -> "volume_down_continuous"
        "alert" -> "play_sound"
        else -> "none"
    }

    private fun getDefaultColor(id: String): String = "#FFFFFF"

    private fun dpToPx(dp: Float): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            context.resources.displayMetrics
        ).toInt()
    }
}

