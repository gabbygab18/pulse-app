'use strict';

// Notarizes the signed macOS build. Runs only on macOS and only when the
// Apple credentials are present in the environment — otherwise it is a no-op,
// so Windows/Linux builds and unsigned local macOS builds still succeed.
//
// Required env for notarization:
//   APPLE_ID                 your Apple Developer account email
//   APPLE_APP_SPECIFIC_PASSWORD  an app-specific password for that account
//   APPLE_TEAM_ID            your 10-char Developer Team ID
// And to actually sign, set CSC_LINK / CSC_KEY_PASSWORD (Developer ID cert).

exports.default = async function notarize(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== 'darwin') return;

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.log('notarize: Apple credentials not set — skipping.');
    return;
  }

  let notarize;
  try {
    ({ notarize } = require('@electron/notarize'));
  } catch {
    console.log('notarize: install @electron/notarize to enable notarization — skipping.');
    return;
  }

  const appName = packager.appInfo.productFilename;
  await notarize({
    appBundleId: 'com.isla.pulse',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
  });
};
