package com.key.hardware

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.key.accessibility.KeyAccessibilityService
import com.key.receivers.AdminReceiver

class KeyActionDispatcher(private val context: Context) {

    companion object {
        private const val TAG = "KeyActionDispatcher"
        private const val ALERT_CHANNEL_ID = "virtual_key_alert_channel"
    }

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        createNotificationChannelIfNeeded()
    }

    private fun createNotificationChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "Virtual Key Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications triggered from the Virtual Alert Key"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun lockScreen(): Boolean {
        // Attempt 1: Accessibility Service (available on Android 9+ / API 28+)
        if (KeyAccessibilityService.isRunning) {
            val locked = KeyAccessibilityService.lockScreen()
            if (locked) {
                Log.d(TAG, "Screen locked via AccessibilityService")
                return true
            }
        }

        // Attempt 2: DevicePolicyManager (Device Administrator)
        val adminComponent = AdminReceiver.getComponentName(context)
        if (devicePolicyManager.isAdminActive(adminComponent)) {
            try {
                devicePolicyManager.lockNow()
                Log.d(TAG, "Screen locked via DevicePolicyManager")
                return true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to lock via DevicePolicyManager", e)
            }
        }

        showToastOnMain("Lock Screen requires Accessibility or Device Admin permission")
        return false
    }

    fun openPowerMenu(): Boolean {
        if (KeyAccessibilityService.isRunning) {
            val opened = KeyAccessibilityService.openPowerMenu()
            if (opened) {
                Log.d(TAG, "Power menu opened via AccessibilityService")
                return true
            }
        }
        showToastOnMain("Power Menu requires Virtual Key Accessibility Service")
        return false
    }

    fun increaseVolume(streamTypeStr: String = "media", showUi: Boolean = true, step: Int = 1): Int {
        val stream = getStreamType(streamTypeStr)
        val flags = if (showUi) AudioManager.FLAG_SHOW_UI or AudioManager.FLAG_PLAY_SOUND else 0
        for (i in 0 until step.coerceAtLeast(1)) {
            audioManager.adjustStreamVolume(stream, AudioManager.ADJUST_RAISE, flags)
        }
        return audioManager.getStreamVolume(stream)
    }

    fun decreaseVolume(streamTypeStr: String = "media", showUi: Boolean = true, step: Int = 1): Int {
        val stream = getStreamType(streamTypeStr)
        val flags = if (showUi) AudioManager.FLAG_SHOW_UI or AudioManager.FLAG_PLAY_SOUND else 0
        for (i in 0 until step.coerceAtLeast(1)) {
            audioManager.adjustStreamVolume(stream, AudioManager.ADJUST_LOWER, flags)
        }
        return audioManager.getStreamVolume(stream)
    }

    fun setVolumeLevel(streamTypeStr: String = "media", level: Int, showUi: Boolean = true): Int {
        val stream = getStreamType(streamTypeStr)
        val max = audioManager.getStreamMaxVolume(stream)
        val target = level.coerceIn(0, max)
        val flags = if (showUi) AudioManager.FLAG_SHOW_UI or AudioManager.FLAG_PLAY_SOUND else 0
        audioManager.setStreamVolume(stream, target, flags)
        return audioManager.getStreamVolume(stream)
    }

    fun setMaxVolume(streamTypeStr: String = "media", showUi: Boolean = true): Int {
        val stream = getStreamType(streamTypeStr)
        val max = audioManager.getStreamMaxVolume(stream)
        return setVolumeLevel(streamTypeStr, max, showUi)
    }

    fun muteVolume(streamTypeStr: String = "media", showUi: Boolean = true): Int {
        return setVolumeLevel(streamTypeStr, 0, showUi)
    }

    fun getStreamVolume(streamTypeStr: String = "media"): Int {
        return audioManager.getStreamVolume(getStreamType(streamTypeStr))
    }

    fun getStreamMaxVolume(streamTypeStr: String = "media"): Int {
        return audioManager.getStreamMaxVolume(getStreamType(streamTypeStr))
    }

    fun toggleSilentMode(): String {
        return try {
            val currentMode = audioManager.ringerMode
            when (currentMode) {
                AudioManager.RINGER_MODE_NORMAL -> {
                    audioManager.ringerMode = AudioManager.RINGER_MODE_VIBRATE
                    showToastOnMain("Ringer: Vibrate")
                    "vibrate"
                }
                AudioManager.RINGER_MODE_VIBRATE -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !notificationManager.isNotificationPolicyAccessGranted) {
                        audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
                        showToastOnMain("Ringer: Normal")
                        "normal"
                    } else {
                        audioManager.ringerMode = AudioManager.RINGER_MODE_SILENT
                        showToastOnMain("Ringer: Silent")
                        "silent"
                    }
                }
                AudioManager.RINGER_MODE_SILENT -> {
                    audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
                    showToastOnMain("Ringer: Normal")
                    "normal"
                }
                else -> {
                    audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
                    "normal"
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Notification policy access required to set silent mode", e)
            showToastOnMain("DND / Notification Policy permission required for Silent mode")
            "permission_required"
        }
    }

    fun toggleDND(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!notificationManager.isNotificationPolicyAccessGranted) {
                showToastOnMain("Notification Policy access required to toggle DND")
                return false
            }

            val currentFilter = notificationManager.currentInterruptionFilter
            val newFilter = if (currentFilter == NotificationManager.INTERRUPTION_FILTER_ALL) {
                NotificationManager.INTERRUPTION_FILTER_PRIORITY
            } else {
                NotificationManager.INTERRUPTION_FILTER_ALL
            }
            notificationManager.setInterruptionFilter(newFilter)
            val isDndActive = newFilter != NotificationManager.INTERRUPTION_FILTER_ALL
            showToastOnMain(if (isDndActive) "Do Not Disturb: ON" else "Do Not Disturb: OFF")
            return isDndActive
        }
        return false
    }

    fun toggleVibrate(): Boolean {
        return try {
            audioManager.ringerMode = AudioManager.RINGER_MODE_VIBRATE
            showToastOnMain("Ringer: Vibrate mode")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to toggle vibrate", e)
            false
        }
    }

    fun playAlertSound(soundType: String = "beep") {
        Thread {
            try {
                if (soundType == "tone" || soundType == "beep") {
                    val toneGen = ToneGenerator(AudioManager.STREAM_ALARM, 100)
                    toneGen.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 400)
                    mainHandler.postDelayed({
                        toneGen.release()
                    }, 500)
                } else {
                    val alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                    val ringtone = RingtoneManager.getRingtone(context, alertUri)
                    ringtone?.play()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to play alert sound", e)
            }
        }.start()
    }

    fun sendCustomNotification(title: String = "Virtual Key Alert", message: String = "Alert button triggered") {
        try {
            val builder = NotificationCompat.Builder(context, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL)

            notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send notification", e)
        }
    }

    fun launchApp(packageName: String): Boolean {
        if (packageName.isEmpty()) return false
        return try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                true
            } else {
                showToastOnMain("Application not installed: $packageName")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error launching app: $packageName", e)
            false
        }
    }

    fun triggerEmergencyShortcut(phoneNumber: String = "911"): Boolean {
        return try {
            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:${phoneNumber.trim()}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(dialIntent)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open dialer", e)
            false
        }
    }

    fun triggerHapticFeedback(type: String = "click") {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                vibrateWithVibrator(vibrator, type)
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                vibrateWithVibrator(vibrator, type)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error triggering haptic feedback", e)
        }
    }

    private fun vibrateWithVibrator(vibrator: Vibrator?, type: String) {
        if (vibrator == null || !vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val effect = when (type) {
                "heavy" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK)
                "double" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK)
                "tick" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK)
                else -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
            }
            vibrator.vibrate(effect)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val duration = when (type) {
                "heavy" -> 60L
                "double" -> 30L
                "tick" -> 15L
                else -> 30L
            }
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(30L)
        }
    }

    private fun getStreamType(streamTypeStr: String): Int {
        return when (streamTypeStr.lowercase()) {
            "ring" -> AudioManager.STREAM_RING
            "notification" -> AudioManager.STREAM_NOTIFICATION
            "alarm" -> AudioManager.STREAM_ALARM
            "voice" -> AudioManager.STREAM_VOICE_CALL
            else -> AudioManager.STREAM_MUSIC
        }
    }

    private fun showToastOnMain(message: String) {
        mainHandler.post {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }
}

