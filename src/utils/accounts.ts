export interface StoredAccount {
    id: string;
    username: string;
    email: string;
    profile_picture_url: string;
    theme?: "light" | "dark";
    token: string;
}

const ACCOUNTS_KEY = "accounts";
const ACTIVE_ACCOUNT_KEY = "activeAccountId";

const sid = (id: unknown): string => String(id);

export function getAccounts(): StoredAccount[] {
    try {
        return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    } catch {
        return [];
    }
}

export function getActiveAccountId(): string | null {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
}

export function saveAccount(user: Omit<StoredAccount, "token">, token: string): void {
    const accounts = getAccounts();
    const entry: StoredAccount = { ...user, id: sid(user.id), token };
    const idx = accounts.findIndex((a) => sid(a.id) === sid(user.id));
    if (idx >= 0) {
        accounts[idx] = entry;
    } else {
        accounts.push(entry);
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, sid(user.id));
}

export function removeAccount(accountId: string): StoredAccount | null {
    const accounts = getAccounts().filter((a) => sid(a.id) !== sid(accountId));
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (sid(getActiveAccountId()) === sid(accountId)) {
        const next = accounts[0] ?? null;
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, next ? sid(next.id) : "");
        if (!next) localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
        return next;
    }
    return null;
}

export function switchAccount(accountId: string): StoredAccount | null {
    const accounts = getAccounts();
    const target = accounts.find((a) => sid(a.id) === sid(accountId));
    if (!target) return null;
    const { token, ...user } = target;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, sid(accountId));
    return target;
}
