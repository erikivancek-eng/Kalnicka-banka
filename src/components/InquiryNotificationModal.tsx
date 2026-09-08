import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  AlertTriangle,
  X,
  User,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ListingInquiry } from '../types';

interface InquiryNotificationModalProps {
  inquiry: ListingInquiry;
  currentUser: string;
  userDisplayName: string;
  userBalance: number;
  onAccept: (inquiryId: string) => void;
  onCounter: (inquiryId: string, counterPrice: number) => void;
  onReject: (inquiryId: string) => void;
  onClose: () => void;
  formatMoney: (amount: number) => string;
}

export const InquiryNotificationModal: React.FC<InquiryNotificationModalProps> = ({
  inquiry,
  currentUser,
  userDisplayName,
  userBalance,
  onAccept,
  onCounter,
  onReject,
  onClose,
  formatMoney
}) => {
  const isSeller = inquiry.seller === currentUser;
  const isBuyer = inquiry.buyer === currentUser;

  // Negotiation states
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterPrice, setCounterPrice] = useState<string>(inquiry.currentOffer.toString());
  const [validationError, setValidationError] = useState<string | null>(null);

  const minAllowed = Math.max(0, inquiry.currentOffer - 10000);
  const maxAllowed = inquiry.currentOffer + 10000;

  const handlePriceChange = (val: string) => {
    setCounterPrice(val);
    setValidationError(null);
    const num = parseFloat(val);
    if (isNaN(num)) {
      setValidationError('Molimo unesite valjan iznos.');
      return;
    }
    if (num < minAllowed || num > maxAllowed) {
      setValidationError(
        `Cjenkanje je dopušteno samo unutar 10.000 € manje ili više od trenutne ponude (${formatMoney(minAllowed)} € do ${formatMoney(maxAllowed)} €).`
      );
      return;
    }
    // If buyer is countering, check buyer balance limit (-10,000 €)
    if (isBuyer && userBalance - num < -10000) {
      setValidationError(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus na računu je 10.000 € (Možete ponuditi najviše ${formatMoney(userBalance + 10000)} €).`
      );
      return;
    }
  };

  const handleSetQuickPrice = (diff: number) => {
    const target = inquiry.currentOffer + diff;
    const clamped = Math.max(0, Math.min(target, maxAllowed));
    setCounterPrice(clamped.toString());
    handlePriceChange(clamped.toString());
  };

  const handleConfirmCounter = () => {
    const num = parseFloat(counterPrice);
    if (isNaN(num)) {
      setValidationError('Molimo unesite valjan iznos.');
      return;
    }
    if (num < minAllowed || num > maxAllowed) {
      setValidationError(
        `Cjenkanje je dopušteno samo unutar 10.000 € manje ili više od trenutne ponude (${formatMoney(minAllowed)} € do ${formatMoney(maxAllowed)} €).`
      );
      return;
    }
    if (isBuyer && userBalance - num < -10000) {
      setValidationError(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus je 10.000 €.`
      );
      return;
    }
    onCounter(inquiry.id, num);
  };

  const handleConfirmAccept = () => {
    // If buyer is accepting seller's counter-offer, check buyer balance
    if (isBuyer && userBalance - inquiry.currentOffer < -10000) {
      setValidationError(
        `Nemate dovoljno novaca za prihvaćanje! Maksimalan dozvoljeni minus je 10.000 € (Vaše stanje je ${formatMoney(userBalance)} €, cijena je ${formatMoney(inquiry.currentOffer)} €).`
      );
      return;
    }
    onAccept(inquiry.id);
  };

  // Wording requested by user:
  // "(osoba koja je poslala upit) zeli kupiti (imovinu ili vozilo) sa tvojeg oglasa za ..."
  const otherPersonName = isSeller ? inquiry.buyerName : inquiry.sellerName;
  const itemTypeLabel = inquiry.listingType === 'car' ? 'vozilo' : 'imovinu';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" id="inquiry-center-modal">
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            title="Zatvori obavijest"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner select-none">
              🔔
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                Obavijest o ponudi
              </span>
              <h2 className="text-xl font-black mt-0.5 tracking-tight">
                {isSeller ? 'Nova ponuda za vaš oglas' : 'Odgovor na vaš upit'}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Main User Prompt Notice */}
          <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200/90 text-amber-950 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-2xl select-none mt-0.5">💬</span>
              <div>
                <p className="text-sm md:text-base font-extrabold leading-snug">
                  {isSeller ? (
                    <>
                      <strong className="text-blue-700 font-black">{inquiry.buyerName}</strong> želi kupiti {itemTypeLabel} <strong className="text-slate-900">"{inquiry.listingTitle}"</strong> sa tvojeg oglasa za <strong className="text-emerald-700 font-black text-lg">{formatMoney(inquiry.currentOffer)} €</strong>.
                    </>
                  ) : (
                    <>
                      Prodavatelj <strong className="text-blue-700 font-black">{inquiry.sellerName}</strong> je ponudio novu cijenu za {itemTypeLabel} <strong className="text-slate-900">"{inquiry.listingTitle}"</strong>: <strong className="text-emerald-700 font-black text-lg">{formatMoney(inquiry.currentOffer)} €</strong>.
                    </>
                  )}
                </p>
                <p className="text-xs text-amber-800 font-medium mt-1">
                  Možete prihvatiti ponudu, odbiti je ili se cjenkati (samo do 10.000 € manje ili više).
                </p>
              </div>
            </div>
          </div>

          {/* Details Overview */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Oglas:</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {inquiry.listingTitle} ({inquiry.listingType === 'car' ? 'Automobil 🏎️' : 'Nekretnina 🏡'})
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Početna cijena:</span>
              <span className="font-bold text-slate-600 line-through">
                {formatMoney(inquiry.originalPrice)} €
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">Trenutna ponuda:</span>
              <span className="text-base font-black text-emerald-600">
                {formatMoney(inquiry.currentOffer)} €
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Razlika od oglašene cijene:</span>
              <span className={`font-bold ${inquiry.currentOffer < inquiry.originalPrice ? 'text-amber-600' : inquiry.currentOffer > inquiry.originalPrice ? 'text-emerald-600' : 'text-slate-600'}`}>
                {inquiry.currentOffer === inquiry.originalPrice
                  ? 'Ista cijena (0 €)'
                  : inquiry.currentOffer > inquiry.originalPrice
                  ? `+${formatMoney(inquiry.currentOffer - inquiry.originalPrice)} €`
                  : `-${formatMoney(inquiry.originalPrice - inquiry.currentOffer)} €`}
              </span>
            </div>
          </div>

          {/* Negotiation / Bargaining section */}
          {showCounterInput ? (
            <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-900">
                    Cjenkanje (Protuponuda)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  Dozvoljeno: ±10.000 €
                </span>
              </div>

              <p className="text-xs text-blue-800">
                Možete se cjenkati <strong>samo 10.000 € manje ili više</strong> od trenutne ponude ({formatMoney(minAllowed)} € do {formatMoney(maxAllowed)} €).
              </p>

              {/* Quick Adjustment Chips */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSetQuickPrice(-10000)}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  -10.000 €
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickPrice(-5000)}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  -5.000 €
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickPrice(0)}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Trenutna cijena
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickPrice(5000)}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  +5.000 €
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickPrice(10000)}
                  className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  +10.000 €
                </button>
              </div>

              {/* Custom Input */}
              <div className="relative">
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white border border-blue-300 focus:border-blue-600 rounded-2xl text-lg font-black text-slate-900 outline-none transition-all"
                  min={minAllowed}
                  max={maxAllowed}
                  step="500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">€</span>
              </div>

              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCounterInput(false);
                    setValidationError(null);
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Odustani od cjenkanja
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCounter}
                  disabled={Boolean(validationError)}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Pošalji protuponudu ({formatMoney(Number(counterPrice) || 0)} €)</span>
                </button>
              </div>
            </div>
          ) : null}

          {validationError && !showCounterInput && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          {!showCounterInput && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accept Button */}
                <button
                  onClick={handleConfirmAccept}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98"
                  id="accept-inquiry-btn"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Prihvati ({formatMoney(inquiry.currentOffer)} €)</span>
                </button>

                {/* Counter / Bargain Button */}
                <button
                  onClick={() => setShowCounterInput(true)}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98"
                  id="counter-inquiry-btn"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Cjenkaj se (±10.000 €)</span>
                </button>
              </div>

              {/* Reject Button */}
              <button
                onClick={() => onReject(inquiry.id)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-bold text-xs rounded-2xl transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5"
                id="reject-inquiry-btn"
              >
                <XCircle className="w-4 h-4" />
                <span>Odbij ponudu</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
