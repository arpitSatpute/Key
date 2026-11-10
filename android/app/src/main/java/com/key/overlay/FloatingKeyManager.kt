package com.key.overlay

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.PixelFormat
import android.graphics.Point
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import com.key.hardware.KeyActionDispatcher
import com.key.preferences.KeyPreferences
import org.json.JSONObject

class FloatingKeyManager(
    private val context: Context,
    private val actionDispatcher: KeyActionDispatcher
) {

    companion object {
        private const val TAG = "FloatingKeyManager"
        private val ALL_KEY_IDS = arrayOf("power", "volume_up", "volume_down", "alert")
    }

    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val mainHandler = Handler(Looper.getMainLooper())

    private val keyViews = mutableMapOf<String, IndependentKeyView>()
    private val keyLayoutParams = mutableMapOf<String, WindowManager.LayoutParams>()

    private var isAttached = false
    private var isVisible = true

    // Rotary Volume Dial Overlay attached directly to the active volume button
    private var volumeDialView: VolumeDialView? = null
    private var dialLayoutParams: WindowManager.LayoutParams? = null

    private var screenWidth = 0
    private var screenHeight = 0

    init {
        updateScreenDimensions()
    }

    fun attachOverlay() {
        if (isAttached) return

        mainHandler.post {
            try {
                updateScreenDimensions()

                val configString = KeyPreferences.getConfigJson(context)
                val config = JSONObject(configString)
                val keysObj = config.optJSONObject("keys") ?: JSONObject()

                for (keyId in ALL_KEY_IDS) {
                    val keyData = keysObj.optJSONObject(keyId) ?: JSONObject()
                    if (keyData.optBoolean("enabled", true)) {
                        createAndAddKeyView(keyId, keyData)
                    }
                }

                isAttached = true
                isVisible = true
                Log.d(TAG, "All independent virtual keys attached successfully (${keyViews.size} active)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to attach independent virtual keys overlay", e)
            }
        }
    }

    private fun createAndAddKeyView(keyId: String, keyData: JSONObject) {
        val listener = object : IndependentKeyView.DragListener {
            override fun onMove(id: String, deltaX: Float, deltaY: Float, rawX: Float, rawY: Float) {
                val lp = keyLayoutParams[id] ?: return
                val view = keyViews[id] ?: return

                lp.x = (lp.x + deltaX.toInt()).coerceIn(0, (screenWidth - view.keyWidthPx).coerceAtLeast(0))
                lp.y = (lp.y + deltaY.toInt()).coerceIn(0, (screenHeight - view.keyHeightPx).coerceAtLeast(0))

                try {
                    windowManager.updateViewLayout(view, lp)
                } catch (e: Exception) {
                    Log.e(TAG, "Error moving key $id", e)
                }
            }

            override fun onDragEnd(id: String, rawX: Float, rawY: Float) {
                snapKeyToNearestEdge(id, rawX, rawY)
            }
        }

        val keyView = IndependentKeyView(
            context = context,
            actionDispatcher = actionDispatcher,
            keyId = keyId,
            keyData = keyData,
            dragListener = listener,
            onOpenVolumeDial = { id, edge, yPx ->
                showVolumeDialAttachedToKey(id, edge, yPx)
            }
        )

        val lpType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val lp = WindowManager.LayoutParams(
            keyView.keyWidthPx,
            keyView.keyHeightPx,
            lpType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        val edge = keyData.optString("edge", "right")
        val defaultY = getDefaultYPercent(keyId)
        val posYPercent = keyData.optDouble("posYPercent", defaultY.toDouble()).toFloat()

        lp.x = if (edge == "left") 0 else (screenWidth - keyView.keyWidthPx)
        val availableH = (screenHeight - keyView.keyHeightPx).coerceAtLeast(0)
        lp.y = (availableH * posYPercent).toInt().coerceIn(0, availableH)

        windowManager.addView(keyView, lp)
        keyViews[keyId] = keyView
        keyLayoutParams[keyId] = lp
    }

    private fun snapKeyToNearestEdge(keyId: String, rawX: Float, rawY: Float) {
        val lp = keyLayoutParams[keyId] ?: return
        val view = keyViews[keyId] ?: return

        val isLeft = rawX < (screenWidth / 2)
        val targetX = if (isLeft) 0 else (screenWidth - view.keyWidthPx)
        val targetY = lp.y.coerceIn(0, (screenHeight - view.keyHeightPx).coerceAtLeast(0))

        val startX = lp.x
        val anim = ValueAnimator.ofInt(startX, targetX).apply {
            duration = 180
            interpolator = DecelerateInterpolator()
            addUpdateListener {
                val value = it.animatedValue as Int
                lp.x = value
                lp.y = targetY
                try {
                    windowManager.updateViewLayout(view, lp)
                } catch (e: Exception) {
                    Log.e(TAG, "Error animating snap for $keyId", e)
                }
            }
        }
        anim.start()

        val newEdge = if (isLeft) "left" else "right"
        view.setEdge(newEdge)

        val availableH = (screenHeight - view.keyHeightPx).coerceAtLeast(1)
        val newYPercent = (targetY.toFloat() / availableH.toFloat()).coerceIn(0.05f, 0.95f)

        KeyPreferences.updateKeyPosition(context, keyId, newEdge, newYPercent)
        Log.d(TAG, "Key $keyId snapped to $newEdge at yPercent=$newYPercent")
    }

    private fun showVolumeDialAttachedToKey(keyId: String, edge: String, yPx: Int) {
        mainHandler.post {
            if (volumeDialView != null) {
                dismissVolumeDial()
                return@post
            }

            try {
                updateScreenDimensions()
                // Edge Arc / Semi-Circle Jog Wheel docked flush to bezel
                val dialWidthPx = dpToPx(105f).toInt()
                val dialHeightPx = dpToPx(185f).toInt()

                val lpType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }

                val dialLp = WindowManager.LayoutParams(
                    dialWidthPx,
                    dialHeightPx,
                    lpType,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                    PixelFormat.TRANSLUCENT
                ).apply {
                    gravity = Gravity.TOP or Gravity.START
                }

                val volKeyView = keyViews[keyId]
                val keyLp = keyLayoutParams[keyId]
                val keyHeight = volKeyView?.keyHeightPx ?: dpToPx(50f).toInt()
                val keyY = keyLp?.y ?: yPx

                // Dock dial flush to phone edge bezel where the volume key is located
                dialLp.x = if (edge == "right") {
                    screenWidth - dialWidthPx
                } else {
                    0
                }

                val centerTargetY = keyY + keyHeight / 2
                dialLp.y = (centerTargetY - dialHeightPx / 2).coerceIn(
                    dpToPx(24f).toInt(),
                    (screenHeight - dialHeightPx - dpToPx(24f).toInt()).coerceAtLeast(0)
                )

                val dial = VolumeDialView(context, actionDispatcher, edge = edge) {
                    dismissVolumeDial()
                }
                dial.setStream("media")

                this.dialLayoutParams = dialLp
                this.volumeDialView = dial

                windowManager.addView(dial, dialLp)
                Log.d(TAG, "Volume Dial attached directly to $keyId at x=${dialLp.x}, y=${dialLp.y}")
            } catch (e: Exception) {
                Log.e(TAG, "Error displaying Volume Dial", e)
            }
        }
    }

    fun detachOverlay() {
        if (!isAttached) return

        mainHandler.post {
            try {
                dismissVolumeDial()

                for ((_, view) in keyViews) {
                    try {
                        windowManager.removeView(view)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error removing key view", e)
                    }
                }
                keyViews.clear()
                keyLayoutParams.clear()
                isAttached = false
                Log.d(TAG, "All independent virtual keys detached")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to detach overlay", e)
            }
        }
    }

    fun show() {
        mainHandler.post {
            for ((_, view) in keyViews) {
                view.visibility = View.VISIBLE
            }
            isVisible = true
        }
    }

    fun hide() {
        mainHandler.post {
            dismissVolumeDial()
            for ((_, view) in keyViews) {
                view.visibility = View.GONE
            }
            isVisible = false
        }
    }

    fun toggleVisibility(): Boolean {
        if (isVisible) {
            hide()
        } else {
            show()
        }
        return isVisible
    }

    fun toggleVolumeDial() {
        mainHandler.post {
            if (volumeDialView != null) {
                dismissVolumeDial()
            } else {
                // Attach to volume_up or volume_down if available
                val targetKey = if (keyViews.containsKey("volume_up")) "volume_up" else "volume_down"
                val lp = keyLayoutParams[targetKey]
                val view = keyViews[targetKey]
                val edge = view?.edge ?: "right"
                val y = lp?.y ?: (screenHeight / 3)
                showVolumeDialAttachedToKey(targetKey, edge, y)
            }
        }
    }

    private fun dismissVolumeDial() {
        try {
            volumeDialView?.let { view ->
                windowManager.removeView(view)
                volumeDialView = null
                dialLayoutParams = null
                Log.d(TAG, "Volume Dial dismissed")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error removing Volume Dial", e)
        }
    }

    fun updateConfiguration(configJson: JSONObject) {
        mainHandler.post {
            try {
                updateScreenDimensions()
                val keysObj = configJson.optJSONObject("keys") ?: JSONObject()

                for (keyId in ALL_KEY_IDS) {
                    val keyData = keysObj.optJSONObject(keyId) ?: JSONObject()
                    val isEnabled = keyData.optBoolean("enabled", true)

                    if (isEnabled) {
                        val existingView = keyViews[keyId]
                        val existingLp = keyLayoutParams[keyId]

                        if (existingView != null && existingLp != null) {
                            existingView.applyData(keyData)

                            val edge = keyData.optString("edge", existingView.edge)
                            val posYPercent = keyData.optDouble("posYPercent", getDefaultYPercent(keyId).toDouble()).toFloat()

                            existingView.setEdge(edge)
                            existingLp.x = if (edge == "left") 0 else (screenWidth - existingView.keyWidthPx)
                            val availableH = (screenHeight - existingView.keyHeightPx).coerceAtLeast(0)
                            existingLp.y = (availableH * posYPercent).toInt().coerceIn(0, availableH)

                            windowManager.updateViewLayout(existingView, existingLp)
                        } else {
                            createAndAddKeyView(keyId, keyData)
                        }
                    } else {
                        // Key disabled; remove view if present
                        val existingView = keyViews.remove(keyId)
                        keyLayoutParams.remove(keyId)
                        if (existingView != null) {
                            try {
                                windowManager.removeView(existingView)
                            } catch (e: Exception) {
                                Log.e(TAG, "Error removing disabled key $keyId", e)
                            }
                        }
                    }
                }
                Log.d(TAG, "Independent keys updated with new configuration (${keyViews.size} active)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to apply configuration update", e)
            }
        }
    }

    fun onConfigurationChanged() {
        updateScreenDimensions()
        for ((keyId, lp) in keyLayoutParams) {
            val view = keyViews[keyId] ?: continue
            val edge = view.edge
            lp.x = if (edge == "left") 0 else (screenWidth - view.keyWidthPx)
            try {
                windowManager.updateViewLayout(view, lp)
            } catch (e: Exception) {
                Log.e(TAG, "Error updating layout on configuration change", e)
            }
        }
    }

    private fun getDefaultYPercent(keyId: String): Float = when (keyId) {
        "power" -> 0.18f
        "volume_up" -> 0.32f
        "volume_down" -> 0.46f
        "alert" -> 0.62f
        else -> 0.50f
    }

    private fun updateScreenDimensions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowMetrics = windowManager.currentWindowMetrics
            val bounds = windowMetrics.bounds
            screenWidth = bounds.width()
            screenHeight = bounds.height()
        } else {
            val point = Point()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealSize(point)
            screenWidth = point.x
            screenHeight = point.y
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
