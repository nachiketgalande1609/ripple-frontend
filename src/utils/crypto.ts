const DB_NAME = "ripple_e2e";
const STORE_NAME = "keys";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storePrivateKey(deviceId: string, key: CryptoKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(key, deviceId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPrivateKey(deviceId: string): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(deviceId);
    req.onsuccess = () => resolve((req.result as CryptoKey) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem("ripple_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("ripple_device_id", deviceId);
  }
  return deviceId;
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    false, // private key is non-extractable — stays inside browser's crypto subsystem
    ["encrypt", "decrypt"]
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    binary.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

export interface EncryptedPayload {
  /** base64 AES-GCM ciphertext */
  ciphertext: string;
  /** base64 AES-GCM IV */
  iv: string;
  /** AES key encrypted once per recipient device */
  keys: { deviceId: string; encryptedKey: string }[];
}

export async function encryptMessage(
  plaintext: string,
  recipients: { deviceId: string; publicKey: CryptoKey }[]
): Promise<EncryptedPayload> {
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // exportable so we can wrap it with each recipient's RSA key
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  const keys = await Promise.all(
    recipients.map(async ({ deviceId, publicKey }) => {
      const encBuf = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawAesKey);
      return {
        deviceId,
        encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encBuf))),
      };
    })
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuf))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
    keys,
  };
}

export async function decryptMessage(
  ciphertext: string,
  iv: string,
  encryptedKey: string,
  privateKey: CryptoKey
): Promise<string> {
  const encKeyBuf = Uint8Array.from(atob(encryptedKey), (c) => c.charCodeAt(0));
  const rawAesKey = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encKeyBuf);

  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const ciphertextBuf = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const ivBuf = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

  const plaintextBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuf }, aesKey, ciphertextBuf);
  return new TextDecoder().decode(plaintextBuf);
}
