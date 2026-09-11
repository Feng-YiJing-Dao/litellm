import { vi } from "vitest";

const ensureTestLocalStorage = () => {
  if (typeof window === "undefined" || typeof window.Storage === "undefined") {
    return;
  }

  if (typeof window.localStorage?.getItem === "function" && typeof window.localStorage?.clear === "function") {
    return;
  }

  const storageStores = new WeakMap<Storage, Map<string, string>>();
  const storagePrototype = window.Storage.prototype;
  const getStore = (storage: Storage) => {
    let store = storageStores.get(storage);
    if (store === undefined) {
      store = new Map<string, string>();
      storageStores.set(storage, store);
    }
    return store;
  };

  Object.defineProperties(storagePrototype, {
    getItem: {
      configurable: true,
      writable: true,
      value(this: Storage, key: string) {
        const store = getStore(this);
        const normalizedKey = String(key);
        return store.has(normalizedKey) ? store.get(normalizedKey)! : null;
      },
    },
    setItem: {
      configurable: true,
      writable: true,
      value(this: Storage, key: string, value: string) {
        const store = getStore(this);
        store.set(String(key), String(value));
      },
    },
    removeItem: {
      configurable: true,
      writable: true,
      value(this: Storage, key: string) {
        const store = getStore(this);
        store.delete(String(key));
      },
    },
    clear: {
      configurable: true,
      writable: true,
      value(this: Storage) {
        const store = getStore(this);
        store.clear();
      },
    },
    key: {
      configurable: true,
      writable: true,
      value(this: Storage, index: number) {
        const store = getStore(this);
        return Array.from(store.keys())[index] ?? null;
      },
    },
  });

  const localStorage = Object.create(storagePrototype);
  storageStores.set(localStorage, new Map<string, string>());
  Object.defineProperty(localStorage, "length", {
    configurable: true,
    get() {
      return getStore(localStorage).size;
    },
  });

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });
};

ensureTestLocalStorage();

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    fromError: vi.fn(),
    dismiss: vi.fn(),
  },
}));
