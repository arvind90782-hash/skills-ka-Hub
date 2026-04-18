import { createSmartLinkHubState, hydrateSmartLinkHubState } from './engine';
import type { SmartLinkHubState } from './types';

const STORAGE_KEY = 'smart-link-hub/state/v2';

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadSmartLinkHubState = (): SmartLinkHubState => {
  if (!isBrowser()) {
    return createSmartLinkHubState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSmartLinkHubState();
    }
    return hydrateSmartLinkHubState(JSON.parse(raw));
  } catch {
    return createSmartLinkHubState();
  }
};

export const saveSmartLinkHubState = (state: SmartLinkHubState): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is best-effort. The app still works if persistence fails.
  }
};

export const clearSmartLinkHubState = (): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const smartLinkHubStorageKey = STORAGE_KEY;
