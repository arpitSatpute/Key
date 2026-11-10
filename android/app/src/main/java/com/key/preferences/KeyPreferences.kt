package com.key.preferences

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

object KeyPreferences {
    private const val PREFS_NAME = "virtual_hardware_keys_prefs"
    private const val KEY_CONFIG = "key_configuration"
    private const val KEY_OVERLAY_ENABLED = "overlay_enabled"
    private const val KEY_BOOT_AUTO_START = "boot_auto_start"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun isOverlayEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_OVERLAY_ENABLED, true)
    }

    fun setOverlayEnabled(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_OVERLAY_ENABLED, enabled).apply()
    }

    fun isBootAutoStartEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_BOOT_AUTO_START, true)
    }

    fun setBootAutoStartEnabled(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_BOOT_AUTO_START, enabled).apply()
    }

    fun getConfigJson(context: Context): String {
        val stored = getPrefs(context).getString(KEY_CONFIG, null)
        return if (!stored.isNullOrEmpty()) {
            stored
        } else {
            val defaultJson = getDefaultConfigJson()
            getPrefs(context).edit().putString(KEY_CONFIG, defaultJson).apply()
            defaultJson
        }
    }

    fun saveConfigJson(context: Context, json: String) {
        getPrefs(context).edit().putString(KEY_CONFIG, json).apply()
    }

    fun getDefaultConfigJson(): String {
        val root = JSONObject()

        // Global Layout
        root.put("edge", "right") // "right", "left", "top", "bottom"
        root.put("posYPercent", 0.40) // 40% from top
        root.put("posXPercent", 1.0)  // on right edge
        root.put("spacing", 10) // dp between buttons
        root.put("buttonSize", "medium") // "small" (42dp), "medium" (50dp), "large" (58dp)
        root.put("buttonShape", "circle") // "circle", "rounded", "pill"
        root.put("opacity", 0.90) // 0.2 to 1.0
        root.put("hapticFeedback", true)
        root.put("showLabels", false)
        root.put("compactMode", false)
        root.put("theme", "dark") // "dark", "light"

        // Individual keys config
        val keys = JSONObject()

        // 1. Power Key
        val power = JSONObject()
        power.put("id", "power")
        power.put("name", "Power Key")
        power.put("enabled", true)
        power.put("singleTap", "lock_screen")
        power.put("doubleTap", "power_menu")
        power.put("longPress", "power_menu")
        power.put("color", "#FFFFFF")
        power.put("icon", "power")
        power.put("label", "Power")
        power.put("order", 0)
        power.put("edge", "right")
        power.put("posYPercent", 0.18)
        keys.put("power", power)

        // 2. Volume Up Key
        val volUp = JSONObject()
        volUp.put("id", "volume_up")
        volUp.put("name", "Volume Up")
        volUp.put("enabled", true)
        volUp.put("singleTap", "volume_up")
        volUp.put("doubleTap", "volume_max")
        volUp.put("longPress", "volume_up_continuous")
        volUp.put("step", 1)
        volUp.put("stream", "media") // "media", "ring", "notification", "alarm"
        volUp.put("showUi", true)
        volUp.put("color", "#FFFFFF")
        volUp.put("icon", "volume_up")
        volUp.put("label", "Vol +")
        volUp.put("order", 1)
        volUp.put("edge", "right")
        volUp.put("posYPercent", 0.32)
        keys.put("volume_up", volUp)

        // 3. Volume Down Key
        val volDown = JSONObject()
        volDown.put("id", "volume_down")
        volDown.put("name", "Volume Down")
        volDown.put("enabled", true)
        volDown.put("singleTap", "volume_down")
        volDown.put("doubleTap", "volume_mute")
        volDown.put("longPress", "volume_down_continuous")
        volDown.put("step", 1)
        volDown.put("stream", "media")
        volDown.put("showUi", true)
        volDown.put("color", "#FFFFFF")
        volDown.put("icon", "volume_down")
        volDown.put("label", "Vol -")
        volDown.put("order", 2)
        volDown.put("edge", "right")
        volDown.put("posYPercent", 0.46)
        keys.put("volume_down", volDown)

        // 4. Alert Key
        val alert = JSONObject()
        alert.put("id", "alert")
        alert.put("name", "Custom Alert")
        alert.put("enabled", true)
        alert.put("singleTap", "toggle_silent")
        alert.put("doubleTap", "toggle_dnd")
        alert.put("longPress", "play_sound")
        alert.put("alertSound", "beep")
        alert.put("customAppPackage", "")
        alert.put("emergencyNumber", "911")
        alert.put("color", "#FFFFFF")
        alert.put("icon", "bell")
        alert.put("label", "Alert")
        alert.put("order", 3)
        alert.put("edge", "right")
        alert.put("posYPercent", 0.62)
        keys.put("alert", alert)

        root.put("keys", keys)
        return root.toString()
    }

    fun updateKeyPosition(context: Context, keyId: String, edge: String, posYPercent: Float) {
        val currentJson = getConfigJson(context)
        try {
            val root = JSONObject(currentJson)
            val keys = root.optJSONObject("keys") ?: JSONObject()
            val keyObj = keys.optJSONObject(keyId) ?: JSONObject()
            keyObj.put("edge", edge)
            keyObj.put("posYPercent", posYPercent.toDouble())
            keys.put(keyId, keyObj)
            root.put("keys", keys)
            saveConfigJson(context, root.toString())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

