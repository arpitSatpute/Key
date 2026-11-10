package com.key.modules

import android.app.admin.DevicePolicyManager
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.key.accessibility.KeyAccessibilityService
import com.key.hardware.KeyActionDispatcher
import com.key.receivers.AdminReceiver

class PowerKeyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val actionDispatcher = KeyActionDispatcher(reactContext)
    private val devicePolicyManager = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    override fun getName(): String = "PowerKeyModule"

    @ReactMethod
    fun lockScreen(promise: Promise) {
        try {
            val success = actionDispatcher.lockScreen()
            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("LOCK_FAILED", "Screen lock could not be performed. Ensure Device Admin or Accessibility permission is granted.")
            }
        } catch (e: Exception) {
            promise.reject("LOCK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openPowerMenu(promise: Promise) {
        try {
            val success = actionDispatcher.openPowerMenu()
            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("POWER_MENU_FAILED", "Power dialog requires Virtual Key Accessibility Service to be enabled.")
            }
        } catch (e: Exception) {
            promise.reject("POWER_MENU_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getPowerCapabilities(promise: Promise) {
        try {
            val adminComponent = AdminReceiver.getComponentName(reactApplicationContext)
            val hasAdmin = devicePolicyManager.isAdminActive(adminComponent)
            val hasAccessibility = KeyAccessibilityService.isRunning

            val map = Arguments.createMap().apply {
                putBoolean("hasDeviceAdmin", hasAdmin)
                putBoolean("hasAccessibility", hasAccessibility)
                putBoolean("canLockScreen", hasAdmin || (hasAccessibility && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P))
                putBoolean("canOpenPowerMenu", hasAccessibility)
                putInt("androidVersion", Build.VERSION.SDK_INT)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("CAPABILITIES_ERROR", e.message, e)
        }
    }
}

