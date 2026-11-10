package com.key.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.key.preferences.KeyPreferences
import com.key.services.FloatingKeyService

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        Log.d(TAG, "Received broadcast action: $action")

        if (Intent.ACTION_BOOT_COMPLETED == action ||
            Intent.ACTION_MY_PACKAGE_REPLACED == action ||
            "android.intent.action.QUICKBOOT_POWERON" == action
        ) {
            val isAutoStartEnabled = KeyPreferences.isBootAutoStartEnabled(context)
            val isOverlayEnabled = KeyPreferences.isOverlayEnabled(context)
            val canDrawOverlays = Settings.canDrawOverlays(context)

            Log.d(TAG, "Boot check: autoStart=$isAutoStartEnabled, overlayEnabled=$isOverlayEnabled, canDraw=$canDrawOverlays")

            if (isAutoStartEnabled && isOverlayEnabled && canDrawOverlays) {
                try {
                    val serviceIntent = Intent(context, FloatingKeyService::class.java).apply {
                        this.action = FloatingKeyService.ACTION_START
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        ContextCompat.startForegroundService(context, serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                    Log.d(TAG, "FloatingKeyService started from boot receiver")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to start FloatingKeyService on boot", e)
                }
            }
        }
    }
}

