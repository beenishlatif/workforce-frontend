import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import API from "../api/axios";

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const { token } = useAuth();

  // blockedApps = [{ appName, reason, blockedAt }]
  const [blockedApps,      setBlockedApps]      = useState([]);
  const [screenshotPaused, setScreenshotPaused] = useState(false);
  const [consentGiven,     setConsentGiven]      = useState(false);
  const [loading,          setLoading]           = useState(false);
  const [error,            setError]             = useState(null);

  // ── Load preferences from backend ──────────────────────────
  const loadPreferences = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await API.get("/privacy/preferences");
      setBlockedApps(data.blockedApps      || []);
      setScreenshotPaused(data.screenshotPaused || false);
      setConsentGiven(data.consentGiven    || false);
      setError(null);
    } catch (e) {
      // If backend not ready yet, load from localStorage as fallback
      const saved = localStorage.getItem("privacyPrefs");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBlockedApps(parsed.blockedApps      || []);
          setScreenshotPaused(parsed.screenshotPaused || false);
          setConsentGiven(parsed.consentGiven    || false);
        } catch {}
      }
      setError(e.message);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  // ── Save helper (backend + localStorage fallback) ───────────
  const savePreferences = async (prefs) => {
    // Always save locally first (instant feedback)
    localStorage.setItem("privacyPrefs", JSON.stringify(prefs));
    try {
      await API.post("/privacy/preferences", prefs);
    } catch (e) {
      // Silent fail — local copy is enough for Electron agent to read
      console.warn("Privacy prefs saved locally only:", e.message);
    }
  };

  // ── Block an app ────────────────────────────────────────────
  const blockApp = async (appName, reason = "") => {
    if (!appName) return;
    const already = blockedApps.find(
      a => a.appName.toLowerCase() === appName.toLowerCase()
    );
    if (already) return;

    const newEntry = { appName, reason, blockedAt: new Date().toISOString() };
    const updated  = [...blockedApps, newEntry];
    setBlockedApps(updated);
    await savePreferences({
      blockedApps: updated,
      screenshotPaused,
      consentGiven,
    });
  };

  // ── Unblock an app ──────────────────────────────────────────
  const unblockApp = async (appName) => {
    const updated = blockedApps.filter(
      a => a.appName.toLowerCase() !== appName.toLowerCase()
    );
    setBlockedApps(updated);
    await savePreferences({
      blockedApps: updated,
      screenshotPaused,
      consentGiven,
    });
  };

  // ── Pause/Resume ALL screenshots ────────────────────────────
  const toggleScreenshotPause = async () => {
    const next = !screenshotPaused;
    setScreenshotPaused(next);
    await savePreferences({ blockedApps, screenshotPaused: next, consentGiven });
  };

  // ── Give / revoke consent ───────────────────────────────────
  const giveConsent = async () => {
    setConsentGiven(true);
    await savePreferences({ blockedApps, screenshotPaused, consentGiven: true });
  };

  // ── Check if an app is blocked ──────────────────────────────
  const isAppBlocked = (appName) => {
    if (screenshotPaused) return true;
    return blockedApps.some(
      a => a.appName.toLowerCase() === (appName || "").toLowerCase()
    );
  };

  return (
    <PrivacyContext.Provider value={{
      blockedApps,
      screenshotPaused,
      consentGiven,
      loading,
      error,
      blockApp,
      unblockApp,
      toggleScreenshotPause,
      giveConsent,
      isAppBlocked,
      reload: loadPreferences,
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);