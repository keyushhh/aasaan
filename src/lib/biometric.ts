/**
 * Fingerprint and face unlock through WebAuthn: the phone's own biometric prompt guards a key that never leaves it.
 * Aasaan keeps only the key's id, never the fingerprint or face.
 * ponytail: the signed answer isn't checked by a server here; a real build verifies it before trusting the unlock.
 */
const random = () => crypto.getRandomValues(new Uint8Array(32));
const toB64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function bioAvailable() {
  try {
    return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

/** Ask the phone to set up a key unlocked by its fingerprint or face. Resolves with the key's id. */
export async function enrollBio(name: string, mobile: string) {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: random(), rp: { name: 'Aasaan' }, user: { id: new TextEncoder().encode(mobile), name: mobile, displayName: name },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000,
    },
  })) as PublicKeyCredential;
  return toB64(cred.rawId);
}

/** Prompt for the fingerprint or face that guards the key. Rejects if the person cancels or doesn't match. */
export async function verifyBio(id: string) {
  await navigator.credentials.get({ publicKey: { challenge: random(), allowCredentials: [{ type: 'public-key', id: fromB64(id) }], userVerification: 'required', timeout: 60000 } });
}
