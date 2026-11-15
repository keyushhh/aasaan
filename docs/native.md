# Going native

The web build simulates every step that needs the phone or a licensed server. This plan says how to make each one real, what it needs outside the code, and where it lands in this repo.

What is simulated today:

| Step | Today | Where |
|---|---|---|
| SIM list | Mock returns two fixed SIMs | `AuthService.sims` in `src/data/mock/index.ts` |
| SMS device binding | Mock waits, then accepts SIM 1 | `AuthService.verifySim` |
| OTP fallback | Any number, OTP 123456 | `AuthService.sendOtp`, `verifyOtp` |
| Aadhaar face check | Camera preview plus a timer | `FaceStep` in `src/features/auth/Login.tsx`, `AuthService.faceMatch` |
| App PIN | SHA-256 of PIN salted with the mobile number, kept in `localStorage` | `src/lib/pin.ts`, `Session.pin` in `src/app/session.ts` |
| Fingerprint or face unlock | WebAuthn with a random local challenge, never checked by a server | `src/lib/biometric.ts`, `Session.bio` |
| Reminders | A list of keys in the session, no notification is ever sent | `Session.reminders`, `src/features/home/Home.tsx` |
| Outbox recovery | A toast, only while the app is open | `onRecovered` in `src/app/App.tsx` |
| Screen privacy | None | |

## 1. Shell: Capacitor

Use Capacitor. It runs this exact Vite build in a system WebView, so the screens, tokens, i18n, data layer and tests stay as they are. Hash URLs already work from a local file origin. Native features arrive as plugins called from TypeScript, and where no plugin fits we write a small one in Kotlin and Swift. React Native would mean rewriting every screen and the CSS Modules design system for little gain: none of the hard parts here (SIM, SMS, UIDAI, keystore) are easier in React Native, and all of them need native code either way.

Steps:

- Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`. Run `npx cap init`, set `webDir` to `dist`, then `npx cap add android` and `npx cap add ios`.
- Add `VITE_DATA_SOURCE=real` for native builds (see section 8).
- Keep one check for "are we native": `Capacitor.isNativePlatform()`. Use it only inside `src/lib` and `src/data`, never in components.
- Check current Capacitor docs for the supported Android `minSdkVersion` and iOS deployment target, and pin plugin versions to the same major.

## 2. SIM detection and SMS device binding

### How binding works end to end

1. App asks the server for a binding token. The server ties it to the claimed mobile number, a device id and a short expiry.
2. App sends one SMS containing that token from the chosen SIM to our inbound number.
3. The operator delivers it to the server with the real sender number (MSISDN).
4. Server checks: token valid, not expired, sender equals the claimed mobile. If so, the device is bound. If the sender differs, it returns a mismatch, which the app already shows as `SimMismatch`.
5. App waits on the result (poll or a short long-poll with a timeout of about 60 seconds).

The trust comes from step 3, not from anything the phone reports. The phone's own view of its number is only used to preselect a SIM.

### Server side

- Rent an inbound long code or virtual mobile number from an SMS aggregator or operator. It must pass the true sender number through in its webhook.
- Webhook endpoint: parse sender and body, look up the token, record the result. Rate limit per number and per device.
- Tokens: single use, about 10 minutes, random, not guessable from the mobile number.
- Check with the provider how sender numbers appear for ported numbers and for international roaming.

### Android

- List SIMs: `SubscriptionManager.getActiveSubscriptionInfoList()`. Needs `READ_PHONE_STATE`. Each entry gives the subscription id, slot index, carrier name and display name.
- Read the number: `SubscriptionManager.getPhoneNumber(subId)` on Android 13 and later, `SubscriptionInfo.getNumber()` before that. Needs `READ_PHONE_NUMBERS`. Many operators in India do not write the number to the SIM, so expect it to be empty often. When empty, show the SIM by slot and carrier and let the person pick.
- Send the SMS: get a `SmsManager` for the chosen subscription (`createForSubscriptionId(subId)` on Android 12 and later, `getSmsManagerForSubscriptionId(subId)` before) and call `sendTextMessage` with a `sentIntent` so we know it left the phone. Needs `SEND_SMS`.
- Google Play restricts `SEND_SMS` and the phone number permissions. You must file a Permissions Declaration and fit an allowed use case. Check the current Play "SMS and Call Log" and "phone number" policies before building on this. UPI apps do device binding this way, so there is precedent, but approval is not automatic.
- No-permission fallback: open the SMS app with `Intent.ACTION_SENDTO` and an `smsto:` URI with the body filled in. The person taps send. It cannot reliably choose the SIM, so the server check still decides.
- Write this as one small Capacitor plugin (for example `SimBinding`) with `listSims()` and `sendBindingSms({ subId, to, body })`. Do not pull in a general SMS plugin for two calls.

### iOS

- No API gives the SIM's phone number. `CTTelephonyNetworkInfo` gives carrier details only, and much of that is deprecated or returns placeholder values on recent iOS. Do not rely on it.
- No app can send an SMS silently. The closest is `MFMessageComposeViewController` with the recipient and body filled in; the person must tap send. Sender number is still verified by the server, so this is a valid binding, just with one tap.
- Default on iOS: SMS OTP. Use `autocomplete="one-time-code"` on the OTP field so iOS offers the code from Messages. Offer the composer path as an option.
- `sims()` on iOS returns an empty list, and the UI skips straight to the composer or OTP. The onboarding already has OTP as the fallback step.

### OTP on Android

- Use the SMS Retriever API from Google Play services. No SMS permission is needed. The server appends the app's hash to the OTP message, and the app reads it automatically. Check current docs for the message format and how to compute the hash for the release signing key.

## 3. Aadhaar face authentication

This cannot be done in the app alone. Only UIDAI can match a face against the Aadhaar photo, and only a licensed entity may send it an authentication request.

What is needed:

- An AUA (Authentication User Agency) licence from UIDAI for yes or no authentication. A KUA (e-KYC User Agency) licence as well if you need the name, date of birth and photo back, which the "is this you" step does today. This is a regulatory process with audits and agreements, not a sign-up form. A government department or a bank that already holds the licence is the realistic route for a prototype like this. Sub-AUA arrangements under an existing AUA are another route; check UIDAI's current rules.
- Access through an ASA (Authentication Service Agency) to reach UIDAI's servers.
- The AUA's signing certificate and UIDAI's public key, held on the server in an HSM.

How the capture works on Android:

1. Server builds the PID options for a face capture, including a transaction id and, for e-KYC, the signed `wadh` value. Check UIDAI's current Face RD API spec for the exact fields.
2. App launches the UIDAI AadhaarFaceRD app with an intent, passing that request. Check the spec for the current intent action and extras. If the RD app is not installed, send the person to the Play Store listing.
3. AadhaarFaceRD does the liveness check and capture itself, encrypts the result for UIDAI and returns an encrypted PID block. The app never sees a usable face image.
4. App sends the PID block to our server. The server wraps it in the auth or e-KYC XML, signs it, and sends it through the ASA. UIDAI returns yes or no, and for e-KYC the encrypted resident data.

Why not client only: the PID block is encrypted for UIDAI, the request must be signed with the AUA's key, and the AUA key can never ship in an app.

iOS: check whether UIDAI offers a face RD option on iOS when you build this. If not, iOS uses Aadhaar OTP authentication (also through the AUA) or another identity check the department accepts.

In the app: `FaceStep` stops using `getUserMedia`. On native it calls a small plugin that fires the intent and returns the PID block, then `api.auth.faceMatch(mobile)` sends it to the server. To carry the block, `faceMatch` needs one optional argument, or the real adapter calls the plugin itself so the interface stays `faceMatch(mobile)`. Prefer the second.

## 4. App PIN and biometrics

Today the PIN hash and the WebAuthn credential id sit in `localStorage`. A 4-digit PIN hashed with SHA-256 is brute-forced in milliseconds by anyone with the app's storage.

### Option A: device keystore (works offline)

- Android: create a non-exportable HMAC key in the Android Keystore (`KeyGenParameterSpec`, hardware backed or StrongBox where available). Store HMAC(PIN) rather than SHA-256(PIN). Without the device's keystore the stored value is useless, so offline guessing is no longer possible. Count failed attempts and wipe the key after a fixed number.
- iOS: the Secure Enclave does not hold symmetric keys, so keep a random 32-byte secret in the Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` and HMAC with that. Same attempt limit.
- Biometric unlock, Android: a second Keystore key with `setUserAuthenticationRequired(true)`, unlocked through `BiometricPrompt` with a `CryptoObject`. Set the invalidation behaviour so a newly enrolled fingerprint breaks the key.
- Biometric unlock, iOS: a Keychain item or a Secure Enclave key protected by `SecAccessControl` with `.biometryCurrentSet`, read through `LocalAuthentication` (`LAContext`). Add `NSFaceIDUsageDescription` to `Info.plist`.
- Move `Session.pin` and `Session.bio` out of `localStorage` into this secure storage. Several community Capacitor plugins wrap Keychain, Keystore and biometrics; check current docs and maintenance before choosing one, or write a small plugin with the four calls below.

