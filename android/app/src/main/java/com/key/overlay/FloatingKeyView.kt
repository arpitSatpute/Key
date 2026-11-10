package com.key.overlay

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.key.hardware.KeyActionDispatcher
import org.json.JSONObject

@SuppressLint("ViewConstructor")
class FloatingKeyView(
    context: Context,
    private val actionDispatcher: KeyActionDispatcher,
    private val onDragListener: DragCallback,
    private val onOpenVolumeDial: () -> Unit,
    private val onExpansionStateChanged: (isExpanded: Boolean) -> Unit
) : FrameLayout(context) {

    interface DragCallback {
        fun onMove(deltaX: Float, deltaY: Float)
        fun onDragEnd(rawX: Float, rawY: Float)
        fun onPositionChanged(xPercent: Float, yPercent: Float)
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var config: JSONObject = JSONObject()

    var isCollapsed = true
        private set

    private var edge = "right" // "left" or "right"
    private var hapticEnabled = true

    val collapsedWidthPx = dpToPx(30f)
    val expandedWidthPx = dpToPx(68f)
    val collapsedHeightPx = dpToPx(92f)

    private val sidebarContainer: LinearLayout
    private val stealthTab: View

    private val autoCollapseRunnable = Runnable {
        if (!isCollapsed) {
            collapseSidebar()
        }
    }

    init {
        clipToPadding = false
        clipChildren = false

        // 1. Subtle Stealth Edge Tab (shown when collapsed)
        stealthTab = object : View(context) {
            private val tabPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.FILL
                color = Color.parseColor("#E60F172A") // Frosted deep slate
            }
            private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 2f
                color = Color.parseColor("#8038BDF8") // Glowing cyan accent border
            }
            private val indicatorPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.FILL
                color = Color.parseColor("#FFFFFF")
            }
            private val bounds = RectF()

            override fun onDraw(canvas: Canvas) {
                super.onDraw(canvas)
                val w = width.toFloat()
                val h = height.toFloat()

                // Draw pill tab with padding for comfortable touch
                val padX = 2f
                bounds.set(padX, 2f, w - padX, h - 2f)
                val radius = (w - padX * 2) / 2f

                canvas.drawRoundRect(bounds, radius, radius, tabPaint)
                canvas.drawRoundRect(bounds, radius, radius, borderPaint)

                // Central illuminated grip line
                val indW = 3f
                val indH = h * 0.45f
                val indX = (w - indW) / 2f
                val indY = (h - indH) / 2f
                val indBounds = RectF(indX, indY, indX + indW, indY + indH)
                canvas.drawRoundRect(indBounds, indW / 2f, indW / 2f, indicatorPaint)
            }
        }
        stealthTab.layoutParams = LayoutParams(collapsedWidthPx, collapsedHeightPx).apply {
            gravity = Gravity.CENTER_VERTICAL or if (edge == "left") Gravity.START else Gravity.END
        }
        setupStealthTabTouch()

        // 2. Expanded Sidebar Menu (Frosted glass vertical dock)
        sidebarContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dpToPx(7f), dpToPx(10f), dpToPx(7f), dpToPx(10f))

            val bgDrawable = GradientDrawable().apply {
                setColor(Color.parseColor("#F20F172A")) // 95% opacity frosted slate
                cornerRadius = dpToPx(34f).toFloat()
                setStroke(dpToPx(1.5f), Color.parseColor("#4D38BDF8"))
            }
            background = bgDrawable
            visibility = GONE
        }
        sidebarContainer.layoutParams = LayoutParams(expandedWidthPx, LayoutParams.WRAP_CONTENT)

        addView(stealthTab)
        addView(sidebarContainer)
    }

    fun applyConfiguration(configJson: JSONObject) {
        this.config = configJson
        this.edge = config.optString("edge", "right")
        this.hapticEnabled = config.optBoolean("hapticFeedback", true)

        rebuildSidebar()
    }

    private fun rebuildSidebar() {
        sidebarContainer.removeAllViews()

        // Drag & Collapse Top Grip Bar
        val gripBar = DragGripView(context) {
            collapseSidebar()
        }
        sidebarContainer.addView(gripBar)

        val keysObj = config.optJSONObject("keys") ?: JSONObject()

        // 1. Power Key (Lock Screen / Power Menu)
        val powerData = keysObj.optJSONObject("power") ?: JSONObject()
        if (powerData.optBoolean("enabled", true)) {
            val singleAct = powerData.optString("singleTap", "lock_screen")
            val doubleAct = powerData.optString("doubleTap", "power_menu")
            val longAct = powerData.optString("longPress", "power_menu")
            val color = powerData.optString("color", "#EF4444")

            val powerBtn = SidebarKeyButton(
                context = context,
                type = "power",
                colorHex = color,
                onSingleTap = { executeKeyAction("power", singleAct, powerData) },
                onDoubleTap = if (doubleAct != "none") { { executeKeyAction("power", doubleAct, powerData) } } else null,
                onLongPress = if (longAct != "none") { { executeKeyAction("power", longAct, powerData) } } else null
            )
            sidebarContainer.addView(powerBtn)
        }

        // 2. Volume Up Key
        val volUpData = keysObj.optJSONObject("volume_up") ?: JSONObject()
        if (volUpData.optBoolean("enabled", true)) {
            val singleAct = volUpData.optString("singleTap", "volume_up")
            val doubleAct = volUpData.optString("doubleTap", "volume_max")
            val longAct = volUpData.optString("longPress", "volume_up_continuous")
            val color = volUpData.optString("color", "#3B82F6")
            val isContinuous = longAct == "volume_up_continuous" || longAct == "volume_up"

            val volUpBtn = SidebarKeyButton(
                context = context,
                type = "volume_up",
                colorHex = color,
                onSingleTap = { executeKeyAction("volume_up", singleAct, volUpData) },
                onDoubleTap = if (doubleAct != "none") { { executeKeyAction("volume_up", doubleAct, volUpData) } } else null,
                onLongPress = if (longAct != "none") { { executeKeyAction("volume_up", longAct, volUpData) } } else null,
                onHoldRepeat = if (isContinuous) {
                    {
                        val stream = volUpData.optString("stream", "media")
                        val showUi = volUpData.optBoolean("showUi", true)
                        val step = volUpData.optInt("step", 1)
                        actionDispatcher.increaseVolume(stream, showUi, step)
                        resetAutoCollapse()
                    }
                } else null
            )
            sidebarContainer.addView(volUpBtn)
        }

        // 3. Rotary Volume Dial Launcher Button
        val volumeBtn = SidebarKeyButton(
            context = context,
            type = "volume_dial",
            colorHex = "#06B6D4",
            onSingleTap = {
                if (hapticEnabled) actionDispatcher.triggerHapticFeedback("click")
                onOpenVolumeDial()
                resetAutoCollapse()
            },
            onDoubleTap = {
                if (hapticEnabled) actionDispatcher.triggerHapticFeedback("double")
                onOpenVolumeDial()
                resetAutoCollapse()
            },
            onLongPress = {
                if (hapticEnabled) actionDispatcher.triggerHapticFeedback("heavy")
                onOpenVolumeDial()
                resetAutoCollapse()
            }
        )
        sidebarContainer.addView(volumeBtn)

        // 4. Volume Down Key
        val volDownData = keysObj.optJSONObject("volume_down") ?: JSONObject()
        if (volDownData.optBoolean("enabled", true)) {
            val singleAct = volDownData.optString("singleTap", "volume_down")
            val doubleAct = volDownData.optString("doubleTap", "volume_mute")
            val longAct = volDownData.optString("longPress", "volume_down_continuous")
            val color = volDownData.optString("color", "#6366F1")
            val isContinuous = longAct == "volume_down_continuous" || longAct == "volume_down"

            val volDownBtn = SidebarKeyButton(
                context = context,
                type = "volume_down",
                colorHex = color,
                onSingleTap = { executeKeyAction("volume_down", singleAct, volDownData) },
                onDoubleTap = if (doubleAct != "none") { { executeKeyAction("volume_down", doubleAct, volDownData) } } else null,
                onLongPress = if (longAct != "none") { { executeKeyAction("volume_down", longAct, volDownData) } } else null,
                onHoldRepeat = if (isContinuous) {
                    {
                        val stream = volDownData.optString("stream", "media")
                        val showUi = volDownData.optBoolean("showUi", true)
                        val step = volDownData.optInt("step", 1)
                        actionDispatcher.decreaseVolume(stream, showUi, step)
                        resetAutoCollapse()
                    }
                } else null
            )
            sidebarContainer.addView(volDownBtn)
        }

        // 5. Alert Key (Silent / DND / Alert Sound / Emergency Dial)
        val alertData = keysObj.optJSONObject("alert") ?: JSONObject()
        if (alertData.optBoolean("enabled", true)) {
            val singleAct = alertData.optString("singleTap", "toggle_silent")
            val doubleAct = alertData.optString("doubleTap", "toggle_dnd")
            val longAct = alertData.optString("longPress", "play_sound")
            val color = alertData.optString("color", "#F59E0B")

            val alertBtn = SidebarKeyButton(
                context = context,
                type = "alert",
                colorHex = color,
                onSingleTap = { executeKeyAction("alert", singleAct, alertData) },
                onDoubleTap = if (doubleAct != "none") { { executeKeyAction("alert", doubleAct, alertData) } } else null,
                onLongPress = if (longAct != "none") { { executeKeyAction("alert", longAct, alertData) } } else null
            )
            sidebarContainer.addView(alertBtn)
        }

        // 6. Collapse Button at bottom
        val closeBtn = SidebarKeyButton(
            context = context,
            type = "collapse",
            colorHex = "#64748B",
            onSingleTap = {
                if (hapticEnabled) actionDispatcher.triggerHapticFeedback("tick")
                collapseSidebar()
            }
        )
        sidebarContainer.addView(closeBtn)
    }

    private fun executeKeyAction(keyId: String, action: String, data: JSONObject) {
        if (action == "none" || action.isEmpty()) return

        if (hapticEnabled) {
            actionDispatcher.triggerHapticFeedback("click")
        }

        when (action) {
            "lock_screen" -> actionDispatcher.lockScreen()
            "power_menu" -> actionDispatcher.openPowerMenu()
            "volume_up" -> {
                val stream = data.optString("stream", "media")
                val showUi = data.optBoolean("showUi", true)
                val step = data.optInt("step", 1)
                actionDispatcher.increaseVolume(stream, showUi, step)
            }
            "volume_down" -> {
                val stream = data.optString("stream", "media")
                val showUi = data.optBoolean("showUi", true)
                val step = data.optInt("step", 1)
                actionDispatcher.decreaseVolume(stream, showUi, step)
            }
            "volume_max" -> {
                val stream = data.optString("stream", "media")
                val showUi = data.optBoolean("showUi", true)
                actionDispatcher.setMaxVolume(stream, showUi)
            }
            "volume_mute" -> {
                val stream = data.optString("stream", "media")
                val showUi = data.optBoolean("showUi", true)
                actionDispatcher.muteVolume(stream, showUi)
            }
            "volume_up_continuous" -> {
                val stream = data.optString("stream", "media")
                val showUi = data.optBoolean("showUi", true)
                val step = data.optInt("step", 1)
                actionDispatcher.increaseVolume(stream, showUi, step)
            }
            "volume_down_continuous" -> {
                val stream = data.optString("stream", "media")
                val showUi = data.optBoolean("showUi", true)
                val step = data.optInt("step", 1)
                actionDispatcher.decreaseVolume(stream, showUi, step)
            }
            "volume_dial" -> onOpenVolumeDial()
            "toggle_silent" -> actionDispatcher.toggleSilentMode()
            "toggle_dnd" -> actionDispatcher.toggleDND()
            "toggle_vibrate" -> actionDispatcher.toggleVibrate()
            "play_sound" -> {
                val sound = data.optString("alertSound", "beep")
                actionDispatcher.playAlertSound(sound)
            }
            "custom_notification" -> {
                actionDispatcher.sendCustomNotification("Virtual Alert Key", "Alert action triggered")
            }
            "launch_app" -> {
                val pkg = data.optString("customAppPackage", "")
                actionDispatcher.launchApp(pkg)
            }
            "emergency_dial" -> {
                val num = data.optString("emergencyNumber", "911")
                actionDispatcher.triggerEmergencyShortcut(num)
            }
        }

        resetAutoCollapse()
    }

    fun expandSidebar() {
        if (!isCollapsed) return
        isCollapsed = false
        mainHandler.removeCallbacks(autoCollapseRunnable)

        stealthTab.visibility = GONE
        sidebarContainer.visibility = VISIBLE
        sidebarContainer.alpha = 1f

        onExpansionStateChanged(true)
        resetAutoCollapse()
    }

    fun collapseSidebar() {
        if (isCollapsed) return
        isCollapsed = true
        mainHandler.removeCallbacks(autoCollapseRunnable)

        sidebarContainer.visibility = GONE
        stealthTab.visibility = VISIBLE
        stealthTab.alpha = 1f

        onExpansionStateChanged(false)
    }

    private fun resetAutoCollapse() {
        mainHandler.removeCallbacks(autoCollapseRunnable)
        mainHandler.postDelayed(autoCollapseRunnable, 4500)
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupStealthTabTouch() {
        stealthTab.setOnTouchListener(object : OnTouchListener {
            private var startX = 0f
            private var startY = 0f
            private var isDragging = false
            private val touchSlop = dpToPx(10f)

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        startX = event.rawX
                        startY = event.rawY
                        isDragging = false
                        stealthTab.alpha = 0.7f
                        return true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - startX
                        val dy = event.rawY - startY

                        if (!isDragging && (Math.abs(dx) > touchSlop || Math.abs(dy) > touchSlop)) {
                            isDragging = true
                        }

                        if (isDragging) {
                            onDragListener.onMove(dx, dy)
                            startX = event.rawX
                            startY = event.rawY
                        }
                        return true
                    }

                    MotionEvent.ACTION_UP -> {
                        stealthTab.alpha = 1f
                        if (isDragging) {
                            onDragListener.onDragEnd(event.rawX, event.rawY)
                        } else {
                            if (hapticEnabled) actionDispatcher.triggerHapticFeedback("click")
                            expandSidebar()
                        }
                        return true
                    }

                    MotionEvent.ACTION_CANCEL -> {
                        stealthTab.alpha = 1f
                        return true
                    }
                }
                return false
            }
        })
    }

    // Top Grip Handle for dragging the sidebar
    private inner class DragGripView(
        context: Context,
        private val onTapCollapse: () -> Unit
    ) : View(context) {

        private val gripPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = Color.parseColor("#4DFFFFFF")
        }

        init {
            layoutParams = LinearLayout.LayoutParams(expandedWidthPx, dpToPx(20f))
            setupDrag()
        }

        @SuppressLint("ClickableViewAccessibility")
        private fun setupDrag() {
            setOnTouchListener(object : OnTouchListener {
                private var startX = 0f
                private var startY = 0f
                private var isDragging = false
                private val touchSlop = dpToPx(6f)

                override fun onTouch(v: View, event: MotionEvent): Boolean {
                    when (event.actionMasked) {
                        MotionEvent.ACTION_DOWN -> {
                            startX = event.rawX
                            startY = event.rawY
                            isDragging = false
                            resetAutoCollapse()
                            return true
                        }

                        MotionEvent.ACTION_MOVE -> {
                            val dx = event.rawX - startX
                            val dy = event.rawY - startY
                            if (!isDragging && (Math.abs(dx) > touchSlop || Math.abs(dy) > touchSlop)) {
                                isDragging = true
                            }
                            if (isDragging) {
                                onDragListener.onMove(dx, dy)
                                startX = event.rawX
                                startY = event.rawY
                            }
                            return true
                        }

                        MotionEvent.ACTION_UP -> {
                            if (isDragging) {
                                onDragListener.onDragEnd(event.rawX, event.rawY)
                            } else {
                                onTapCollapse()
                            }
                            return true
                        }
                    }
                    return false
                }
            })
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val w = width.toFloat()
            val cy = height / 2f
            val pillW = dpToPx(30f).toFloat()
            val pillH = dpToPx(5f).toFloat()
            val rect = RectF((w - pillW) / 2f, cy - (pillH / 2f), (w + pillW) / 2f, cy + (pillH / 2f))
            canvas.drawRoundRect(rect, pillH / 2f, pillH / 2f, gripPaint)
        }
    }

    // Individual sleek sidebar icon button with full gesture & hold support
    private inner class SidebarKeyButton(
        context: Context,
        private val type: String,
        colorHex: String,
        private val onSingleTap: () -> Unit,
        private val onDoubleTap: (() -> Unit)? = null,
        private val onLongPress: (() -> Unit)? = null,
        private val onHoldRepeat: (() -> Unit)? = null
    ) : View(context) {

        private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = Color.parseColor("#E61E293B") // Frosted slate
        }
        private val accentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = Color.parseColor(colorHex)
        }
        private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
            strokeWidth = dpToPx(2.8f).toFloat()
            color = Color.WHITE
        }

        private var scaleVal = 1.0f
        private val btnBounds = RectF()

        // Touch & Gesture states
        private var downX = 0f
        private var downY = 0f
        private var isLongPressTriggered = false
        private var isHoldRepeatActive = false
        private var hasMovedBeyondSlop = false
        private var lastTapUpTime = 0L
        private val touchSlop = dpToPx(10f)

        private val longPressRunnable = Runnable {
            if (!hasMovedBeyondSlop) {
                isLongPressTriggered = true
                if (hapticEnabled) {
                    actionDispatcher.triggerHapticFeedback("heavy")
                }
                animatePulse()

                // Execute the Long Press action!
                onLongPress?.invoke()

                // If hold-to-repeat is enabled (e.g. continuous volume), start repeat loop
                if (onHoldRepeat != null) {
                    isHoldRepeatActive = true
                    mainHandler.post(repeatRunnable)
                }
            }
        }

        private val repeatRunnable = object : Runnable {
            override fun run() {
                if (isHoldRepeatActive) {
                    onHoldRepeat?.invoke()
                    if (hapticEnabled) {
                        actionDispatcher.triggerHapticFeedback("tick")
                    }
                    mainHandler.postDelayed(this, 120L)
                }
            }
        }

        private val singleTapRunnable = Runnable {
            onSingleTap.invoke()
        }

        init {
            val btnSize = dpToPx(52f)
            layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply {
                topMargin = dpToPx(8f)
                gravity = Gravity.CENTER_HORIZONTAL
            }
            setupGestures()
        }

        @SuppressLint("ClickableViewAccessibility")
        private fun setupGestures() {
            setOnTouchListener { _, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        downX = event.x
                        downY = event.y
                        isLongPressTriggered = false
                        isHoldRepeatActive = false
                        hasMovedBeyondSlop = false

                        val now = System.currentTimeMillis()
                        if (onDoubleTap != null && (now - lastTapUpTime) < 300L) {
                            mainHandler.removeCallbacks(singleTapRunnable)
                        }

                        // Schedule Long Press timeout (400ms)
                        mainHandler.removeCallbacks(longPressRunnable)
                        mainHandler.postDelayed(longPressRunnable, 400L)

                        animateScale(0.85f)
                        true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        val dx = Math.abs(event.x - downX)
                        val dy = Math.abs(event.y - downY)
                        if (dx > touchSlop || dy > touchSlop) {
                            hasMovedBeyondSlop = true
                            mainHandler.removeCallbacks(longPressRunnable)
                            stopHoldRepeat()
                            animateScale(1.0f)
                        }
                        true
                    }

                    MotionEvent.ACTION_UP -> {
                        mainHandler.removeCallbacks(longPressRunnable)
                        stopHoldRepeat()
                        animateScale(1.0f)

                        if (hasMovedBeyondSlop) {
                            return@setOnTouchListener true
                        }

                        if (isLongPressTriggered) {
                            isLongPressTriggered = false
                            return@setOnTouchListener true
                        }

                        val now = System.currentTimeMillis()
                        if (onDoubleTap != null && (now - lastTapUpTime) < 300L) {
                            mainHandler.removeCallbacks(singleTapRunnable)
                            lastTapUpTime = 0L
                            if (hapticEnabled) actionDispatcher.triggerHapticFeedback("double")
                            onDoubleTap.invoke()
                        } else {
                            lastTapUpTime = now
                            if (onDoubleTap != null) {
                                mainHandler.postDelayed(singleTapRunnable, 200L)
                            } else {
                                onSingleTap.invoke()
                            }
                        }
                        true
                    }

                    MotionEvent.ACTION_CANCEL -> {
                        mainHandler.removeCallbacks(longPressRunnable)
                        mainHandler.removeCallbacks(singleTapRunnable)
                        stopHoldRepeat()
                        animateScale(1.0f)
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

        private fun animatePulse() {
            ValueAnimator.ofFloat(0.85f, 1.12f, 1.0f).apply {
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

            val p = 2f
            btnBounds.set(p, p, width - p, height - p)
            val r = (width - p * 2) * 0.35f

            // Background pill
            canvas.drawRoundRect(btnBounds, r, r, bgPaint)

            // Draw icon
            drawIcon(canvas, cx, cy, (width - p * 2) * 0.46f)

            canvas.restore()
        }

        private fun drawIcon(canvas: Canvas, cx: Float, cy: Float, size: Float) {
            val r = size / 2f

            when (type) {
                "power" -> {
                    val arcRect = RectF(cx - r, cy - r, cx + r, cy + r)
                    canvas.drawArc(arcRect, 135f, 270f, false, iconPaint)
                    canvas.drawLine(cx, cy - r, cx, cy, iconPaint)
                }

                "volume_up" -> {
                    val path = Path().apply {
                        moveTo(cx - r * 0.6f, cy - r * 0.25f)
                        lineTo(cx - r * 0.25f, cy - r * 0.25f)
                        lineTo(cx + r * 0.1f, cy - r * 0.55f)
                        lineTo(cx + r * 0.1f, cy + r * 0.55f)
                        lineTo(cx - r * 0.25f, cy + r * 0.25f)
                        lineTo(cx - r * 0.6f, cy + r * 0.25f)
                        close()
                    }
                    canvas.drawPath(path, iconPaint)
                    // Plus sign
                    canvas.drawLine(cx + r * 0.32f, cy, cx + r * 0.72f, cy, iconPaint)
                    canvas.drawLine(cx + r * 0.52f, cy - r * 0.2f, cx + r * 0.52f, cy + r * 0.2f, iconPaint)
                }

                "volume_dial" -> {
                    val arcRect = RectF(cx - r * 0.95f, cy - r * 0.95f, cx + r * 0.95f, cy + r * 0.95f)
                    canvas.drawArc(arcRect, 120f, 300f, false, iconPaint)
                    canvas.drawCircle(cx, cy, r * 0.38f, accentPaint)
                    canvas.drawLine(cx, cy - r * 0.35f, cx, cy - r * 0.75f, iconPaint)
                }

                "volume_down" -> {
                    val path = Path().apply {
                        moveTo(cx - r * 0.6f, cy - r * 0.25f)
                        lineTo(cx - r * 0.25f, cy - r * 0.25f)
                        lineTo(cx + r * 0.1f, cy - r * 0.55f)
                        lineTo(cx + r * 0.1f, cy + r * 0.55f)
                        lineTo(cx - r * 0.25f, cy + r * 0.25f)
                        lineTo(cx - r * 0.6f, cy + r * 0.25f)
                        close()
                    }
                    canvas.drawPath(path, iconPaint)
                    // Minus sign
                    canvas.drawLine(cx + r * 0.32f, cy, cx + r * 0.72f, cy, iconPaint)
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

                "collapse" -> {
                    val arrowW = r * 0.45f
                    val arrowH = r * 0.55f
                    if (edge == "right") {
                        canvas.drawLine(cx - arrowW / 2f, cy - arrowH, cx + arrowW / 2f, cy, iconPaint)
                        canvas.drawLine(cx + arrowW / 2f, cy, cx - arrowW / 2f, cy + arrowH, iconPaint)
                    } else {
                        canvas.drawLine(cx + arrowW / 2f, cy - arrowH, cx - arrowW / 2f, cy, iconPaint)
                        canvas.drawLine(cx - arrowW / 2f, cy, cx + arrowW / 2f, cy + arrowH, iconPaint)
                    }
                }
            }
        }
    }

    private fun dpToPx(dp: Float): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp,
            context.resources.displayMetrics
        ).toInt()
    }
}
