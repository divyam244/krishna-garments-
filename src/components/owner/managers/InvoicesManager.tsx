"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Printer,
  Search,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Building,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";

type InvoiceItem = {
  label: string;
  size?: string;
  qty: number;
  rate: number;
  amount: number;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerGstin: string | null;
  billingAddress: string | null;
  subtotal: number;
  taxRatePct: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  items: any;
  dueDate: string | null;
  issuedAt: string;
  notes: string | null;
};

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custGstin, setCustGstin] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [taxRate, setTaxRate] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [paidNow, setPaidNow] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    { label: "Bespoke Kurti Set", size: "M", qty: 2, rate: 2499, amount: 4998 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // View / Print Modal state
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Payment Modal state
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [recordingPay, setRecordingPay] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/owner/invoices", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error("[InvoicesManager] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { label: "", size: "Free", qty: 1, rate: 0, amount: 0 }]);
  };

  const handleLineChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...lineItems];
    const current = { ...updated[index], [field]: value };
    current.amount = Number(current.qty || 0) * Number(current.rate || 0);
    updated[index] = current;
    setLineItems(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calcSubtotal = lineItems.reduce((acc, it) => acc + (it.amount || 0), 0);
  const calcTax = (calcSubtotal * Number(taxRate)) / 100;
  const calcTotal = Math.max(0, calcSubtotal + calcTax - Number(discount || 0));
  const calcBalance = Math.max(0, calcTotal - Number(paidNow || 0));

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0 || !custName) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/owner/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: custName,
          customerPhone: custPhone,
          customerEmail: custEmail,
          customerGstin: custGstin,
          billingAddress: custAddress,
          items: lineItems,
          taxRatePct: taxRate,
          discount,
          amountPaid: paidNow,
          dueDate: dueDate || null,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreateOpen(false);
        resetForm();
        await fetchInvoices();
        if (data.invoice) setViewInvoice(data.invoice);
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (err: any) {
      alert(err.message || "Error creating invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoice || !paymentAmount) return;
    setRecordingPay(true);

    try {
      const res = await fetch(`/api/owner/invoices/${payInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addPayment: Number(paymentAmount),
          paymentMethod,
        }),
      });

      if (res.ok) {
        setPayInvoice(null);
        setPaymentAmount("");
        await fetchInvoices();
      }
    } finally {
      setRecordingPay(false);
    }
  };

  const resetForm = () => {
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setCustGstin("");
    setCustAddress("");
    setLineItems([{ label: "", size: "Free", qty: 1, rate: 0, amount: 0 }]);
    setPaidNow(0);
    setDiscount(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Billing &amp; GST</p>
          <h1 className="font-display text-2xl md:text-3xl text-ivory">Invoices Management</h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-solid text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={15} /> Create Invoice
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field text-xs py-2 flex-1"
          />
          <button type="submit" className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5">
            <Search size={14} /> Search
          </button>
        </form>

        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto text-xs">
          {["ALL", "ISSUED", "PARTIAL", "PAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded px-3 py-1.5 uppercase tracking-wider text-[11px] transition-all ${
                statusFilter === st
                  ? "bg-copper text-charcoal font-semibold"
                  : "bg-charcoal text-ivory/60 hover:text-ivory"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-champagne">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-ivory/50">
            <FileText size={36} className="mx-auto mb-2 text-copper/40" />
            <p className="text-sm">No invoices found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal/80 uppercase tracking-wider text-[10px] text-champagne/80 border-b border-copper/20">
                <tr>
                  <th className="p-3.5 pl-5">Invoice #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Issued Date</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Paid</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-copper/15">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-espresso/30 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-champagne font-medium">{inv.invoiceNo}</td>
                    <td className="p-3.5 font-medium text-ivory">
                      {inv.customerName}
                      {inv.customerPhone && <span className="block text-[11px] text-ivory/50">{inv.customerPhone}</span>}
                    </td>
                    <td className="p-3.5 text-ivory/60">
                      {new Date(inv.issuedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3.5 font-semibold text-ivory">₹{Number(inv.totalAmount).toLocaleString()}</td>
                    <td className="p-3.5 text-ok">₹{Number(inv.amountPaid).toLocaleString()}</td>
                    <td className="p-3.5 text-danger font-medium">₹{Number(inv.balanceDue).toLocaleString()}</td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] uppercase font-semibold tracking-wider ${
                          inv.status === "PAID"
                            ? "bg-ok/15 text-ok border border-ok/30"
                            : inv.status === "PARTIAL"
                            ? "bg-warn/15 text-warn border border-warn/30"
                            : "bg-copper/15 text-champagne border border-copper/30"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <button
                        onClick={() => setViewInvoice(inv)}
                        className="rounded border border-copper/40 px-2.5 py-1 text-[11px] text-champagne hover:bg-copper hover:text-charcoal"
                      >
                        Print / View
                      </button>
                      {Number(inv.balanceDue) > 0 && (
                        <button
                          onClick={() => {
                            setPayInvoice(inv);
                            setPaymentAmount(String(inv.balanceDue));
                          }}
                          className="rounded bg-ok/20 border border-ok/40 px-2.5 py-1 text-[11px] text-ok hover:bg-ok hover:text-charcoal"
                        >
                          + Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-copper/40 bg-deep p-6 md:p-8 shadow-card my-8">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-5 top-5 text-ivory/60 hover:text-ivory"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl text-ivory mb-5">Create New Invoice</h2>

            <form onSubmit={handleCreateInvoice} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Priya Verma"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="9812345678"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    placeholder="priya@example.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="label">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="07AAAAA0000A1Z5"
                    value={custGstin}
                    onChange={(e) => setCustGstin(e.target.value)}
                    className="field text-xs py-2"
                  />
                </div>
              </div>

              <div>
                <label className="label">Billing / Delivery Address</label>
                <input
                  type="text"
                  placeholder="B-42 Connaught Place, New Delhi"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="field text-xs py-2"
                />
              </div>

              {/* Line Items */}
              <div className="border-t border-copper/20 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-champagne uppercase tracking-wider">
                    Invoice Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-champagne hover:text-ivory flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-charcoal/60 p-2.5 rounded-lg border border-copper/15">
                      <input
                        type="text"
                        placeholder="Item name / Fabric"
                        value={item.label}
                        onChange={(e) => handleLineChange(idx, "label", e.target.value)}
                        required
                        className="field text-xs py-1.5 flex-[2]"
                      />
                      <input
                        type="text"
                        placeholder="Size"
                        value={item.size}
                        onChange={(e) => handleLineChange(idx, "size", e.target.value)}
                        className="field text-xs py-1.5 w-16"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleLineChange(idx, "qty", Number(e.target.value))}
                        required
                        className="field text-xs py-1.5 w-16"
                      />
                      <input
                        type="number"
                        placeholder="Rate ₹"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleLineChange(idx, "rate", Number(e.target.value))}
                        required
                        className="field text-xs py-1.5 w-24"
                      />
                      <span className="text-xs font-mono font-medium text-ivory w-24 text-right">
                        ₹{(item.amount || 0).toLocaleString()}
                      </span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-ivory/40 hover:text-danger p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing, Tax & Payment Calculation */}
              <div className="border-t border-copper/20 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <label className="label">Configurable GST Rate (%)</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="field text-xs py-2"
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5% (Apparel standard &le; ₹1,000)</option>
                      <option value={12}>12% (Apparel luxury &gt; ₹1,000)</option>
                      <option value={18}>18% (Custom Tailoring Services)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Special Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="field text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="label">Initial Payment Received (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={paidNow}
                      onChange={(e) => setPaidNow(Number(e.target.value))}
                      className="field text-xs py-2"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-copper/30 bg-espresso/40 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-ivory/70">
                    <span>Subtotal:</span>
                    <span>₹{calcSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>GST ({taxRate}%):</span>
                    <span>+₹{calcTax.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-ok">
                      <span>Discount:</span>
                      <span>-₹{Number(discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-ivory border-t border-copper/20 pt-2">
                    <span>Total Invoice:</span>
                    <span className="text-champagne font-mono">₹{calcTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ok">
                    <span>Paid Now:</span>
                    <span>₹{Number(paidNow || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-danger font-medium border-t border-copper/20 pt-1.5">
                    <span>Balance Due:</span>
                    <span className="font-mono">₹{calcBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-solid w-full justify-center text-xs py-3"
                >
                  {submitting ? "Generating Invoice..." : "Save & Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT INVOICE MODAL */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-copper/40 bg-deep p-6 md:p-10 shadow-card my-8">
            <div className="flex items-center justify-between border-b border-copper/20 pb-4 mb-6">
              <span className="eyebrow">Tax Invoice</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="btn-solid text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print Invoice
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="rounded-full p-1.5 text-ivory/60 hover:text-ivory hover:bg-espresso"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div id="printable-invoice" className="bg-charcoal/90 border border-copper/30 rounded-xl p-8 space-y-6 text-ivory">
              {/* Header with Brand Logo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-copper/25 pb-6">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/v86wzzbs/image/upload/f_png,q_auto/Krishna_Garments_Gold_Logo"
                    alt="KRISHNA GARMENTS"
                    className="h-12 w-auto object-contain mb-2"
                  />
                  <h2 className="font-display text-xl text-ivory">KRISHNA GARMENTS</h2>
                  <p className="text-[11px] uppercase tracking-widest text-champagne">
                    FROM FABRIC TO FASHION · CRAFTED FOR HER
                  </p>
                  <p className="text-xs text-ivory/50 mt-1">GSTIN: 07AABCK1234F1Z9 · New Delhi, India</p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-bold text-champagne">{viewInvoice.invoiceNo}</span>
                  <p className="text-xs text-ivory/60 mt-1">
                    Date:{" "}
                    {new Date(viewInvoice.issuedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <span
                    className={`inline-block mt-2 rounded px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      viewInvoice.status === "PAID"
                        ? "bg-ok/20 text-ok border border-ok/40"
                        : "bg-warn/20 text-warn border border-warn/40"
                    }`}
                  >
                    Status: {viewInvoice.status}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-champagne uppercase font-semibold text-[10px] tracking-wider mb-1">
                    Billed To:
                  </p>
                  <p className="font-display text-sm text-ivory">{viewInvoice.customerName}</p>
                  {viewInvoice.customerPhone && <p className="text-ivory/70">{viewInvoice.customerPhone}</p>}
                  {viewInvoice.customerEmail && <p className="text-ivory/70">{viewInvoice.customerEmail}</p>}
                  {viewInvoice.billingAddress && <p className="text-ivory/70 mt-1">{viewInvoice.billingAddress}</p>}
                  {viewInvoice.customerGstin && (
                    <p className="text-champagne/80 mt-1">GSTIN: {viewInvoice.customerGstin}</p>
                  )}
                </div>

                <div className="text-right space-y-1 text-ivory/70">
                  <p className="text-champagne uppercase font-semibold text-[10px] tracking-wider mb-1">
                    Payment Terms:
                  </p>
                  <p>Due Date: {viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : "Due on receipt"}</p>
                  <p>Currency: INR (₹)</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border border-copper/20 rounded">
                <thead className="bg-espresso/60 uppercase text-[10px] text-champagne tracking-wider border-b border-copper/20">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-copper/15">
                  {(Array.isArray(viewInvoice.items) ? viewInvoice.items : []).map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium">{it.label}</td>
                      <td className="p-2.5 text-ivory/60">{it.size || "-"}</td>
                      <td className="p-2.5 text-right font-mono">{it.qty}</td>
                      <td className="p-2.5 text-right font-mono">₹{Number(it.rate).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-champagne">
                        ₹{(Number(it.qty) * Number(it.rate)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs text-right border-t border-copper/20 pt-3">
                  <div className="flex justify-between text-ivory/70">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{Number(viewInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>GST ({Number(viewInvoice.taxRatePct)}%):</span>
                    <span className="font-mono">₹{Number(viewInvoice.taxAmount).toLocaleString()}</span>
                  </div>
                  {Number(viewInvoice.discount) > 0 && (
                    <div className="flex justify-between text-ok">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{Number(viewInvoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-ivory border-t border-copper/25 pt-2">
                    <span>Total Amount:</span>
                    <span className="font-mono text-champagne">₹{Number(viewInvoice.totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-ok">
                    <span>Amount Paid:</span>
                    <span className="font-mono">₹{Number(viewInvoice.amountPaid).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-danger font-semibold border-t border-copper/25 pt-1.5">
                    <span>Remaining Balance:</span>
                    <span className="font-mono">₹{Number(viewInvoice.balanceDue).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-copper/20 pt-4 text-center text-[10px] text-ivory/50">
                <p>Thank you for choosing KRISHNA GARMENTS. Crafted for her with bespoke passion.</p>
                <p className="mt-0.5">This is a computer-generated tax invoice.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-copper/40 bg-deep p-6 space-y-4">
            <h3 className="font-display text-lg text-ivory">Record Payment</h3>
            <p className="text-xs text-ivory/60">
              Invoice <strong className="text-champagne">{payInvoice.invoiceNo}</strong> (Balance: ₹
              {Number(payInvoice.balanceDue).toLocaleString()})
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="label">Amount to Record (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={Number(payInvoice.balanceDue)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="field text-xs py-2"
                />
              </div>

              <div>
                <label className="label">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="field text-xs py-2"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayInvoice(null)}
                  className="btn-outline flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPay}
                  className="btn-solid flex-1 py-2 text-xs"
                >
                  {recordingPay ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

