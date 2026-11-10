package com.key.modules

import android.app.NotificationManager
import android.content.Context
import android.media.AudioManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.key.hardware.KeyActionDispatcher

class AlertKeyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val actionDispatcher = KeyActionDispatcher(reactContext)
    private val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    override fun getName(): String = "AlertKeyModule"

    @ReactMethod
    fun executeAlertAction(action: String, params: ReadableMap?, promise: Promise) {
        try {
            when (action) {
                "toggle_silent" -> {
                    val result = actionDispatcher.toggleSilentMode()
                    promise.resolve(result)
                }
                "toggle_dnd" -> {
                    val isDnd = actionDispatcher.toggleDND()
                    promise.resolve(isDnd)
                }
                "toggle_vibrate" -> {
                    val result = actionDispatcher.toggleVibrate()
                    promise.resolve(result)
                }
                "play_sound" -> {
                    val soundType = params?.getString("soundType") ?: "beep"
                    actionDispatcher.playAlertSound(soundType)
                    promise.resolve(true)
                }
                "custom_notification" -> {
                    val title = params?.getString("title") ?: "Virtual Key Alert"
                    val message = params?.getString("message") ?: "Alert triggered"
                    actionDispatcher.sendCustomNotification(title, message)
                    promise.resolve(true)
                }
                "launch_app" -> {
                    val packageName = params?.getString("packageName") ?: ""
                    val success = actionDispatcher.launchApp(packageName)
                    promise.resolve(success)
                }
                "emergency_dial" -> {
                    val number = params?.getString("phoneNumber") ?: "911"
                    val success = actionDispatcher.triggerEmergencyShortcut(number)
                    promise.resolve(success)
                }
                "trigger_haptic" -> {
                    val type = params?.getString("type") ?: "click"
                    actionDispatcher.triggerHapticFeedback(type)
                    promise.resolve(true)
                }
                else -> {
                    promise.reject("UNKNOWN_ACTION", "Unrecognized alert action: $action")
                }
            }
        } catch (e: Exception) {
            promise.reject("ALERT_ACTION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getAlertCapabilities(promise: Promise) {
        try {
            val ringerMode = when (audioManager.ringerMode) {
                AudioManager.RINGER_MODE_SILENT -> "silent"
                AudioManager.RINGER_MODE_VIBRATE -> "vibrate"
                else -> "normal"
            }

            val hasDndPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager.isNotificationPolicyAccessGranted
            } else {
                true
            }

            val isDndActive = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && hasDndPermission) {
                notificationManager.currentInterruptionFilter != NotificationManager.INTERRUPTION_FILTER_ALL
            } else {
                false
            }

            val map = Arguments.createMap().apply {
                putString("ringerMode", ringerMode)
                putBoolean("hasDndPermission", hasDndPermission)
                putBoolean("isDndActive", isDndActive)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CAPABILITIES_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun playAlertSound(soundType: String, promise: Promise) {
        try {
            actionDispatcher.playAlertSound(soundType)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SOUND_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun triggerHapticFeedback(type: String, promise: Promise) {
        try {
            actionDispatcher.triggerHapticFeedback(type)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("HAPTIC_ERROR", e.message, e)
        }
    }
}

