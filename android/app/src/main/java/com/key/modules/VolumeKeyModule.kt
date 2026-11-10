package com.key.modules

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.key.hardware.KeyActionDispatcher

class VolumeKeyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val actionDispatcher = KeyActionDispatcher(reactContext)
    private val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    override fun getName(): String = "VolumeKeyModule"

    @ReactMethod
    fun increaseVolume(streamType: String, showUi: Boolean, step: Int, promise: Promise) {
        try {
            val newLevel = actionDispatcher.increaseVolume(streamType, showUi, step)
            val max = actionDispatcher.getStreamMaxVolume(streamType)
            val map = Arguments.createMap().apply {
                putInt("currentVolume", newLevel)
                putInt("maxVolume", max)
                putString("stream", streamType)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("VOLUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun decreaseVolume(streamType: String, showUi: Boolean, step: Int, promise: Promise) {
        try {
            val newLevel = actionDispatcher.decreaseVolume(streamType, showUi, step)
            val max = actionDispatcher.getStreamMaxVolume(streamType)
            val map = Arguments.createMap().apply {
                putInt("currentVolume", newLevel)
                putInt("maxVolume", max)
                putString("stream", streamType)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("VOLUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setVolume(streamType: String, level: Int, showUi: Boolean, promise: Promise) {
        try {
            val newLevel = actionDispatcher.setVolumeLevel(streamType, level, showUi)
            val max = actionDispatcher.getStreamMaxVolume(streamType)
            val map = Arguments.createMap().apply {
                putInt("currentVolume", newLevel)
                putInt("maxVolume", max)
                putString("stream", streamType)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("VOLUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCurrentVolume(streamType: String, promise: Promise) {
        try {
            val cur = actionDispatcher.getStreamVolume(streamType)
            val max = actionDispatcher.getStreamMaxVolume(streamType)
            val map = Arguments.createMap().apply {
                putInt("currentVolume", cur)
                putInt("maxVolume", max)
                putString("stream", streamType)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("VOLUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getMaximumVolume(streamType: String, promise: Promise) {
        try {
            val max = actionDispatcher.getStreamMaxVolume(streamType)
            promise.resolve(max)
        } catch (e: Exception) {
            promise.reject("VOLUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getVolumeLevels(promise: Promise) {
        try {
            val map = Arguments.createMap()

            val streams = listOf("media", "ring", "notification", "alarm", "voice")
            for (stream in streams) {
                val cur = actionDispatcher.getStreamVolume(stream)
                val max = actionDispatcher.getStreamMaxVolume(stream)
                val streamObj = Arguments.createMap().apply {
                    putInt("current", cur)
                    putInt("max", max)
                }
                map.putMap(stream, streamObj)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("VOLUME_ERROR", e.message, e)
        }
    }
}

