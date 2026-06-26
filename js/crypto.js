// js/crypto.js
// Decrypts the WHOOP snapshot in the browser using the Web Crypto API.
// Must exactly match scripts/sync-whoop.mjs: PBKDF2-SHA256 210000 iterations,
// AES-256-GCM, ciphertext+authTag concatenated (this is the native layout
// SubtleCrypto.encrypt/decrypt already use, so no extra splitting needed).

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 210000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

export async function decryptWhoopBlob(blob, passphrase) {
  const salt = b64ToBytes(blob.salt);
  const iv = b64ToBytes(blob.iv);
  const ciphertext = b64ToBytes(blob.ciphertext);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  const text = new TextDecoder().decode(plainBuf);
  return JSON.parse(text);
}
