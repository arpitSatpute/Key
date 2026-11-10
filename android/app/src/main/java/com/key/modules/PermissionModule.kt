package com.key.modules

import android.app.NotificationManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.key.accessibility.KeyAccessibilityService
import com.key.receivers.AdminReceiver

class PermissionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val notificationManager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private val devicePolicyManager = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager

    override fun getName(): String = "PermissionModule"

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        try {
            val canDraw = Settings.canDrawOverlays(reactApplicationContext)
            promise.resolve(canDraw)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            val context = reactApplicationContext.currentActivity ?: reactApplicationContext
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REQUEST_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkDeviceAdminStatus(promise: Promise) {
        try {
            val adminComponent = AdminReceiver.getComponentName(reactApplicationContext)
            val isAdmin = devicePolicyManager.isAdminActive(adminComponent)
            promise.resolve(isAdmin)
        } catch (e: Exception) {
            promise.reject("ADMIN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestDeviceAdmin(promise: Promise) {
        try {
            val adminComponent = AdminReceiver.getComponentName(reactApplicationContext)
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "Enables the Virtual Power Key to lock your screen directly on tap."
                )
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val context = reactApplicationContext.currentActivity ?: reactApplicationContext
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REQUEST_ADMIN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun removeDeviceAdmin(promise: Promise) {
        try {
            val adminComponent = AdminReceiver.getComponentName(reactApplicationContext)
            devicePolicyManager.removeActiveAdmin(adminComponent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REMOVE_ADMIN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkAccessibilityStatus(promise: Promise) {
        try {
            val isRunning = KeyAccessibilityService.isRunning
            promise.resolve(isRunning)
        } catch (e: Exception) {
            promise.reject("ACCESSIBILITY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val context = reactApplicationContext.currentActivity ?: reactApplicationContext
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkNotificationPolicyAccess(promise: Promise) {
        try {
            val hasAccess = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager.isNotificationPolicyAccessGranted
            } else {
                true
            }
            promise.resolve(hasAccess)
        } catch (e: Exception) {
            promise.reject("POLICY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestNotificationPolicyAccess(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val context = reactApplicationContext.currentActivity ?: reactApplicationContext
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("REQUEST_POLICY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkNotificationPermission(promise: Promise) {
        try {
            val enabled = NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled()
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        try {
            val context = reactApplicationContext.currentActivity ?: reactApplicationContext
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, reactApplicationContext.packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REQUEST_NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkBatteryOptimizationStatus(promise: Promise) {
        try {
            val isIgnoring = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
            } else {
                true
            }
            promise.resolve(isIgnoring)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimization(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val context = reactApplicationContext.currentActivity ?: reactApplicationContext
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("REQUEST_BATTERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getAllPermissionsStatus(promise: Promise) {
        try {
            val adminComponent = AdminReceiver.getComponentName(reactApplicationContext)
            val hasAdmin = devicePolicyManager.isAdminActive(adminComponent)
            val hasAccessibility = KeyAccessibilityService.isRunning
            val hasOverlay = Settings.canDrawOverlays(reactApplicationContext)
            val hasDnd = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager.isNotificationPolicyAccessGranted
            } else {
                true
            }
            val hasNotification = NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled()
            val isBatteryOptimized = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
            } else {
                true
            }

            val map = Arguments.createMap().apply {
                putBoolean("overlay", hasOverlay)
                putBoolean("deviceAdmin", hasAdmin)
                putBoolean("accessibility", hasAccessibility)
                putBoolean("notificationPolicy", hasDnd)
                putBoolean("notifications", hasNotification)
                putBoolean("batteryOptimizationIgnored", isBatteryOptimized)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message, e)
        }
    }
}

