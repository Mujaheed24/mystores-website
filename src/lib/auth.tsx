"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut, type User,
} from "firebase/auth";
import { getAuthClient } from "./firebaseApp";

type Ctx = {
  user: User | null; isAdmin: boolean; loading: boolean;
  signingIn: boolean;                           // a Google sign-in was started and the account has not arrived yet
  emailVerified: boolean;                       // Google accounts are always verified; email/password accounts must click the link
  signIn: () => Promise<string | null>;         // Google
  signInEmail: (email: string, password: string) => Promise<string | null>;
  signUpEmail: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  resendVerification: () => Promise<string | null>;
  refreshUser: () => Promise<boolean>;          // re-checks verification and refreshes the sign-in token; true if verified
  signOut: () => Promise<void>;
};
const none = async () => null;
const AuthCtx = createContext<Ctx>({ user: null, isAdmin: false, loading: true, signingIn: false, emailVerified: false, signIn: none, signInEmail: none, signUpEmail: none, resetPassword: none, resendVerification: none, refreshUser: async () => false, signOut: async () => {} });
export const useAuth = () => useContext(AuthCtx);

// True when the person signs in with an email and password (not Google). Used to ask for the password again before deleting an account.
export const usesPassword = (u: User | null) => !!u && u.providerData.some((p) => p.providerId === "password") && !u.providerData.some((p) => p.providerId === "google.com");

const quiet = (c?: string) => c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request";
// Plain-language messages for the Firebase error codes a seller can actually hit.
export function authMessage(e: any): string {
  switch (e?.code) {
    case "auth/invalid-email": return "That email address does not look right.";
    case "auth/email-already-in-use": return "This email already has an account. Tap Sign in instead. If you used Google before, tap Continue with Google.";
    case "auth/weak-password": return "Choose a password with at least 8 characters.";
    case "auth/invalid-credential": case "auth/wrong-password": case "auth/user-not-found": return "Email or password is not right. If you signed up with Google, tap Continue with Google.";
    case "auth/too-many-requests": return "Too many tries. Wait a few minutes and try again.";
    case "auth/network-request-failed": return "No internet connection. Check your data and try again.";
    case "auth/operation-not-allowed": return "Email sign-in is not turned on yet. Turn on Email/Password in Firebase, under Authentication, Sign-in method.";
    default: return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [isAdmin, setIsAdmin] = useState(false), [loading, setLoading] = useState(true), [signingIn, setSigningIn] = useState(false), [, bump] = useState(0);
  useEffect(() => {
    try {
      return onAuthStateChanged(getAuthClient(), async (u) => {
        setUser(u); if (u) setSigningIn(false);
        setIsAdmin(u ? !!(await u.getIdTokenResult()).claims.admin : false);
        setLoading(false);
      });
    } catch { setLoading(false); } // a bad Firebase config must not blank the whole site
  }, []);
  const run = async (fn: () => Promise<unknown>): Promise<string | null> => {
    try { await fn(); return null; } catch (e: any) { return quiet(e?.code) ? null : authMessage(e); }
  };
  const signIn = async () => {
    setSigningIn(true);
    try { await signInWithPopup(getAuthClient(), new GoogleAuthProvider()); return null; } // stays "signing in" until the account arrives
    catch (e: any) {
      setSigningIn(false);
      if (quiet(e?.code)) return null;
      return "Google sign-in failed. Check that Google sign-in is turned on in Firebase and try again.";
    }
  };
  const signInEmail = (email: string, pw: string) => run(() => signInWithEmailAndPassword(getAuthClient(), email.trim(), pw));
  const signUpEmail = (email: string, pw: string) => run(async () => {
    const c = await createUserWithEmailAndPassword(getAuthClient(), email.trim(), pw);
    await sendEmailVerification(c.user).catch(() => {}); // the account exists even if this fails; the seller can resend
  });
  const resetPassword = (email: string) => run(() => sendPasswordResetEmail(getAuthClient(), email.trim()));
  const resendVerification = () => run(async () => { if (user) await sendEmailVerification(user); });
  const refreshUser = async () => {
    if (!user) return false;
    await user.reload();
    if (user.emailVerified) await user.getIdToken(true); // the rules read email_verified from the token, so it must be refreshed
    bump((n) => n + 1);
    return user.emailVerified;
  };
  return (
    <AuthCtx.Provider value={{ user, isAdmin, loading, signingIn, emailVerified: !!user?.emailVerified, signIn, signInEmail, signUpEmail, resetPassword, resendVerification, refreshUser, signOut: () => fbSignOut(getAuthClient()) }}>
      {children}
    </AuthCtx.Provider>
  );
}
