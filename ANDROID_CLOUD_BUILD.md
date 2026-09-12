# Koupl — build the Android APK in the cloud (no laptop needed)

You can get an installable Koupl APK entirely from your phone, using GitHub
Actions. No Android Studio, no Java, no SDK on your device.

Nothing about the app changes: same 28 games, same accounts, rooms, chat and
branding. This only builds the Android wrapper.

---

## 1. Connect the project to GitHub (once)

In Lovable, on desktop or mobile browser:

1. Open the project.
2. Tap the **+** (plus) menu next to the chat box → **GitHub** → **Connect project**.
3. Authorize the Lovable GitHub App and choose your GitHub account.
4. Tap **Create Repository**.

Lovable now pushes all project files — including the Android project and the
build workflow — to that repository, and keeps them in sync automatically.

---

## 2. Run the build from your phone

1. Open your repository on github.com (mobile browser works; the GitHub mobile
   app cannot start workflows).
2. Tap **Actions**.
3. Pick **Android Debug APK** in the left list (tap the ☰ / "Workflows" list).
4. Tap **Run workflow** → **Run workflow**.
5. Wait about 5–15 minutes for the first run.

The workflow installs dependencies, builds the web app, runs `npx cap sync
android`, installs Java 21 and the Android SDK, and builds the debug APK.

---

## 3. Download and install the APK

1. Open the finished run in **Actions**.
2. Scroll to **Artifacts** → tap **koupl-debug-apk** — it downloads a `.zip`.
3. Open the zip with your phone's Files app and extract `app-debug.apk`.
4. Tap the APK. Android asks to allow installing from this source — allow it
   for your browser/Files app, then tap **Install**.

The debug APK is for your own testing. It cannot be uploaded to the Play Store.

---

## 4. What the app loads

The Android app is a WebView shell around the published Koupl site
(`https://koupl-connect-play.lovable.app`). Accounts, rooms, realtime chat and
all games work exactly as on the web, and future Lovable changes appear in the
installed app without rebuilding the APK.

To point the shell at a different domain, change `APP_URL` in
`capacitor.config.ts` and the allowed hosts next to it.

---

## 5. Signed release APK / AAB (Play Store) — separate step

The debug workflow above deliberately does **no** signing, and this repository
contains **no** keys. A Play Store build needs a keystore that only you create
and hold.

You would need these four GitHub repository secrets
(Repo → Settings → Secrets and variables → Actions → New repository secret):

| Secret name              | What it holds                                         |
| ------------------------ | ----------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64` | Your `.keystore` / `.jks` file, base64-encoded         |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password you chose                      |
| `ANDROID_KEY_ALIAS`      | The key alias inside the keystore (e.g. `koupl`)       |
| `ANDROID_KEY_PASSWORD`   | The password for that alias                            |

Creating the keystore requires a machine with the Java `keytool` command, or a
trusted keystore-generation service. Keep the file and passwords backed up
forever — losing them means you can never update the app on Play.

Once those secrets exist, a release workflow would decode the keystore into
`android/keystore.properties` (the signing hook is already wired in
`android/app/build.gradle`) and run `./gradlew bundleRelease`. Publishing also
requires a paid Google Play Console account, store listing, content rating and
privacy policy — all manual steps outside this project.

See `ANDROID_BUILD.md` for the local Android Studio equivalents.
