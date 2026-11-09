import fs from "fs";
import path from "path";

export interface StoredCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emailVerified: string | null;
  phoneVerified: boolean;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVerificationCode {
  id: string;
  target: string;
  codeHash: string;
  type: string;
  customerId: string | null;
  attempts: number;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface StoredCustomerSession {
  id: string;
  tokenHash: string;
  customerId: string;
  expiresAt: string;
  createdAt: string;
}

export interface StoredPasskey {
  id: string;
  customerId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string | null;
  deviceType: string;
  deviceName: string | null;
  createdAt: string;
}

export interface StoredAddress {
  id: string;
  customerId: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface StoredChallenge {
  challenge: string;
  target: string;
  type: string;
  expiresAt: string;
}

interface DevStoreSchema {
  customers: StoredCustomer[];
  verificationCodes: StoredVerificationCode[];
  sessions: StoredCustomerSession[];
  ownerSessions: { tokenHash: string; userId: string; expiresAt: string }[];
  passkeys: StoredPasskey[];
  addresses: StoredAddress[];
  challenges: StoredChallenge[];
}

const CACHE_FILE = path.join(process.cwd(), ".next", "dev-auth-store.json");

function loadStore(): DevStoreSchema {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return {
    customers: [],
    verificationCodes: [],
    sessions: [],
    ownerSessions: [],
    passkeys: [],
    addresses: [],
    challenges: [],
  };
}

function saveStore(data: DevStoreSchema): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export const devStore = {
  // ---- Customers ----
  findCustomerByEmail(email: string): StoredCustomer | undefined {
    const store = loadStore();
    const norm = email.trim().toLowerCase();
    return store.customers.find((c) => c.email?.toLowerCase() === norm);
  },

  findCustomerByPhone(phone: string): StoredCustomer | undefined {
    const store = loadStore();
    const clean = phone.trim().replace(/\D+/g, "");
    return store.customers.find((c) => c.phone?.replace(/\D+/g, "") === clean);
  },

  findCustomerById(id: string): StoredCustomer | undefined {
    const store = loadStore();
    return store.customers.find((c) => c.id === id);
  },

  upsertCustomer(data: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    accountStatus?: string;
    emailVerified?: Date | null;
  }): StoredCustomer {
    const store = loadStore();
    const existing = data.id
      ? store.customers.find((c) => c.id === data.id)
      : store.customers.find((c) => c.email?.toLowerCase() === data.email.toLowerCase());

    const now = new Date().toISOString();
    if (existing) {
      existing.name = data.name;
      existing.phone = data.phone;
      if (data.accountStatus) existing.accountStatus = data.accountStatus;
      if (data.emailVerified !== undefined) {
        existing.emailVerified = data.emailVerified ? data.emailVerified.toISOString() : null;
      }
      existing.updatedAt = now;
      saveStore(store);
      return existing;
    }

    const newCustomer: StoredCustomer = {
      id: data.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      emailVerified: data.emailVerified ? data.emailVerified.toISOString() : null,
      phoneVerified: false,
      accountStatus: data.accountStatus || "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    store.customers.push(newCustomer);
    saveStore(store);
    return newCustomer;
  },

  // ---- Verification Codes ----
  createVerificationCode(data: {
    target: string;
    codeHash: string;
    type: string;
    customerId?: string | null;
    expiresAt: Date;
  }): StoredVerificationCode {
    const store = loadStore();
    const item: StoredVerificationCode = {
      id: `vc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      target: data.target.toLowerCase(),
      codeHash: data.codeHash,
      type: data.type,
      customerId: data.customerId || null,
      attempts: 0,
      expiresAt: data.expiresAt.toISOString(),
      usedAt: null,
      createdAt: new Date().toISOString(),
    };
    store.verificationCodes.push(item);
    saveStore(store);
    return item;
  },

  findRecentCode(target: string, type: string): StoredVerificationCode | undefined {
    const store = loadStore();
    const norm = target.toLowerCase();
    const matching = store.verificationCodes
      .filter((c) => c.target === norm && c.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matching[0];
  },

  findValidCode(target: string, type: string): StoredVerificationCode | undefined {
    const store = loadStore();
    const norm = target.toLowerCase();
    const now = Date.now();
    const matching = store.verificationCodes
      .filter(
        (c) =>
          c.target === norm &&
          c.type === type &&
          !c.usedAt &&
          new Date(c.expiresAt).getTime() > now,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matching[0];
  },

  markCodeUsed(id: string): void {
    const store = loadStore();
    const code = store.verificationCodes.find((c) => c.id === id);
    if (code) {
      code.usedAt = new Date().toISOString();
      saveStore(store);
    }
  },

  incrementCodeAttempts(id: string): number {
    const store = loadStore();
    const code = store.verificationCodes.find((c) => c.id === id);
    if (code) {
      code.attempts += 1;
      saveStore(store);
      return code.attempts;
    }
    return 1;
  },

  // ---- Customer Sessions ----
  createCustomerSession(data: {
    tokenHash: string;
    customerId: string;
    expiresAt: Date;
  }): StoredCustomerSession {
    const store = loadStore();
    const item: StoredCustomerSession = {
      id: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tokenHash: data.tokenHash,
      customerId: data.customerId,
      expiresAt: data.expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.sessions.push(item);
    saveStore(store);
    return item;
  },

  findSession(tokenHash: string): (StoredCustomerSession & { customer: StoredCustomer }) | null {
    const store = loadStore();
    const session = store.sessions.find((s) => s.tokenHash === tokenHash);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
    const customer = store.customers.find((c) => c.id === session.customerId);
    if (!customer) return null;
    return { ...session, customer };
  },

  deleteSession(tokenHash: string): void {
    const store = loadStore();
    store.sessions = store.sessions.filter((s) => s.tokenHash !== tokenHash);
    saveStore(store);
  },

  // ---- Owner Sessions ----
  createOwnerSession(tokenHash: string, userId: string, expiresAt: Date): void {
    const store = loadStore();
    if (!store.ownerSessions) store.ownerSessions = [];
    store.ownerSessions.push({
      tokenHash,
      userId,
      expiresAt: expiresAt.toISOString(),
    });
    saveStore(store);
  },

  findOwnerSession(tokenHash: string): { userId: string; expiresAt: string } | null {
    const store = loadStore();
    if (!store.ownerSessions) return null;
    const s = store.ownerSessions.find((x) => x.tokenHash === tokenHash);
    if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
    return s;
  },

  deleteOwnerSession(tokenHash: string): void {
    const store = loadStore();
    if (!store.ownerSessions) return;
    store.ownerSessions = store.ownerSessions.filter((x) => x.tokenHash !== tokenHash);
    saveStore(store);
  },

  // ---- Passkeys ----
  findPasskeysByCustomerId(customerId: string): StoredPasskey[] {
    const store = loadStore();
    return store.passkeys.filter((p) => p.customerId === customerId);
  },

  findPasskeyByCredentialId(credentialId: string): StoredPasskey | undefined {
    const store = loadStore();
    return store.passkeys.find((p) => p.credentialId === credentialId);
  },

  createPasskey(data: {
    customerId: string;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports?: string;
    deviceType?: string;
    deviceName?: string;
  }): StoredPasskey {
    const store = loadStore();
    const item: StoredPasskey = {
      id: `pk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: data.customerId,
      credentialId: data.credentialId,
      publicKey: data.publicKey,
      counter: data.counter,
      transports: data.transports || null,
      deviceType: data.deviceType || "singleDevice",
      deviceName: data.deviceName || "Primary Device",
      createdAt: new Date().toISOString(),
    };
    store.passkeys.push(item);
    saveStore(store);
    return item;
  },

  updatePasskeyCounter(id: string, counter: number): void {
    const store = loadStore();
    const pk = store.passkeys.find((p) => p.id === id);
    if (pk) {
      pk.counter = counter;
      saveStore(store);
    }
  },

  deletePasskey(id: string, customerId: string): void {
    const store = loadStore();
    store.passkeys = store.passkeys.filter((p) => p.id !== id || p.customerId !== customerId);
    saveStore(store);
  },

  // ---- Addresses ----
  findAddressesByCustomerId(customerId: string): StoredAddress[] {
    const store = loadStore();
    return store.addresses.filter((a) => a.customerId === customerId);
  },

  createAddress(data: {
    customerId: string;
    street: string;
    city: string;
    state?: string;
    pincode: string;
    isDefault?: boolean;
  }): StoredAddress {
    const store = loadStore();
    const item: StoredAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: data.customerId,
      street: data.street,
      city: data.city,
      state: data.state || "",
      pincode: data.pincode,
      isDefault: data.isDefault ?? true,
      createdAt: new Date().toISOString(),
    };
    store.addresses.push(item);
    saveStore(store);
    return item;
  },

  deleteAddress(id: string, customerId: string): void {
    const store = loadStore();
    store.addresses = store.addresses.filter((a) => a.id !== id || a.customerId !== customerId);
    saveStore(store);
  },

  // ---- Challenges ----
  saveChallenge(challenge: string, target: string, type: string, expiresAt: Date): void {
    const store = loadStore();
    const existing = store.challenges.find((c) => c.challenge === challenge);
    if (existing) {
      existing.target = target;
      existing.type = type;
      existing.expiresAt = expiresAt.toISOString();
    } else {
      store.challenges.push({
        challenge,
        target,
        type,
        expiresAt: expiresAt.toISOString(),
      });
    }
    saveStore(store);
  },

  getChallenge(challenge: string): StoredChallenge | undefined {
    const store = loadStore();
    return store.challenges.find((c) => c.challenge === challenge);
  },

  deleteChallenge(challenge: string): void {
    const store = loadStore();
    store.challenges = store.challenges.filter((c) => c.challenge !== challenge);
    saveStore(store);
  },
};

