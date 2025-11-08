// src/lib/ecoClient.ts
import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "https://gamified2-o.onrender.com";

/**
 * Try a number of common localStorage keys to discover the current user id.
 * This keeps components from having to pass userId everywhere.
 */
export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // common keys used in various projects - try them in order
    const candidates = ["user", "profile", "currentUser", "authUser"];
    for (const k of candidates) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (!obj) continue;
        if (obj._id) return obj._id;
        if (obj.id) return obj.id;
        if (obj.userId) return obj.userId;
        if (obj.user && (obj.user._id || obj.user.id)) return obj.user._id || obj.user.id;
      } catch (e) {
        // raw string storing id?
        if (raw && raw.length > 5 && /^[a-f0-9]{12,24}$/i.test(raw)) return raw;
      }
    }
    // also try direct keys
    const direct = localStorage.getItem("userId") || localStorage.getItem("profileId");
    if (direct) return direct;
  } catch (e) {
    console.warn("getCurrentUserId error", e);
  }
  return null;
}

/**
 * Award eco points for an action (server side rules decide points).
 * action should be one of your server's configured actions: e.g. "quizComplete", "challengeComplete", etc.
 * Optionally pass a userId; otherwise it will attempt to infer from localStorage.
 */
export async function awardEcoPoints(action: string, opts?: { userId?: string }) {
  const userId = opts?.userId || getCurrentUserId();
  if (!userId) {
    console.warn("awardEcoPoints: no userId found, skipping award for", action);
    return null;
  }
  try {
    const res = await axios.post(
      `${API_BASE}/api/ecopoints/action`,
      { userId, action },
      { withCredentials: true }
    );
    // dispatch a global event that other parts of the UI can listen to (leaderboard/profile)
    try {
      window.dispatchEvent(new CustomEvent("ecoPointsUpdated", { detail: { userId, action, payload: res.data } }));
    } catch (e) {}
    return res.data;
  } catch (err) {
    console.error("awardEcoPoints error", err);
    throw err;
  }
}
