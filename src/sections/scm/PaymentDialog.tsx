import { useMemo, useState } from "react";
import type { PaymentMethod } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Banknote, CreditCard, QrCode, Smartphone, ShieldCheck, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Grand total in pesos. */
  total: number;
  /** Short description shown in the summary, e.g. "3 items · Coca-Cola Beverages". */
  summary: string;
  /** Called once the (simulated) payment succeeds. */
  onConfirm: (method: PaymentMethod) => Promise<void> | void;
}

const METHODS: { id: PaymentMethod; label: string; hint: string; icon: typeof Banknote }[] = [
  { id: "GCash", label: "GCash", hint: "Pay via GCash wallet", icon: Smartphone },
  { id: "Card", label: "Credit / Debit Card", hint: "Visa, Mastercard, BPI, BDO", icon: CreditCard },
  { id: "QR Ph", label: "QR Ph", hint: "Scan with any PH banking app", icon: QrCode },
  { id: "Cash", label: "Cash on Delivery", hint: "Pay the courier on arrival", icon: Banknote },
];

/** Decorative stand-in QR code (deterministic pattern, not scannable). */
function FakeQr() {
  const cells = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < 21; y++) {
      for (let x = 0; x < 21; x++) {
        // pseudo-random but stable pattern
        if (((x * 7 + y * 13 + ((x * y) % 5)) % 3) === 0) out.push({ x, y });
      }
    }
    return out;
  }, []);

  return (
    <svg viewBox="0 0 21 21" className="size-40 rounded-lg border bg-white p-2" aria-label="QR Ph payment code">
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="#111" />
      ))}
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#111" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#111" />
        </g>
      ))}
    </svg>
  );
}

export function PaymentDialog({ open, onOpenChange, total, summary, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("GCash");
  const [gcashNumber, setGcashNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const detailsValid =
    method === "Cash" ||
    method === "QR Ph" ||
    (method === "GCash" && /^09\d{9}$/.test(gcashNumber)) ||
    (method === "Card" && cardNumber.replace(/\s/g, "").length >= 15 && cardName.trim() && cardExpiry && cardCvc.length >= 3);

  const handlePay = async () => {
    if (!detailsValid || processing) return;
    setProcessing(true);
    try {
      // Simulated gateway round-trip — this is a demo, no real charge happens.
      await new Promise((r) => setTimeout(r, 1200));
      await onConfirm(method);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !processing && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
            Payment
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/30 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{summary}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Amount due</div>
          </div>
          <span className="text-2xl font-semibold tabular-nums text-brand">₱{Math.round(total).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                method === m.id ? "border-brand bg-brand/5 ring-1 ring-brand" : "hover:bg-muted/40"
              }`}
            >
              <m.icon className={`size-4 mb-1.5 ${method === m.id ? "text-brand" : "text-muted-foreground"}`} aria-hidden="true" />
              <div className="text-sm font-medium leading-tight">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{m.hint}</div>
            </button>
          ))}
        </div>

        <Separator />

        {method === "GCash" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-gcash">GCash Mobile Number</Label>
            <Input
              id="pay-gcash"
              inputMode="numeric"
              placeholder="09XX XXX XXXX"
              maxLength={11}
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-xs text-muted-foreground">A payment request will be sent to this GCash account.</p>
          </div>
        )}

        {method === "Card" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="pay-card-number">Card Number</Label>
              <Input
                id="pay-card-number"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ""))}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="pay-card-name">Name on Card</Label>
              <Input id="pay-card-name" placeholder="Maria Santos" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-card-expiry">Expiry</Label>
              <Input
                id="pay-card-expiry"
                placeholder="MM/YY"
                maxLength={5}
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-card-cvc">CVC</Label>
              <Input
                id="pay-card-cvc"
                inputMode="numeric"
                placeholder="123"
                maxLength={4}
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
        )}

        {method === "QR Ph" && (
          <div className="flex flex-col items-center gap-2 py-1">
            <FakeQr />
            <p className="text-xs text-muted-foreground text-center">
              Scan with GCash, Maya, or any InstaPay-enabled banking app,
              <br />
              then tap "Confirm Payment" below.
            </p>
          </div>
        )}

        {method === "Cash" && (
          <p className="text-sm text-muted-foreground">
            Prepare <span className="font-medium text-foreground">₱{Math.round(total).toLocaleString()}</span> in cash — you'll
            pay the courier when the order is delivered.
          </p>
        )}

        <DialogFooter className="gap-2 pt-1">
          <Button type="button" variant="outline" disabled={processing} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!detailsValid || processing}
            onClick={handlePay}
            className="bg-brand hover:bg-brand-dark text-white gap-1.5"
          >
            {processing ? (
              <>
                <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                Processing…
              </>
            ) : (
              <>
                <Lock className="size-4" aria-hidden="true" />
                {method === "Cash" ? "Confirm Order" : `Pay ₱${Math.round(total).toLocaleString()}`}
              </>
            )}
          </Button>
        </DialogFooter>

        <p className="text-[11px] text-center text-muted-foreground -mt-1">
          <Lock className="size-3 inline mr-1" aria-hidden="true" />
          Demo checkout — no real charge is made.
        </p>
      </DialogContent>
    </Dialog>
  );
}