### Option B: server-verified passkeys (recommended once there is a backend)

- Keep the WebAuthn shape of `src/lib/biometric.ts`, but get the challenge from the server and send the assertion back for verification. That closes the gap the file's comment already names.
- Inside a WebView, WebAuthn support depends on platform version and setup. Android needs the androidx WebKit library's web authentication support or the Credential Manager API through a plugin. iOS needs associated domains for the relying party. Check current docs for both.
- The PIN then becomes a local convenience lock in front of a server session, not the thing that proves identity, and the server rate limits real sign-ins.

Do A first so offline unlock is safe. Add B when the backend exists.

### Same signatures

- `src/lib/pin.ts`: keep `hashPin(pin, salt): Promise<string>`. Native build calls the keystore HMAC; web keeps SHA-256. Callers in `Login.tsx` do not change.
- `src/lib/biometric.ts`: keep `bioAvailable()`, `enrollBio(name, mobile)` returning a key id, and `verifyBio(id)` that rejects on cancel or no match. Native build calls `BiometricPrompt` or `LAContext`.
- Pick the implementation inside each module with `Capacitor.isNativePlatform()`. No new abstraction is needed.

## 5. Push notifications

- Plugin: `@capacitor/push-notifications`. Android uses FCM (add `google-services.json`). iOS uses APNs (push capability, an APNs key). FCM can also deliver to iOS if you want one sender; check current docs.
- Android 13 and later need the `POST_NOTIFICATIONS` runtime permission. Ask at the moment someone turns on a reminder, not at launch.
- On sign-in, send the device token to the server with the mobile number. Refresh it when the plugin reports a new one.

Server pieces:

- Reminders: today `Session.reminders` is a list of keys that never leaves the phone. Sync it to the server. A scheduler (a cron job or a delayed job queue) sends a notice a set number of days before each deadline and on the day.
- Outbox recovery: the outbox lives on the phone, so the server cannot send the queued claim itself. When the server sees a department come back, it sends a push saying the department is back and there is something waiting. Opening the app drains the outbox through the existing `onRecovered` path. Optionally schedule a background retry with WorkManager (Android) or `BGTaskScheduler` (iOS); check current Capacitor background options first.
- Notification text never contains amounts, document numbers or names. It says what kind of thing happened and asks the person to open the app.

Cheaper first step: `@capacitor/local-notifications` can schedule deadline reminders on the phone with no server at all. Use it until the backend exists.

## 6. Secure screen

- Android: set `WindowManager.LayoutParams.FLAG_SECURE` on the activity window in `MainActivity`. It blocks screenshots and screen recording and blanks the app in the recent apps view. Consider leaving it off on the document share screen if people need to screenshot a QR code, or offer the QR another way.
- iOS: screenshots cannot be blocked. When the scene is about to resign active, cover the window with a blur view (`UIVisualEffectView`) and remove it when the scene becomes active again, so the app switcher snapshot shows nothing. You can also listen for `UIScreen.capturedDidChangeNotification` and hide sensitive content while recording.
- Both are a few lines in the native project. No plugin needed.

