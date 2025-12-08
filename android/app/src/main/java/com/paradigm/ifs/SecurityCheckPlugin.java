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
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0
            ) != 0;
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Check for Mock Location (simplified: usually relying on dev options being off is enough, 
        // but recent Androids allow "Select mock location app". 
        // Checking if ANY mock location app is selected is non-trivial without specific permissions or checking list of all apps.
        // However, if Dev Options is OFF, then Mock Location is effectively disabled for the user interface.
        // We will just return the dev options status as the primary gate as requested.
        
        ret.put("developerMode", devOptionsEnabled);
        
        // We can add more checks here if needed, e.g. checking for rooted devices.
        
        call.resolve(ret);
    }
}
