// Local Expo config plugin: makes Kavya relaunch itself automatically after
// the phone reboots, instead of staying off until the user opens it by hand.
//
// It does two things to the native Android project every time `expo prebuild`
// regenerates it:
//   1. Adds the RECEIVE_BOOT_COMPLETED permission to AndroidManifest.xml
//   2. Registers a BootReceiver that listens for ACTION_BOOT_COMPLETED and
//      launches Kavya's main activity.
//
// This brings the app back up on boot. It does NOT keep it running as a
// permanent background service (that needs a foreground service + a
// persistent notification, which is a bigger change) — this covers the
// "band ho jaati thi, ab automatically on ho" request.

const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RECEIVER_CLASS_NAME = 'BootReceiver';

function bootReceiverJavaSource(javaPackage) {
  return `package ${javaPackage};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ${RECEIVER_CLASS_NAME} extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null || intent.getAction() == null) return;
    if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

    Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
    if (launchIntent != null) {
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
      context.startActivity(launchIntent);
    }
  }
}
`;
}

function withBootReceiverSource(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const javaPackage = config.android && config.android.package;
      if (!javaPackage) return config;
      const packagePath = javaPackage.split('.').join('/');
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        packagePath
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${RECEIVER_CLASS_NAME}.java`), bootReceiverJavaSource(javaPackage));
      return config;
    },
  ]);
}

function withBootReceiverManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest['uses-permission']) manifest.manifest['uses-permission'] = [];
    const hasPermission = manifest.manifest['uses-permission'].some(
      (entry) => entry.$ && entry.$['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED'
    );
    if (!hasPermission) {
      manifest.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' },
      });
    }

    const application = manifest.manifest.application && manifest.manifest.application[0];
    if (!application) return config;
    if (!application.receiver) application.receiver = [];
    const alreadyRegistered = application.receiver.some(
      (entry) => entry.$ && entry.$['android:name'] === `.${RECEIVER_CLASS_NAME}`
    );
    if (!alreadyRegistered) {
      application.receiver.push({
        $: {
          'android:name': `.${RECEIVER_CLASS_NAME}`,
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [
          { action: [{ $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } }] },
        ],
      });
    }

    return config;
  });
}

module.exports = function withBootAutostart(config) {
  config = withBootReceiverManifest(config);
  config = withBootReceiverSource(config);
  return config;
};
