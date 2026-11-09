"use client";

import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import {
  Fingerprint,
  Mail,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "login" | "register";
};

export default function CustomerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: Props) {
  const [mode, setMode] = useState<"login" | "register" | "recovery">(initialMode);
  const [step, setStep] = useState<"input" | "otp" | "passkey_prompt" | "done">("input");

  // Registration state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  // OTP state
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Recovery state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // ---- Login with Passkey --------------------------------------------------
  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Fetch authentication options from backend
      const res = await fetch("/api/auth/passkey/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.hasPasskey === false) {
          setError("No passkey is registered on this account yet. Please use email verification to log in.");
          setRecoveryIdentifier(phone);
          setMode("recovery");
          return;
        }
        setError(data.error || "Failed to start passkey login.");
        return;
      }

      // 2. Prompt user with native Face ID / Touch ID / Windows Hello via WebAuthn
      const authResp = await startAuthentication({ optionsJSON: data.options });

      // 3. Verify response on backend
      const verifyRes = await fetch("/api/auth/passkey/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customerId,
          response: authResp,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Authentication failed.");

      setSuccessMsg("Welcome back! Redirecting...");
      setTimeout(() => {
        onSuccess ? onSuccess() : window.location.reload();
      }, 700);
    } catch (err: any) {
      console.error("[Passkey Login]", err);
      if (err.name === "NotAllowedError") {
        setError("Passkey prompt was cancelled or timed out. Please try again.");
      } else {
        setError(err.message || "Passkey login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 1: Submit Registration & Send OTP -------------------------------
  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          street,
          city,
          pincode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      setSuccessMsg(`Verification code sent to ${email}`);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2: Verify OTP --------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const targetEmail = mode === "recovery" ? recoveryIdentifier : email;
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          code: otp,
          address: street && city ? { street, city, pincode } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code.");

      if (mode === "recovery") {
        setSuccessMsg("Account recovered! Redirecting...");
        setTimeout(() => {
          onSuccess ? onSuccess() : window.location.reload();
        }, 800);
      } else {
        // Move to Passkey registration step
        setStep("passkey_prompt");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 3: Register Passkey --------------------------------------------
  const handleRegisterPasskey = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Fetch WebAuthn registration options
      const optRes = await fetch("/api/auth/passkey/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "Failed to start passkey setup.");

      // 2. Prompt device authenticator (Face ID / Touch ID / PIN)
      const regResp = await startRegistration({ optionsJSON: options });

      // 3. Verify on server
      const verifyRes = await fetch("/api/auth/passkey/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: regResp,
          deviceName: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Computer Biometric",
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Failed to save passkey.");

      setSuccessMsg("Passkey enrolled! You can now log in passwordless with one tap.");
      setStep("done");
      setTimeout(() => {
        onSuccess ? onSuccess() : window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("[Passkey Reg]", err);
      if (err.name === "NotAllowedError") {
        setError("Passkey setup was cancelled. You can register one later in Account Security.");
      } else {
        setError(err.message || "Could not register passkey.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ---- Recovery Code Send --------------------------------------------------
  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recovery/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: recoveryIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send recovery code.");

      setMaskedEmail(data.maskedEmail);
      setRecoveryIdentifier(data.email);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Account recovery error.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const targetEmail = mode === "recovery" ? recoveryIdentifier : email;
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          type: mode === "recovery" ? "LOGIN_RECOVERY" : "EMAIL_VERIFY",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg("A fresh 6-digit code has been sent!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startCooldownTimer = (seconds: number) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-copper/35 bg-deep p-7 shadow-card md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-ivory/60 hover:bg-espresso hover:text-ivory"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="mb-6 text-center">
          <p className="eyebrow mb-1">Krishna Garments</p>
          <h2 className="font-display text-2xl text-ivory">
            {mode === "login"
              ? "Passwordless Login"
              : mode === "register"
              ? "Create Customer Account"
              : "Account Recovery"}
          </h2>
          <p className="mt-1 text-xs text-champagne/80">
            {mode === "login"
              ? "Instant login via Mobile & Device Passkey (Face ID / Fingerprint)"
              : mode === "register"
              ? "Crafted for her — Join our tailored shopping circle"
              : "Recover access using your verified email"}
          </p>
        </div>

        {/* Tab Switcher */}
        {step === "input" && mode !== "recovery" && (
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-charcoal p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`rounded-md py-2 font-medium transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-copper to-champagne text-charcoal shadow-sm"
                  : "text-ivory/60 hover:text-ivory"
              }`}
            >
              Sign In (Passkey)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-md py-2 font-medium transition-all ${
                mode === "register"
                  ? "bg-gradient-to-r from-copper to-champagne text-charcoal shadow-sm"
                  : "text-ivory/60 hover:text-ivory"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Feedback alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-ok/40 bg-ok/10 p-3 text-xs text-ok">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: Passkey Login */}
        {mode === "login" && step === "input" && (
          <form onSubmit={handlePasskeyLogin} className="space-y-4">
            <div>
              <label className="label">Registered Mobile Number</label>
              <div className="relative">
                <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-copper" />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="field pl-10"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-ivory/50">
                Authenticate using device biometrics (Fingerprint, Face ID or Windows Hello PIN).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-solid w-full justify-center py-3 text-xs"
            >
              {loading ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <>
                  <Fingerprint size={16} /> Authenticate with Passkey
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("recovery");
                  setError(null);
                  setRecoveryIdentifier(phone);
                }}
                className="text-xs text-champagne hover:text-ivory transition-colors"
              >
                No passkey on this device? Log in via Email Code
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: Customer Registration */}
        {mode === "register" && step === "input" && (
          <form onSubmit={handleStartRegister} className="space-y-3.5 max-h-[68vh] overflow-y-auto pr-1">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                placeholder="Ritu Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field"
              />
            </div>

            <div>
              <label className="label">Email Address (Gmail / Personal) *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-copper" />
                <input
                  type="email"
                  placeholder="ritu.sharma@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="field pl-10"
                />
              </div>
              <p className="mt-1 text-[10.5px] text-ivory/50">
                A 15-minute OTP will be delivered via EmailJS. Please check the Spam folder in your Gmail for the verification code.
              </p>
            </div>

            <div>
              <label className="label">Mobile Number (used for Passkey sign-in) *</label>
              <div className="relative">
                <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-copper" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="field pl-10"
                />
              </div>
            </div>

            <div className="border-t border-copper/15 pt-3">
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-champagne">
                Optional Delivery Address
              </span>
              <div className="grid gap-2">
                <input
                  type="text"
                  placeholder="Street / Flat / Colony"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="field text-xs py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="field text-xs py-2"
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="field text-xs py-2"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-solid w-full justify-center py-3 text-xs mt-2"
            >
              {loading ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <>
                  Verify Email &amp; Continue <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 3: OTP Verification Step */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <KeyRound size={28} className="mx-auto mb-2 text-champagne" />
              <p className="text-sm text-ivory">Enter 6-Digit Passcode</p>
              <p className="text-xs text-ivory/60 mt-1">
                Sent to <strong className="text-champagne">{maskedEmail || email}</strong>
              </p>
              <p className="mt-2 text-[11px] text-champagne/90 bg-espresso/50 border border-copper/30 rounded px-2.5 py-1 inline-block">
                ✉️ Check the Spam folder in your Gmail for verification code
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D+/g, ""))}
                required
                className="field text-center font-mono text-2xl tracking-[0.4em]"
              />
              <p className="mt-2 text-center text-[11px] text-ivory/50">Valid for 15 minutes</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="btn-solid w-full justify-center py-3 text-xs"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : "Verify Code"}
            </button>

            <div className="flex items-center justify-between text-xs text-ivory/60 pt-2">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="hover:text-champagne transition-colors"
              >
                Change details
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-champagne hover:text-ivory transition-colors"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: Passkey Enrollment Prompt */}
        {step === "passkey_prompt" && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-copper/15 text-champagne border border-copper/30">
              <Fingerprint size={28} />
            </div>

            <div>
              <h3 className="font-display text-xl text-ivory">Register Your Passkey</h3>
              <p className="mt-1 text-xs text-ivory/70 leading-relaxed max-w-xs mx-auto">
                Enable 1-tap sign in with Touch ID, Face ID, or Windows Hello. No passwords to remember, ever.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={loading}
                className="btn-solid w-full justify-center py-3 text-xs"
              >
                {loading ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} /> Enable Device Passkey
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("done");
                  setTimeout(() => {
                    onSuccess ? onSuccess() : window.location.reload();
                  }, 500);
                }}
                className="text-xs text-ivory/50 hover:text-ivory transition-colors py-1.5"
              >
                Skip for now (use email code)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: Recovery Mode Form */}
        {mode === "recovery" && step === "input" && (
          <form onSubmit={handleSendRecoveryCode} className="space-y-4">
            <div>
              <label className="label">Mobile Number or Verified Email</label>
              <input
                type="text"
                placeholder="Enter mobile or email"
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                required
                className="field"
              />
              <p className="mt-1.5 text-[11px] text-ivory/50">
                We will deliver a 6-digit access code to your registered email via EmailJS. Please check the Spam folder in your Gmail for verification code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-solid w-full justify-center py-3 text-xs"
            >
              {loading ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <>
                  <Mail size={15} /> Send Access Code
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-xs text-champagne hover:text-ivory transition-colors"
              >
                Back to Passkey Login
              </button>
            </div>
          </form>
        )}

        {/* VIEW 6: Done */}
        {step === "done" && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 size={42} className="mx-auto text-ok" />
            <h3 className="font-display text-xl text-ivory">Account Ready</h3>
            <p className="text-xs text-ivory/70">Setting up your private dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

