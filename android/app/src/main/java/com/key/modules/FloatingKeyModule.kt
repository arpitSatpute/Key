package com.key.modules

import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.key.preferences.KeyPreferences
import com.key.services.FloatingKeyService
import org.json.JSONObject

class FloatingKeyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FloatingKeyModule"

    @ReactMethod
    fun startOverlay(promise: Promise) {
        try {
            val context = reactApplicationContext
            if (!Settings.canDrawOverlays(context)) {
                promise.reject("PERMISSION_DENIED", "SYSTEM_ALERT_WINDOW permission is required to display floating keys.")
                return
            }

            KeyPreferences.setOverlayEnabled(context, true)

            val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                action = FloatingKeyService.ACTION_START
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent)
            } else {
                context.startService(serviceIntent)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopOverlay(promise: Promise) {
        try {
            val context = reactApplicationContext
            KeyPreferences.setOverlayEnabled(context, false)

            val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                action = FloatingKeyService.ACTION_STOP
            }
            context.startService(serviceIntent)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isOverlayRunning(promise: Promise) {
        try {
            val running = FloatingKeyService.isRunning
            promise.resolve(running)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun showOverlay(promise: Promise) {
        try {
            val context = reactApplicationContext
            val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                action = FloatingKeyService.ACTION_SHOW
            }
            context.startService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHOW_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun hideOverlay(promise: Promise) {
        try {
            val context = reactApplicationContext
            val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                action = FloatingKeyService.ACTION_HIDE
            }
            context.startService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("HIDE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun toggleOverlay(promise: Promise) {
        try {
            val context = reactApplicationContext
            val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                action = FloatingKeyService.ACTION_TOGGLE_VISIBILITY
            }
            context.startService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TOGGLE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun toggleVolumeDial(promise: Promise) {
        try {
            val context = reactApplicationContext
            val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                action = FloatingKeyService.ACTION_TOGGLE_VOLUME_DIAL
            }
            context.startService(serviceIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DIAL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun updateOverlayConfiguration(configJson: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            KeyPreferences.saveConfigJson(context, configJson)

            // Notify active service if running
            val service = FloatingKeyService.instance
            if (service != null && FloatingKeyService.isRunning) {
                val json = JSONObject(configJson)
                service.updateConfig(json)
            } else {
                val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                    action = FloatingKeyService.ACTION_UPDATE_CONFIG
                    putExtra("config", configJson)
                }
                context.startService(serviceIntent)
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getOverlayConfiguration(promise: Promise) {
        try {
            val context = reactApplicationContext
            val config = KeyPreferences.getConfigJson(context)
            promise.resolve(config)
        } catch (e: Exception) {
            promise.reject("GET_CONFIG_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun resetOverlayConfiguration(promise: Promise) {
        try {
            val context = reactApplicationContext
            val defaultConfig = KeyPreferences.getDefaultConfigJson()
            KeyPreferences.saveConfigJson(context, defaultConfig)

            val service = FloatingKeyService.instance
            if (service != null && FloatingKeyService.isRunning) {
                service.updateConfig(JSONObject(defaultConfig))
            }

            promise.resolve(defaultConfig)
        } catch (e: Exception) {
            promise.reject("RESET_ERROR", e.message, e)
        }
    }
}

