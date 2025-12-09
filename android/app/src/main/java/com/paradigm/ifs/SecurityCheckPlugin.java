package com.paradigm.ifs;

import android.content.Context;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SecurityCheck")
public class SecurityCheckPlugin extends Plugin {

    @PluginMethod
    public void getSecurityStatus(PluginCall call) {
        JSObject ret = new JSObject();
        Context context = getContext();

        boolean devOptionsEnabled = false;
        try {
            devOptionsEnabled = Settings.Global.getInt(
                    context.getContentResolver(),
                    Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) != 0;
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Check for Mock Location
        // ret.put("developerMode", devOptionsEnabled);

        // Check Microphone Permission directly from Manifest
        boolean micGranted = false;
        try {
            micGranted = androidx.core.content.ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED;
        } catch (Exception e) {
            e.printStackTrace();
        }

        ret.put("developerMode", devOptionsEnabled);
        ret.put("microphoneGranted", micGranted);

        call.resolve(ret);
    }
}
