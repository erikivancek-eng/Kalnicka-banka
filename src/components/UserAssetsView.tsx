import React, { useState } from 'react';
import {
  Car,
  Home,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  XCircle,
  BadgeCheck
} from 'lucide-react';
import {
  VehicleOrder,
  PropertyReservation,
  UserListing
} from '../types';

interface UserAssetsViewProps {
  currentUser: string;
  userDisplayName: string;
  vehicleOrders: VehicleOrder[];
  reservations: PropertyReservation[];
  userListings: UserListing[];
  onNavigateToShop: () => void;
  onNavigateToBank: () => void;
  onEditListing: (listing: UserListing) => void;
  onDeleteListing: (id: string) => void;
  onUpdateVehicleStatus?: (id: string, newStatus: 'Čeka preuzimanje u banci' | 'Preuzeto' | 'Otkazano') => void;
  onUpdateReservationStatus?: (id: string, newStatus: 'Rezervirano – čeka obradu u banci' | 'Obrađeno' | 'Otkazano') => void;
  formatMoney: (amount: number) => string;
}

export const UserAssetsView: React.FC<UserAssetsViewProps> = ({
  currentUser,
  userDisplayName,
  vehicleOrders,
  reservations,
  userListings,
  onNavigateToShop,
  onNavigateToBank,
  onEditListing,
  onDeleteListing,
  onUpdateVehicleStatus,
  onUpdateReservationStatus,
  formatMoney
}) => {
  // 1. REZERVIRANA IMOVINA: samo one koje još NISU odobrene
  const pendingVehicles = vehicleOrders.filter(
    (v) => v.username === currentUser && v.status === 'Čeka preuzimanje u banci'
  );
  const pendingProperties = reservations.filter(
    (r) => r.username === currentUser && r.status === 'Rezervirano – čeka obradu u banci'
  );
  const totalPending = pendingVehicles.length + pendingProperties.length;

  // 2. MOJA IMOVINA: one koje su OBRAĐENE I PLAĆENE
  const ownedVehicles = vehicleOrders.filter(
    (v) => v.username === currentUser && v.status === 'Preuzeto' && v.isPaid
  );
  const ownedProperties = reservations.filter(
    (r) => r.username === currentUser && r.status === 'Obrađeno' && r.isPaid
  );
  const totalOwned = ownedVehicles.length + ownedProperties.length;

  // 3. MOJI OGLASI (korisnikova korištena imovina za prodaju)
  const myListings = userListings.filter((l) => l.seller === currentUser);

  return (
    <div className="space-y-8 pb-16" id="user-assets-container">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-sm select-none">
            💼
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Imovina Računa</h1>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-md uppercase tracking-wider">
                {userDisplayName}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pregled odobrene imovine u vašem vlasništvu te imovine koja čeka odobrenje u banci
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToShop}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            id="nav-to-shop-btn"
          >
            <span>Otvori Trgovinu</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToBank}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            id="nav-to-bank-btn"
          >
            <span>Kalnička Banka</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="assets-quick-stats">
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
              ⏳
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Rezervirana Imovina</p>
              <p className="text-xs text-amber-900 font-medium">
                {totalPending === 0 ? '0 stavki na čekanju' : 'Čeka odobrenje bankara'}
              </p>
            </div>
          </div>
          <span className="text-xl font-black text-amber-800 font-mono">
            {totalPending === 0 ? '0' : totalPending}
          </span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
              👑
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Moja Imovina</p>
              <p className="text-xs text-emerald-900 font-medium">Obrađeno & Plaćeno</p>
            </div>
          </div>
          <span className="text-xl font-black text-emerald-800 font-mono">{totalOwned}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center text-lg">
              🏷️
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Moji Oglasi</p>
              <p className="text-xs text-slate-500 font-medium">U prodaji u trgovini</p>
            </div>
          </div>
          <span className="text-xl font-black text-slate-700 font-mono">{myListings.length}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. REZERVIRANA IMOVINA (SAMO ONE KOJE JOŠ NISU ODOBRENE) */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl border border-amber-200/80 p-6 md:p-8 shadow-sm space-y-6" id="section-rezervirana-imovina">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center text-xl select-none shadow-xs">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Rezervirana Imovina</h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                  totalPending === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {totalPending === 0 ? 'Odobreno' : 'Na čekanju'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ovdje se nalazi imovina koju ste naručili/rezervirali, a koja <strong>još nije odobrena</strong> u banci. Novac se ne oduzima unaprijed.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto font-mono">
            {totalPending === 0 ? '0 stavki na čekanju' : `${totalPending} ${totalPending === 1 ? 'stavka na čekanju' : 'stavki na čekanju'}`}
          </span>
        </div>

        {totalPending === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> 0 stavki na čekanju
            </div>
            <p className="font-bold text-slate-700 text-xs">Vaša rezervirana imovina je već odobrena u banci!</p>
            <p className="text-[11px] text-slate-400 mt-1">Nemate novih stavki na čekanju odobrenja (0 stavki na čekanju). Odobrena imovina nalazi se u sekciji Vašeg vlasništva.</p>
            <button
              onClick={onNavigateToShop}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Pregledaj ponudu u Trgovini →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pending Vehicles */}
            {pendingVehicles.map((order) => (
              <div
                key={order.id}
                className="bg-amber-50/30 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-300 transition-all shadow-xs"
                id={`pending-vehicle-${order.id}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-xl flex items-center justify-center shadow-xs">
                        🏎️
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vozilo</span>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      Čeka odobrenje
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{order.carName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Naručeno: {order.date}</p>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex justify-between items-baseline">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Iznos kupnje:</span>
                    <span className="font-black text-slate-900 text-sm">{formatMoney(order.price)} €</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Nije odobreno
                    </p>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Novac ({formatMoney(order.price)} €) se sa vašeg računa <strong>ne oduzima</strong> dok bankar ne obradi i odobri kupnju.
                    </p>
                  </div>
                </div>

                {onUpdateVehicleStatus && (
                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onUpdateVehicleStatus(order.id, 'Otkazano')}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      title="Otkaži ovu narudžbu"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Otkaži rezervaciju</span>
                    </button>
                    <button
                      onClick={onNavigateToBank}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Idi u Banku →
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Pending Properties */}
            {pendingProperties.map((res) => (
              <div
                key={res.id}
                className="bg-amber-50/30 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-300 transition-all shadow-xs"
                id={`pending-property-${res.id}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-xl flex items-center justify-center shadow-xs">
                        🏡
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nekretnina</span>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      Čeka odobrenje
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{res.propertyTitle}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Rezervirano: {res.date}</p>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex justify-between items-baseline">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Cijena:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {res.price === 0 ? 'Besplatno' : `${formatMoney(res.price)} €`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Nije odobreno
                    </p>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      {res.price > 0
                        ? `Iznos od ${formatMoney(res.price)} € biti će skinut tek nakon što bankar odobri i obradi kupnju.`
                        : 'Besplatna rezervacija — čeka službenu potvrdu bankara.'}
                    </p>
                  </div>
                </div>

                {onUpdateReservationStatus && (
                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onUpdateReservationStatus(res.id, 'Otkazano')}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      title="Otkaži rezervaciju"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Otkaži rezervaciju</span>
                    </button>
                    <button
                      onClick={onNavigateToBank}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Idi u Banku →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 2. MOJA IMOVINA (SAMO ONE KOJE SU OBRAĐENE I PLAĆENE)   */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl border border-emerald-200/80 p-6 md:p-8 shadow-sm space-y-6" id="section-moja-imovina-vlasnistvo">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center text-xl select-none shadow-xs">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Moja Imovina</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Vlasništvo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Službena imovina u vašem posjedu — <strong>obrađeno i plaćeno</strong> s vašeg računa u Kalničkoj Banci.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-mono">
            {totalOwned} {totalOwned === 1 ? 'predmet u vlasništvu' : 'predmeta u vlasništvu'}
          </span>
        </div>

        {totalOwned === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <BadgeCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700 text-xs">Još nemate obrađene i plaćene imovine u vlasništvu.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Kada bankar u banci odobri i obradi vaše rezervacije, vaša imovina će se trajno pojaviti ovdje.
            </p>
            <button
              onClick={onNavigateToShop}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Posjeti Trgovinu →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Owned Vehicles */}
            {ownedVehicles.map((order) => (
              <div
                key={order.id}
                className="bg-emerald-50/20 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-xs"
                id={`owned-vehicle-${order.id}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-xl flex items-center justify-center shadow-xs">
                        🏎️
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Automobil</span>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Plaćeno & Preuzeto
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{order.carName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Kupljeno: {order.date}</p>
                  </div>

                  <div className="pt-2 border-t border-emerald-100 flex justify-between items-baseline">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Vrijednost:</span>
                    <span className="font-black text-slate-900 text-sm">{formatMoney(order.price)} €</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>U trajnom vlasništvu</span>
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      Novac je skinut s računa: <strong>-{formatMoney(order.price)} €</strong> {order.paidAt ? `(${order.paidAt})` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Vlasnik: {userDisplayName}</span>
                  <span className="text-emerald-700 font-extrabold font-mono">HR-KB-VOZILO</span>
                </div>
              </div>
            ))}

            {/* Owned Properties */}
            {ownedProperties.map((res) => (
              <div
                key={res.id}
                className="bg-emerald-50/20 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-300 transition-all shadow-xs"
                id={`owned-property-${res.id}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-xl flex items-center justify-center shadow-xs">
                        🏡
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Nekretnina</span>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Obrađeno & Plaćeno
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{res.propertyTitle}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Rezervirano: {res.date}</p>
                  </div>

                  <div className="pt-2 border-t border-emerald-100 flex justify-between items-baseline">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Vrijednost:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {res.price === 0 ? 'Besplatno' : `${formatMoney(res.price)} €`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>U trajnom vlasništvu</span>
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      {res.price > 0
                        ? `Novac je skinut s računa: -${formatMoney(res.price)} € ${res.paidAt ? `(${res.paidAt})` : ''}`
                        : 'Službeno dodijeljeno u posjed.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Vlasnik: {userDisplayName}</span>
                  <span className="text-emerald-700 font-extrabold font-mono">HR-KB-POSJED</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 3. MOJI OGLASI (User listings)                            */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6" id="section-moji-oglasi">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg select-none">
              🏷️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Moji Oglasi</h2>
              <p className="text-[11px] text-slate-400">Predmeti koje nudite na prodaju u rubrici Korištena Imovina</p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {myListings.length} {myListings.length === 1 ? 'oglas' : 'oglasa'}
          </span>
        </div>

        {myListings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600 text-xs">Nemate aktivnih oglasa za prodaju.</p>
            <p className="text-[11px] text-slate-400 mt-1">Možete oglasiti svoj automobil ili prostor u Trgovini.</p>
            <button
              onClick={onNavigateToShop}
              className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
            >
              + Postavi oglas u Trgovini →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((listing) => {
              const isCar = listing.type === 'car';

              return (
                <div
                  key={listing.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-xs">
                        {isCar ? '🚗' : '🏡'}
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                          listing.status === 'reserved'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {listing.status === 'reserved' ? 'Rezervirano' : 'Aktivan oglas'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{listing.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{listing.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Vaša cijena:</span>
                      <span className="font-black text-slate-800 text-sm">{formatMoney(listing.price)} €</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                    <button
                      onClick={() => onEditListing(listing)}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Uredi
                    </button>
                    <button
                      onClick={() => onDeleteListing(listing.id)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 transition-all flex items-center justify-center cursor-pointer"
                      title="Ukloni oglas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