## 7. Other native details

- Session and outbox storage: `src/lib/storage.ts` uses `localStorage`, which the OS can clear under storage pressure on iOS. Move it to `@capacitor/preferences` behind the same `read`, `write` and `remove` functions, or keep `localStorage` and accept the risk for non-secret data. Secrets go to section 4 storage only.
- Relaunch PIN: use `@capacitor/app` `appStateChange` to ask for the PIN after the app has been in the background longer than a set time.
- Camera permission strings (`NSCameraUsageDescription`, Android `CAMERA`) are only needed if anything still uses the camera after section 3.

## 8. Where it lands in this codebase

`src/data`:

- Add `src/data/real/` with an `Adapters` object and register it in `SOURCES` in `src/data/index.ts`. Nothing else in the UI changes.
- `AuthService` (in `src/data/services.ts`) gets the first real adapter:
  - `sims(mobile)`: the `SimBinding` plugin on Android, an empty list on iOS and web.
  - `verifySim(mobile, sim)`: get a token from the server, send the SMS through the plugin (or the composer on iOS), wait for the server result, throw `SimMismatch` on a mismatch.
  - `sendOtp`, `verifyOtp`: server calls. Keep throwing `InvalidOtp` on a wrong code.
  - `faceMatch(mobile)`: launch AadhaarFaceRD through a plugin, post the PID block to the server.
  - `identity(mobile)`, `discover(mobile, dept)`: server calls; identity comes from e-KYC.
- `EpfService`, `DocumentsService`, `VehicleService`, `TaxService`, `HealthService`, `ProfileService`, `RequestsService`: real adapters as each department's API access is granted (API Setu, DigiLocker, Parivahan, ABDM, EPFO). These do not depend on going native and can come in any order. Outage, cache and outbox stay in `src/data/department.ts`.
- If the real adapters need a mix of mock and real during the move, build the `real` object by spreading `mockAdapters` and overriding one service at a time.

`src/lib`, same function signatures, native implementation inside:

- `src/lib/pin.ts`: keystore HMAC on native.
- `src/lib/biometric.ts`: `BiometricPrompt` or `LAContext` on native, server-verified WebAuthn later.
- `src/lib/storage.ts`: optional move to `@capacitor/preferences`.

New:

- `android/` and `ios/` projects from Capacitor, with `FLAG_SECURE`, the snapshot blur and the two small plugins (`SimBinding`, `FaceRd`).
- A backend: binding tokens and SMS webhook, OTP, AUA/KUA calls, device tokens, reminder scheduler, department status watcher.

## 9. Order of work

Rough effort for one experienced developer. Licences and store approvals run on their own clock and are the real critical path; start them in week one.

1. Capacitor shell, builds on both platforms, `FLAG_SECURE` and snapshot blur, `localStorage` check. About 1 week.
2. PIN and biometrics on the keystore, secrets out of `localStorage`, relaunch lock. About 1 to 2 weeks.
3. Local notifications for reminders. A few days.
4. Backend skeleton plus SMS OTP with SMS Retriever and iOS one-time-code autofill, as the first real `AuthService` methods. About 2 weeks.
5. SIM listing and SMS device binding on Android, inbound number and webhook, iOS composer option. About 2 to 3 weeks of build, plus the Play permissions review.
6. Push through FCM and APNs, server reminders and outbox recovery notices. About 2 weeks.
7. Server-verified passkeys. About 1 to 2 weeks.
8. Aadhaar face authentication through a licensed AUA/KUA partner. About 3 to 4 weeks of build once access exists; the licence or partnership itself takes months.
9. Department adapters, one at a time, as access is granted. About 1 to 3 weeks each, depending on the API.

Before any of this ships to the public: a security review, a privacy policy, data protection compliance under India's DPDP Act, and the UIDAI audit requirements for anyone handling Aadhaar authentication.
