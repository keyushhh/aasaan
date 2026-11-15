/**
 * The app PIN is never stored as typed: only a SHA-256 of it, salted with the mobile number.
 * ponytail: a 4-digit PIN hashed in the browser can be brute-forced by anyone holding the phone's storage;
 * a real build keeps it in the device keystore (Android Keystore, iOS Keychain) behind biometrics.
 */
export async function hashPin(pin: string, salt: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
