package com.key

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.key.modules.AlertKeyModule
import com.key.modules.FloatingKeyModule
import com.key.modules.PermissionModule
import com.key.modules.PowerKeyModule
import com.key.modules.VolumeKeyModule

class VirtualKeysPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(
            PowerKeyModule(reactContext),
            VolumeKeyModule(reactContext),
            AlertKeyModule(reactContext),
            FloatingKeyModule(reactContext),
            PermissionModule(reactContext)
        )
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}

