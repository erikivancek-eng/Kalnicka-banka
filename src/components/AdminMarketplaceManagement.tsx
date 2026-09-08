import React, { useState } from 'react';
import {
  Store,
  Tag,
  Car,
  Home,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Users
} from 'lucide-react';
import {
  UserListing,
  PropertyReservation,
  VehicleOrder
} from '../types';

interface AdminMarketplaceManagementProps {
  listings: UserListing[];
  reservations: PropertyReservation[];
  vehicleOrders: VehicleOrder[];
  onDeleteListing: (id: string) => void;
  onUpdateVehicleStatus: (id: string, newStatus: 'Čeka preuzimanje u banci' | 'Preuzeto' | 'Otkazano') => void;
  onUpdateReservationStatus: (id: string, newStatus: 'Rezervirano – čeka obradu u banci' | 'Obrađeno' | 'Otkazano') => void;
  formatMoney: (amount: number) => string;
}

export const AdminMarketplaceManagement: React.FC<AdminMarketplaceManagementProps> = ({
  listings,
  reservations,
  vehicleOrders,
  onDeleteListing,
  onUpdateVehicleStatus,
  onUpdateReservationStatus,
  formatMoney
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'reservations' | 'vehicles'>('vehicles');

  const pendingVehicles = vehicleOrders.filter((v) => v.status === 'Čeka preuzimanje u banci');
  const pendingReservations = reservations.filter((r) => r.status === 'Rezervirano – čeka obradu u banci');

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="admin-marketplace-manager">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl select-none">
            🏛️
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Administracija Trgovine & Preuzimanja</h3>
            <p className="text-xs text-slate-400">Upravljanje narudžbama vozila, rezervacijama nekretnina i oglasima</p>
          </div>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vehicles' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vozila za preuzimanje</span>
            {pendingVehicles.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                {pendingVehicles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reservations' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Rezervacije nekretnina</span>
            {pendingReservations.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center">
                {pendingReservations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'listings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Svi oglasi korisnika</span>
            <span className="text-[10px] text-slate-400">({listings.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* 1. VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Vozila koja čekaju obradu i preuzimanje u banci:
              </span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Na čekanju: {pendingVehicles.length}
              </span>
            </div>

            {pendingVehicles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-slate-700 text-xs">Nema vozila koja čekaju obradu.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sve zaprimljene narudžbe automobila su uspješno obrađene i skinute s računa.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {pendingVehicles.map((order) => {
                  return (
                    <div key={order.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
                          🏎️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800">{order.carName}</h4>
                            <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider bg-amber-100 text-amber-800">
                              {order.status}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-500">
                              Čeka plaćanje
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Kupac: <strong className="text-slate-700">{order.userDisplayName}</strong> ({order.username}) • Iznos: <strong>{formatMoney(order.price)} €</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Datum kupnje: {order.date}
                          </p>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateVehicleStatus(order.id, 'Preuzeto')}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          title={`Označi kao preuzeto i skini ${formatMoney(order.price)} € s računa korisnika`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Obradi & Skini {formatMoney(order.price)} €</span>
                        </button>
                        <button
                          onClick={() => onUpdateVehicleStatus(order.id, 'Otkazano')}
                          className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          title="Otkaži narudžbu"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. RESERVATIONS TAB */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Rezervirane nekretnine koje čekaju obradu u banci:
              </span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                Na čekanju: {pendingReservations.length}
              </span>
            </div>

            {pendingReservations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-slate-700 text-xs">Nema rezervacija na čekanju.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sve rezervacije nekretnina su uspješno obrađene.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {pendingReservations.map((res) => {
                  return (
                    <div key={res.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
                          🏡
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800">{res.propertyTitle}</h4>
                            <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider bg-amber-100 text-amber-800">
                              {res.status}
                            </span>
                            {res.price > 0 && (
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-500">
                                Čeka plaćanje
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Rezervirao: <strong className="text-slate-700">{res.userDisplayName}</strong> ({res.username}) • Cijena: <strong>{res.price === 0 ? 'Besplatno' : `${formatMoney(res.price)} €`}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Datum: {res.date}
                          </p>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateReservationStatus(res.id, 'Obrađeno')}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          title={`Označi kao obrađeno i skini ${formatMoney(res.price)} € s računa`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Obradi {res.price > 0 ? `& Skini ${formatMoney(res.price)} €` : ''}</span>
                        </button>
                        <button
                          onClick={() => onUpdateReservationStatus(res.id, 'Otkazano')}
                          className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          title="Otkaži rezervaciju"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. USER LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Svi oglasi koje su igrači postavili u korištenu imovinu:
              </span>
              <span className="font-bold text-slate-700">Ukupno oglasa: {listings.length}</span>
            </div>

            {listings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-xs">Nema aktivnih oglasa korisnika.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {listings.map((l) => {
                  const isCar = l.type === 'car';

                  return (
                    <div key={l.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                          {isCar ? '🚗' : '🏡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800">{l.title}</h4>
                            <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                              {isCar ? 'Automobil' : 'Nekretnina'}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                              l.status === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {l.status === 'reserved' ? 'Rezervirano' : 'Aktivno'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Prodavatelj: <strong className="text-slate-700">{l.sellerName}</strong> • Cijena: <strong>{formatMoney(l.price)} €</strong>
                          </p>
                          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{l.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDeleteListing(l.id)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Ukloni oglas</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
