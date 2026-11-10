package com.key.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import com.key.MainActivity
import com.key.R
import com.key.hardware.KeyActionDispatcher
import com.key.overlay.FloatingKeyManager
import com.key.preferences.KeyPreferences
import org.json.JSONObject

class FloatingKeyService : Service() {

    companion object {
        private const val TAG = "FloatingKeyService"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "floating_keys_service_channel"

        const val ACTION_START = "com.key.action.START"
        const val ACTION_STOP = "com.key.action.STOP"
        const val ACTION_TOGGLE_VISIBILITY = "com.key.action.TOGGLE_VISIBILITY"
        const val ACTION_SHOW = "com.key.action.SHOW"
        const val ACTION_HIDE = "com.key.action.HIDE"
        const val ACTION_UPDATE_CONFIG = "com.key.action.UPDATE_CONFIG"
        const val ACTION_TOGGLE_VOLUME_DIAL = "com.key.action.TOGGLE_VOLUME_DIAL"

        var isRunning = false
            private set
        var instance: FloatingKeyService? = null
            private set
    }

    private var floatingKeyManager: FloatingKeyManager? = null
    private lateinit var actionDispatcher: KeyActionDispatcher

    override fun onCreate() {
        super.onCreate()
        instance = this
        actionDispatcher = KeyActionDispatcher(this)
        floatingKeyManager = FloatingKeyManager(this, actionDispatcher)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        Log.d(TAG, "onStartCommand with action: $action")

        when (action) {
            ACTION_STOP -> {
                stopForegroundService()
                return START_NOT_STICKY
            }

            ACTION_TOGGLE_VISIBILITY -> {
                floatingKeyManager?.toggleVisibility()
            }

            ACTION_SHOW -> {
                floatingKeyManager?.show()
            }

            ACTION_TOGGLE_VOLUME_DIAL -> {
                floatingKeyManager?.toggleVolumeDial()
            }

            ACTION_HIDE -> {
                floatingKeyManager?.hide()
            }

            ACTION_UPDATE_CONFIG -> {
                val configStr = intent?.getStringExtra("config") ?: KeyPreferences.getConfigJson(this)
                try {
                    val json = JSONObject(configStr)
                    floatingKeyManager?.updateConfiguration(json)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse update config JSON", e)
                }
            }

            ACTION_START -> {
                if (!Settings.canDrawOverlays(this)) {
                    Log.w(TAG, "Cannot start overlay: SYSTEM_ALERT_WINDOW not granted")
                    stopSelf()
                    return START_NOT_STICKY
                }

                startForegroundWithNotification()
                floatingKeyManager?.attachOverlay()
                isRunning = true
                KeyPreferences.setOverlayEnabled(this, true)
            }
        }

        return START_STICKY
    }

    private fun startForegroundWithNotification() {
        val notification = buildForegroundNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val fgsType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            } else {
                0
            }
            startForeground(NOTIFICATION_ID, notification, fgsType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleIntent = Intent(this, FloatingKeyService::class.java).apply {
            action = ACTION_TOGGLE_VISIBILITY
        }
        val togglePendingIntent = PendingIntent.getService(
            this,
            1,
            toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Virtual Hardware Keys")
            .setContentText("Floating hardware controls active")
            .setSmallIcon(android.R.drawable.ic_lock_power_off)
            .setContentIntent(openPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(
                android.R.drawable.ic_menu_view,
                "Show / Hide",
                togglePendingIntent
            )
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Floating Keys Background Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps Virtual Hardware Keys accessible above other applications"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun updateConfig(config: JSONObject) {
        floatingKeyManager?.updateConfiguration(config)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        floatingKeyManager?.onConfigurationChanged()
    }

    private fun stopForegroundService() {
        isRunning = false
        floatingKeyManager?.detachOverlay()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        floatingKeyManager?.detachOverlay()
        if (instance == this) {
            instance = null
        }
        Log.d(TAG, "FloatingKeyService destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

