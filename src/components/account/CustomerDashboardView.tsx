"use client";

import { useEffect, useState } from "react";
import {
  User,
  ShoppingBag,
  Truck,
  MapPin,
  Heart,
  ShieldCheck,
  Fingerprint,
  LogOut,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Building,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import CustomerAuthModal from "./CustomerAuthModal";
import TrackOrder from "./TrackOrder";
import WishlistPanel from "./WishlistPanel";
import { startRegistration } from "@simplewebauthn/browser";

type CustomerData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  gstin: string | null;
  emailVerified: string | null;
  phoneVerified: boolean;
  accountStatus: string;
  addresses: any[];
  passkeys: any[];
  orders: any[];
};

export default function CustomerDashboardView() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<
    "profile" | "orders" | "tracking" | "addresses" | "wishlist" | "security"
  >("profile");

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Address add state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("Delhi");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrDefault, setAddrDefault] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  // Passkey enrolling state
  const [enrollingPasskey, setEnrollingPasskey] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/me");
      const data = await res.json();
      if (res.ok && data.authenticated && data.customer) {
        setCustomer(data.customer);
        setEditName(data.customer.name || "");
        setEditCompany(data.customer.company || "");
        setEditGstin(data.customer.gstin || "");
      } else {
        setCustomer(null);
      }
    } catch (err) {
      console.error("[CustomerDashboard] Error fetching:", err);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCustomer(null);
    window.location.reload();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          company: editCompany,
          gstin: editGstin,
        }),
      });
      if (res.ok) {
        setProfileMsg("Profile updated successfully.");
        await fetchCustomer();
      }
    } catch {
      setProfileMsg("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: addrStreet,
          city: addrCity,
          state: addrState,
          pincode: addrPincode,
          isDefault: addrDefault,
        }),
      });
      if (res.ok) {
        setShowAddAddress(false);
        setAddrStreet("");
        setAddrCity("");
        setAddrPincode("");
        await fetchCustomer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    await fetch(`/api/customer/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await fetchCustomer();
  };

  const handleEnrollPasskey = async () => {
    setEnrollingPasskey(true);
    setSecurityMsg(null);
    try {
      const optRes = await fetch("/api/auth/passkey/register-options", { method: "POST" });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error);

      const regResp = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/passkey/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: regResp,
          deviceName: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Computer Authenticator",
        }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error);

      setSecurityMsg("New passkey enrolled successfully!");
      await fetchCustomer();
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        setSecurityMsg(`Error: ${err.message || "Could not register device."}`);
      }
    } finally {
      setEnrollingPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm("Remove this passkey? You will not be able to log in with this device until re-registered.")) {
      return;
    }
    const res = await fetch(`/api/customer/passkeys/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchCustomer();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-champagne" />
      </div>
    );
  }

  // ---- UNAUTHENTICATED GUEST VIEW ----
  if (!customer) {
    return (
      <>
        <div className="mx-auto max-w-4xl py-12">
          <div className="rounded-2xl border border-copper/30 bg-deep/90 p-8 shadow-card text-center md:p-14">
            <span className="eyebrow mb-3 block">From Fabric to Fashion</span>
            <h1 className="font-display text-3xl md:text-5xl text-ivory mb-4">
              Welcome to Krishna Garments
            </h1>
            <p className="max-w-lg mx-auto text-sm text-ivory/70 leading-relaxed mb-8">
              Experience seamless, passwordless shopping. Sign in securely with your mobile number and device
              passkey (Face ID, Fingerprint, or PIN).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthModalOpen(true);
                }}
                className="btn-solid px-8 py-3.5 text-xs flex items-center gap-2"
              >
                <Fingerprint size={16} /> Sign In with Passkey
              </button>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setAuthModalOpen(true);
                }}
                className="btn-outline px-8 py-3.5 text-xs flex items-center gap-2"
              >
                Create Account
              </button>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-copper/20 text-left">
              <div className="rounded-xl border border-copper/15 bg-charcoal/50 p-5">
                <ShieldCheck size={20} className="text-champagne mb-2" />
                <h3 className="font-display text-sm text-ivory">Zero Password Hassle</h3>
                <p className="text-xs text-ivory/55 mt-1">
                  Authenticate in 1 second using your phone or laptop’s biometric sensor.
                </p>
              </div>
              <div className="rounded-xl border border-copper/15 bg-charcoal/50 p-5">
                <Truck size={20} className="text-champagne mb-2" />
                <h3 className="font-display text-sm text-ivory">Order Tracking</h3>
                <p className="text-xs text-ivory/55 mt-1">
                  Real-time updates on your bespoke cuts and tailoring status.
                </p>
              </div>
              <div className="rounded-xl border border-copper/15 bg-charcoal/50 p-5">
                <Heart size={20} className="text-champagne mb-2" />
                <h3 className="font-display text-sm text-ivory">Curated Wishlist</h3>
                <p className="text-xs text-ivory/55 mt-1">
                  Save pieces across seasons and synchronize your wardrobe selections.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <TrackOrder />
          </div>
        </div>

        <CustomerAuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchCustomer();
          }}
        />
      </>
    );
  }

  // ---- AUTHENTICATED CUSTOMER DASHBOARD ----
  return (
    <div className="space-y-8">
      {/* Customer Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-copper/30 bg-gradient-to-r from-deep via-espresso/50 to-deep p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-copper/40 bg-charcoal text-champagne font-display text-2xl">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl text-ivory">{customer.name}</h1>
                <span className="rounded-full bg-ok/10 border border-ok/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-ok">
                  {customer.accountStatus}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-ivory/60">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-copper" /> {customer.email}
                  {customer.emailVerified && (
                    <span className="text-ok font-medium" title="Verified via EmailJS">
                      ✓ Verified
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-copper" /> {customer.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded border border-copper/40 px-4 py-2 text-xs uppercase tracking-wider text-champagne hover:bg-copper hover:text-charcoal transition-all self-start md:self-auto"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-copper/20 pb-2 no-scrollbar text-xs font-medium">
        {[
          { id: "profile", label: "My Profile", icon: User },
          { id: "orders", label: `My Orders (${customer.orders.length})`, icon: ShoppingBag },
          { id: "tracking", label: "Order Tracking", icon: Truck },
          { id: "addresses", label: `Saved Addresses (${customer.addresses.length})`, icon: MapPin },
          { id: "wishlist", label: "Wishlist", icon: Heart },
          { id: "security", label: `Passkeys & Security (${customer.passkeys.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 transition-all ${
                active
                  ? "border-b-2 border-champagne bg-espresso/50 text-champagne font-semibold"
                  : "text-ivory/60 hover:text-ivory"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <section className="card p-6 md:p-8 max-w-2xl">
          <h2 className="font-display text-xl text-ivory mb-4">Profile Details</h2>
          {profileMsg && <p className="mb-4 text-xs text-ok">{profileMsg}</p>}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="field"
              />
            </div>
            <div>
              <label className="label">Email Address (Locked - Primary Identifier)</label>
              <input type="text" value={customer.email || ""} disabled className="field opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Mobile Number (Passkey Sign-in ID)</label>
              <input type="text" value={customer.phone || ""} disabled className="field opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Company / Boutique Name (Optional)</label>
              <input
                type="text"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                placeholder="Ritu Fashions"
                className="field"
              />
            </div>
            <div>
              <label className="label">GSTIN (For wholesale invoices)</label>
              <input
                type="text"
                value={editGstin}
                onChange={(e) => setEditGstin(e.target.value)}
                placeholder="07AAAAA0000A1Z5"
                className="field"
              />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-solid text-xs">
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      )}

      {/* TAB CONTENT: MY ORDERS */}
      {activeTab === "orders" && (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-ivory">My Order History</h2>
          {customer.orders.length === 0 ? (
            <div className="card p-8 text-center text-ivory/60 text-sm">
              <ShoppingBag size={32} className="mx-auto mb-2 text-copper/60" />
              <p>No orders placed yet.</p>
            </div>
          ) : (
            customer.orders.map((ord: any) => (
              <div key={ord.id} className="card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-copper/15 pb-3">
                  <div>
                    <span className="font-mono text-sm text-champagne font-semibold">{ord.orderNo}</span>
                    <span className="ml-3 text-xs text-ivory/50">
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-copper/20 border border-copper/40 px-2 py-0.5 text-[10px] uppercase text-champagne">
                      {ord.status}
                    </span>
                    <span className="font-semibold text-sm text-ivory">₹{Number(ord.total).toLocaleString()}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-xs text-ivory/80">
                      <span>
                        {it.quantity}x {it.label} {it.size ? `(${it.size})` : ""}
                      </span>
                      <span>₹{Number(it.lineTotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* TAB CONTENT: TRACKING */}
      {activeTab === "tracking" && (
        <section className="max-w-2xl">
          <TrackOrder />
        </section>
      )}

      {/* TAB CONTENT: SAVED ADDRESSES */}
      {activeTab === "addresses" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ivory">Delivery Addresses</h2>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Address
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="card p-5 max-w-xl space-y-3">
              <h3 className="text-sm font-semibold text-champagne">New Address</h3>
              <input
                type="text"
                placeholder="Street / Flat / Colony"
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                required
                className="field text-xs py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  required
                  className="field text-xs py-2"
                />
                <input
                  type="text"
                  placeholder="PIN Code"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  required
                  className="field text-xs py-2"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-ivory/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrDefault}
                  onChange={(e) => setAddrDefault(e.target.checked)}
                />
                Make default address
              </label>
              <button type="submit" disabled={savingAddr} className="btn-solid text-xs py-2">
                {savingAddr ? "Saving..." : "Save Address"}
              </button>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {customer.addresses.map((a: any) => (
              <div key={a.id} className="card p-5 relative">
                <div className="flex items-start justify-between">
                  <span className="rounded bg-copper/15 border border-copper/30 px-2 py-0.5 text-[10px] uppercase text-champagne">
                    {a.label} {a.isDefault && "· Default"}
                  </span>
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-ivory/40 hover:text-danger p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="mt-3 text-xs text-ivory/80 leading-relaxed">
                  {a.street}, {a.city}, {a.state} - {a.pincode}
                </p>
                <p className="mt-2 text-[11px] text-ivory/50">Contact: {a.phone}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB CONTENT: WISHLIST */}
      {activeTab === "wishlist" && (
        <section>
          <WishlistPanel />
        </section>
      )}

      {/* TAB CONTENT: SECURITY & PASSKEYS */}
      {activeTab === "security" && (
        <section className="space-y-6 max-w-3xl">
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-copper/20 pb-5">
              <div>
                <h2 className="font-display text-xl text-ivory flex items-center gap-2">
                  <Fingerprint size={22} className="text-copper" /> Registered Devices &amp; Passkeys
                </h2>
                <p className="mt-1 text-xs text-ivory/60">
                  Manage biometric sensors, security keys, and devices authorized to sign into your account.
                </p>
              </div>
              <button
                onClick={handleEnrollPasskey}
                disabled={enrollingPasskey}
                className="btn-solid text-xs px-4 py-2 flex items-center gap-2 shrink-0"
              >
                {enrollingPasskey ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Add New Passkey
              </button>
            </div>

            {securityMsg && <p className="mt-4 text-xs text-champagne">{securityMsg}</p>}

            <div className="mt-5 space-y-3">
              {customer.passkeys.length === 0 ? (
                <p className="text-xs text-ivory/50 py-4 text-center">
                  No passkeys registered yet. Click &quot;Add New Passkey&quot; to enable one-tap biometric login!
                </p>
              ) : (
                customer.passkeys.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-copper/20 bg-charcoal/60 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-copper/15 p-2 text-champagne">
                        <Fingerprint size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ivory">{p.deviceName || "Biometric Authenticator"}</p>
                        <p className="text-[11px] text-ivory/50">
                          Added on{" "}
                          {new Date(p.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {p.lastUsedAt &&
                            ` · Last used: ${new Date(p.lastUsedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePasskey(p.id)}
                      className="text-ivory/40 hover:text-danger text-xs p-2 flex items-center gap-1.5 transition-colors"
                      title="Remove device"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display text-base text-ivory flex items-center gap-2 mb-2">
              <Mail size={16} className="text-copper" /> Email Recovery Channel
            </h3>
            <p className="text-xs text-ivory/60 leading-relaxed">
              If you lose access to all your passkey devices, you can always recover your account via your verified
              Gmail: <strong className="text-champagne">{customer.email}</strong>.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

