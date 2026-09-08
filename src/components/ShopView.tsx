import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Home,
  Car,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  User,
  Trash2,
  Edit3,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  MessageSquare
} from 'lucide-react';
import {
  UserListing,
  PredefinedProperty,
  PredefinedCar,
  PropertyReservation,
  VehicleOrder,
  AssetCategory,
  ListingInquiry
} from '../types';
import { PREDEFINED_PROPERTIES, PREDEFINED_CARS } from '../data/predefinedData';

interface ShopViewProps {
  currentUser: string;
  userDisplayName: string;
  userBalance: number;
  listings: UserListing[];
  reservations: PropertyReservation[];
  vehicleOrders: VehicleOrder[];
  inquiries: ListingInquiry[];
  onAddListing: (listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => void;
  onEditListing: (id: string, updated: Partial<UserListing>) => void;
  onDeleteListing: (id: string) => void;
  onReserveProperty: (property: PredefinedProperty | UserListing) => void;
  onBuyCar: (car: PredefinedCar | UserListing) => void;
  onSendInquiry: (data: {
    listingId: string;
    listingTitle: string;
    listingType: AssetCategory;
    seller: 'erik' | 'nera' | 'vito';
    sellerName: string;
    originalPrice: number;
    offeredPrice: number;
  }) => void;
  onNavigateToBank: () => void;
  formatMoney: (amount: number) => string;
}

export const ShopView: React.FC<ShopViewProps> = ({
  currentUser,
  userDisplayName,
  userBalance,
  listings,
  reservations,
  vehicleOrders,
  inquiries,
  onAddListing,
  onEditListing,
  onDeleteListing,
  onReserveProperty,
  onBuyCar,
  onSendInquiry,
  onNavigateToBank,
  formatMoney
}) => {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'cars' | 'properties' | 'used' | 'reserved' | 'for_sale'>('all');
  const [carSortOrder, setCarSortOrder] = useState<'none' | 'cheapest' | 'expensive'>('none');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListing, setEditingListing] = useState<UserListing | null>(null);

  // Inquiry Modal State for used listings
  const [inquiryListing, setInquiryListing] = useState<UserListing | null>(null);
  const [inquiryOfferPrice, setInquiryOfferPrice] = useState<string>('');
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Balance limit error alert
  const [balanceErrorAlert, setBalanceErrorAlert] = useState<string | null>(null);

  // Form States for Listing
  const [selectedOwnedAssetKey, setSelectedOwnedAssetKey] = useState<string>('');
  const [creationMode, setCreationMode] = useState<'owned' | 'custom'>('owned');
  const [listingType, setListingType] = useState<AssetCategory>('car');
  const [listingTitle, setListingTitle] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [listingFormError, setListingFormError] = useState<string | null>(null);

  // Confirmation Modals
  const [pendingReservation, setPendingReservation] = useState<{
    item: PredefinedProperty | UserListing;
    isCustom: boolean;
    date: string;
  } | null>(null);

  const [pendingCarPurchase, setPendingCarPurchase] = useState<{
    item: PredefinedCar | UserListing;
    isCustom: boolean;
  } | null>(null);

  // Success Confirmation Feedback Modals
  const [successModal, setSuccessModal] = useState<{
    type: 'reservation' | 'car_purchase' | 'inquiry';
    itemName: string;
    price: number;
  } | null>(null);

  // 5 Hours duration in milliseconds (18,000,000 ms)
  const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

  // Extract purchase timestamp from item
  const getItemTimestamp = (item: { id: string; purchasedAt?: number; lastPurchasedAt?: number; date?: string }): number => {
    if (item.purchasedAt && item.purchasedAt > 0) return item.purchasedAt;
    if (item.lastPurchasedAt && item.lastPurchasedAt > 0) return item.lastPurchasedAt;

    const parts = item.id.split('_');
    for (const part of parts) {
      const num = Number(part);
      if (!isNaN(num) && num > 1600000000000 && num < 2500000000000) {
        return num;
      }
    }

    if (item.date) {
      try {
        const match = item.date.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s*(\d{1,2}):(\d{2})/);
        if (match) {
          const [, d, m, y, h, min] = match;
          const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min)).getTime();
          if (!isNaN(parsed)) return parsed;
        }
      } catch {}
    }

    return 0;
  };

  // Owned Assets in current user's possession (Preuzeto/Obrađeno and isPaid)
  const myOwnedVehicles = vehicleOrders.filter(
    (v) => v.username === currentUser && v.status === 'Preuzeto' && v.isPaid
  );

  const myOwnedProperties = reservations.filter(
    (r) => r.username === currentUser && r.status === 'Obrađeno' && r.isPaid
  );

  // Formatted list of owned assets available for selling
  interface OwnedSellItem {
    key: string;
    sourceId: string;
    type: AssetCategory;
    title: string;
    originalPrice: number;
    icon: string;
    badge: string;
  }

  const ownedSellItems: OwnedSellItem[] = [
    ...myOwnedVehicles.map((v) => {
      const predefined = PREDEFINED_CARS.find(
        (c) => c.name.toLowerCase() === v.carName.toLowerCase() || c.id === v.carId
      );
      return {
        key: `veh_${v.id}`,
        sourceId: v.id,
        type: 'car' as AssetCategory,
        title: v.carName,
        originalPrice: v.price,
        icon: predefined?.icon || '🏎️',
        badge: 'Automobil'
      };
    }),
    ...myOwnedProperties.map((r) => {
      const predefined = PREDEFINED_PROPERTIES.find(
        (p) => p.title.toLowerCase() === r.propertyTitle.toLowerCase() || p.id === r.propertyId
      );
      return {
        key: `prop_${r.id}`,
        sourceId: r.id,
        type: 'property' as AssetCategory,
        title: r.propertyTitle,
        originalPrice: r.price,
        icon: predefined?.icon || '🏡',
        badge: 'Nekretnina'
      };
    })
  ];

  // Open Create Form
  const handleOpenAddModal = () => {
    setEditingListing(null);
    setListingFormError(null);

    if (ownedSellItems.length > 0) {
      setCreationMode('owned');
      const first = ownedSellItems[0];
      setSelectedOwnedAssetKey(first.key);
      setListingType(first.type);
      setListingTitle(first.title);
      setListingPrice(first.originalPrice > 0 ? first.originalPrice.toString() : '500');
      setListingDesc(`Korišteni ${first.type === 'car' ? 'automobil' : 'prostor'} u vlasništvu klijenta ${userDisplayName}. Službeno kupljeno u Kalničkoj Banci.`);
    } else {
      setCreationMode('custom');
      setSelectedOwnedAssetKey('');
      setListingType('car');
      setListingTitle('');
      setListingPrice('');
      setListingDesc('');
    }

    setShowAddModal(true);
  };

  // Select an owned asset inside the modal
  const handleSelectOwnedItem = (item: OwnedSellItem) => {
    setSelectedOwnedAssetKey(item.key);
    setListingType(item.type);
    setListingTitle(item.title);
    if (!listingPrice || listingPrice === '0' || Number(listingPrice) === 0) {
      setListingPrice(item.originalPrice > 0 ? item.originalPrice.toString() : '500');
    }
    setListingDesc(`Korišteni ${item.type === 'car' ? 'automobil' : 'prostor'} u vlasništvu klijenta ${userDisplayName}. Službeno kupljeno u Kalničkoj Banci.`);
  };

  // Open Edit Form
  const handleOpenEditModal = (listing: UserListing) => {
    setEditingListing(listing);
    setSelectedOwnedAssetKey('');
    setListingType(listing.type);
    setListingTitle(listing.title);
    setListingPrice(listing.price.toString());
    setListingDesc(listing.description);
    setListingFormError(null);
    setShowAddModal(true);
  };

  // Handle Form Submit
  const handleListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setListingFormError(null);

    const title = listingTitle.trim();
    if (!title) {
      setListingFormError('Molimo unesite naziv imovine koju želite oglasiti.');
      return;
    }

    const price = parseFloat(listingPrice);
    if (isNaN(price) || price < 0) {
      setListingFormError('Unesite ispravnu cijenu (0 ili više eura).');
      return;
    }

    if (!listingDesc.trim()) {
      setListingFormError('Molimo unesite kratki opis.');
      return;
    }

    if (editingListing) {
      onEditListing(editingListing.id, {
        type: listingType,
        title,
        price,
        description: listingDesc.trim()
      });
    } else {
      onAddListing({
        seller: currentUser as 'erik' | 'nera' | 'vito',
        sellerName: userDisplayName,
        type: listingType,
        title,
        price,
        description: listingDesc.trim()
      });
    }

    setShowAddModal(false);
  };

  // Check if a predefined property was purchased/reserved within the last 5 hours
  const isPropertyUnavailable = (propId: string, propTitle?: string): boolean => {
    const now = Date.now();
    return reservations.some((r) => {
      if (r.status === 'Otkazano') return false;
      const matchesId = r.propertyId === propId || r.listingId === propId;
      const matchesTitle = propTitle && r.propertyTitle.toLowerCase() === propTitle.toLowerCase();
      if (!matchesId && !matchesTitle) return false;

      const ts = getItemTimestamp(r);
      return ts > 0 ? now - ts < FIVE_HOURS_MS : true;
    });
  };

  // Check if a predefined car was bought within the last 5 hours
  const isCarUnavailable = (carId: string, carName?: string): boolean => {
    const now = Date.now();
    return vehicleOrders.some((v) => {
      if (v.status === 'Otkazano') return false;
      const matchesId = v.carId === carId || v.listingId === carId;
      const matchesTitle = carName && v.carName.toLowerCase() === carName.toLowerCase();
      if (!matchesId && !matchesTitle) return false;

      const ts = getItemTimestamp(v);
      return ts > 0 ? now - ts < FIVE_HOURS_MS : true;
    });
  };

  // Check if a used listing was purchased within the last 5 hours
  const isListingUnavailable = (listing: UserListing): boolean => {
    const now = Date.now();
    if (listing.lastPurchasedAt && listing.lastPurchasedAt > 0) {
      if (now - listing.lastPurchasedAt < FIVE_HOURS_MS) return true;
    }

    const hasRecentOrder = vehicleOrders.some((v) => {
      if (v.status === 'Otkazano') return false;
      const matches = v.listingId === listing.id || (v.carName && v.carName.toLowerCase() === listing.title.toLowerCase());
      if (!matches) return false;
      const ts = getItemTimestamp(v);
      return ts > 0 ? now - ts < FIVE_HOURS_MS : true;
    });
    if (hasRecentOrder) return true;

    const hasRecentRes = reservations.some((r) => {
      if (r.status === 'Otkazano') return false;
      const matches = r.listingId === listing.id || (r.propertyTitle && r.propertyTitle.toLowerCase() === listing.title.toLowerCase());
      if (!matches) return false;
      const ts = getItemTimestamp(r);
      return ts > 0 ? now - ts < FIVE_HOURS_MS : true;
    });
    if (hasRecentRes) return true;

    return false;
  };

  // Trigger reservation confirmation modal
  const handleInitiateReservation = (property: PredefinedProperty | UserListing, isCustom = false) => {
    if (userBalance - property.price < -10000) {
      setBalanceErrorAlert(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus na računu je 10.000 €.\nVaše trenutno stanje je ${formatMoney(userBalance)} €, a cijena imovine je ${formatMoney(property.price)} €.\nMožete kupiti imovinu u vrijednosti najviše do ${formatMoney(userBalance + 10000)} €.`
      );
      return;
    }
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPendingReservation({
      item: property,
      isCustom,
      date: formattedDate
    });
  };

  // Confirm reservation
  const handleConfirmReservation = () => {
    if (!pendingReservation) return;
    if (userBalance - pendingReservation.item.price < -10000) {
      setBalanceErrorAlert(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus na računu je 10.000 €.`
      );
      setPendingReservation(null);
      return;
    }
    onReserveProperty(pendingReservation.item);
    const itemName = 'title' in pendingReservation.item ? pendingReservation.item.title : 'Imovina';
    const price = pendingReservation.item.price;
    setPendingReservation(null);
    setSuccessModal({
      type: 'reservation',
      itemName,
      price
    });
  };

  // Trigger car purchase confirmation modal
  const handleInitiateCarPurchase = (car: PredefinedCar | UserListing, isCustom = false) => {
    if (userBalance - car.price < -10000) {
      setBalanceErrorAlert(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus na računu je 10.000 €.\nVaše trenutno stanje je ${formatMoney(userBalance)} €, a cijena vozila je ${formatMoney(car.price)} €.\nMožete kupiti vozilo u vrijednosti najviše do ${formatMoney(userBalance + 10000)} €.`
      );
      return;
    }
    setPendingCarPurchase({
      item: car,
      isCustom
    });
  };

  // Confirm car purchase
  const handleConfirmCarPurchase = () => {
    if (!pendingCarPurchase) return;
    if (userBalance - pendingCarPurchase.item.price < -10000) {
      setBalanceErrorAlert(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus na računu je 10.000 €.`
      );
      setPendingCarPurchase(null);
      return;
    }
    onBuyCar(pendingCarPurchase.item);
    const itemName = 'name' in pendingCarPurchase.item ? pendingCarPurchase.item.name : pendingCarPurchase.item.title;
    const price = pendingCarPurchase.item.price;
    setPendingCarPurchase(null);
    setSuccessModal({
      type: 'car_purchase',
      itemName,
      price
    });
  };

  // Open inquiry modal for used listing
  const handleOpenInquiry = (listing: UserListing) => {
    setInquiryListing(listing);
    setInquiryOfferPrice(listing.price.toString());
    setInquiryError(null);
  };

  // Submit inquiry for used listing
  const handleSendInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryListing) return;
    const price = parseFloat(inquiryOfferPrice);
    if (isNaN(price) || price < 0) {
      setInquiryError('Molimo unesite valjanu ponudu u eurima.');
      return;
    }
    const minOffer = Math.max(0, inquiryListing.price - 10000);
    const maxOffer = inquiryListing.price + 10000;
    if (price < minOffer || price > maxOffer) {
      setInquiryError(
        `Cjenkanje je dopušteno samo unutar 10.000 € manje ili više od oglašene cijene (${formatMoney(minOffer)} € do ${formatMoney(maxOffer)} €).`
      );
      return;
    }
    if (userBalance - price < -10000) {
      setInquiryError(
        `Nemate dovoljno novaca! Maksimalan dozvoljeni minus je 10.000 € (Možete ponuditi najviše ${formatMoney(userBalance + 10000)} €).`
      );
      return;
    }

    onSendInquiry({
      listingId: inquiryListing.id,
      listingTitle: inquiryListing.title,
      listingType: inquiryListing.type,
      seller: inquiryListing.seller,
      sellerName: inquiryListing.sellerName,
      originalPrice: inquiryListing.price,
      offeredPrice: price
    });

    const targetTitle = inquiryListing.title;
    setInquiryListing(null);
    setSuccessModal({
      type: 'inquiry',
      itemName: targetTitle,
      price: price
    });
  };

  // Filter and sort items
  const normalizedQuery = searchQuery.toLowerCase().trim();

  // Filter used listings
  const filteredUsedListings = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(normalizedQuery) ||
                          l.description.toLowerCase().includes(normalizedQuery) ||
                          l.sellerName.toLowerCase().includes(normalizedQuery);
    if (!matchesSearch) return false;

    const unavailable = isListingUnavailable(l);

    if (activeFilter === 'all') return true;
    if (activeFilter === 'used') return true;
    if (activeFilter === 'cars') return l.type === 'car';
    if (activeFilter === 'properties') return l.type === 'property';
    if (activeFilter === 'reserved') return unavailable;
    if (activeFilter === 'for_sale') return !unavailable;
    return true;
  });

  // Filter predefined properties
  const filteredProperties = PREDEFINED_PROPERTIES.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(normalizedQuery);
    if (!matchesSearch) return false;

    const unavailable = isPropertyUnavailable(p.id, p.title);

    if (activeFilter === 'all') return true;
    if (activeFilter === 'properties') return true;
    if (activeFilter === 'used') return false;
    if (activeFilter === 'cars') return false;
    if (activeFilter === 'reserved') return unavailable;
    if (activeFilter === 'for_sale') return !unavailable;
    return true;
  });

  // Filter and sort predefined cars
  let filteredCars = PREDEFINED_CARS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(normalizedQuery) ||
                          (c.badge && c.badge.toLowerCase().includes(normalizedQuery));
    if (!matchesSearch) return false;

    const unavailable = isCarUnavailable(c.id, c.name);

    if (activeFilter === 'all') return true;
    if (activeFilter === 'cars') return true;
    if (activeFilter === 'used') return false;
    if (activeFilter === 'properties') return false;
    if (activeFilter === 'reserved') return unavailable;
    if (activeFilter === 'for_sale') return !unavailable;
    return true;
  });

  if (carSortOrder === 'cheapest') {
    filteredCars = [...filteredCars].sort((a, b) => a.price - b.price);
  } else if (carSortOrder === 'expensive') {
    filteredCars = [...filteredCars].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="space-y-10 pb-16" id="marketplace-root-container">
      {/* 1. SHOP HEADER & SEARCH/FILTER BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden" id="marketplace-header-card">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl shadow-md select-none">
                🏪
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">TRGOVINA</h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  Službena burza nekretnina i automobila Kalničke Banke
                </p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretraži po nazivu..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 transition-all outline-none"
              id="marketplace-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges & Car Sorting */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2" id="marketplace-filter-buttons">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filteri:
            </span>
            {[
              { id: 'all', label: 'Sve' },
              { id: 'cars', label: 'Automobili' },
              { id: 'properties', label: 'Nekretnine' },
              { id: 'used', label: 'Korištena Imovina' },
              { id: 'reserved', label: 'Nedostupno' },
              { id: 'for_sale', label: 'Dostupno' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                id={`filter-btn-${f.id}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Cars Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sortiraj automobile:
            </span>
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCarSortOrder(carSortOrder === 'cheapest' ? 'none' : 'cheapest')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  carSortOrder === 'cheapest' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                id="sort-cheapest-btn"
              >
                Najjeftinije
              </button>
              <button
                onClick={() => setCarSortOrder(carSortOrder === 'expensive' ? 'none' : 'expensive')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  carSortOrder === 'expensive' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                id="sort-expensive-btn"
              >
                Najskuplje
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KORIŠTENA IMOVINA (AT THE VERY TOP, ABOVE PREDEFINED BUYS) */}
      {(activeFilter === 'all' || activeFilter === 'used' || activeFilter === 'cars' || activeFilter === 'properties' || activeFilter === 'reserved' || activeFilter === 'for_sale') && (
        <section className="space-y-6" id="used-assets-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏷️</span>
                <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide">
                  Korištena Imovina
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ponude i oglasi koje su objavili korisnici Kalničke Banke
              </p>
            </div>

            {/* + Oglasi imovinu za prodaju Button */}
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer active:scale-98"
              id="open-create-listing-btn"
            >
              <Plus className="w-4 h-4" />
              <span>+ Oglasi imovinu za prodaju</span>
            </button>
          </div>

          {filteredUsedListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              <span className="block text-3xl mb-2">🏷️</span>
              <p className="font-bold text-slate-600 text-sm">Trenutno nema oglasa u korištenoj imovini.</p>
              <p className="text-xs text-slate-400 mt-1">Budi prvi koji će oglasiti automobil ili nekretninu klikom na gumb iznad!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="used-assets-grid">
              {filteredUsedListings.map((listing) => {
                const isOwner = listing.seller === currentUser;
                const isCar = listing.type === 'car';
                const isUnavailable = isListingUnavailable(listing);

                return (
                  <div
                    key={listing.id}
                    className={`rounded-3xl border transition-all flex flex-col justify-between p-6 group relative ${
                      isUnavailable
                        ? 'bg-slate-100 border-slate-300 opacity-60 grayscale'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                    id={`used-card-${listing.id}`}
                  >
                    <div className="space-y-4">
                      {/* Top Row: Icon, Category & Status Badge */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shadow-sm select-none">
                            {isCar ? '🏎️' : '🏡'}
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {isCar ? <Car className="w-3 h-3 text-blue-600" /> : <Home className="w-3 h-3 text-amber-600" />}
                              {isCar ? 'Automobil' : 'Nekretnina'}
                            </span>
                            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                              <User className="w-3 h-3 text-slate-400" /> Prodavatelj: <strong className="text-slate-700">{listing.sellerName}</strong>
                              {isOwner && <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold ml-0.5">(Vi)</span>}
                            </p>
                          </div>
                        </div>

                        {isUnavailable ? (
                          <span className="px-2.5 py-1 bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            Nedostupno
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            Dostupno
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                          {listing.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cijena</span>
                        <span className="text-xl font-black text-slate-900">
                          {formatMoney(listing.price)} <span className="text-xs text-slate-400">€</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {isUnavailable ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 bg-slate-300 text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          <span>🔒 Nedostupno</span>
                        </button>
                      ) : isOwner ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(listing)}
                            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Uredi
                          </button>
                          <button
                            onClick={() => onDeleteListing(listing.id)}
                            className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center"
                            title="Ukloni oglas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenInquiry(listing)}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer active:scale-98 uppercase tracking-wider flex items-center justify-center gap-2"
                          id={`inquiry-btn-${listing.id}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Pošalji upit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. PREDEFINIRANE NEKRETNINE */}
      {(activeFilter === 'all' || activeFilter === 'properties' || activeFilter === 'reserved' || activeFilter === 'for_sale') && (
        <section className="space-y-6" id="properties-section">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏡</span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide">
                NEKRETNINE
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Nekretnine se ne mogu direktno kupiti, već isključivo rezervirati bez naplate u trgovini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="properties-grid">
            {filteredProperties.map((property) => {
              const isUnavailable = isPropertyUnavailable(property.id, property.title);

              return (
                <div
                  key={property.id}
                  className={`rounded-3xl border transition-all flex flex-col justify-between p-6 group relative ${
                    isUnavailable
                      ? 'bg-slate-100 border-slate-300 opacity-60 grayscale'
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                  id={`prop-card-${property.id}`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm select-none bg-amber-50 border border-amber-100">
                        {property.icon}
                      </div>

                      {isUnavailable ? (
                        <span className="px-2.5 py-1 bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          Nedostupno
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          Dostupno
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">
                        {property.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Službena nekretnina Kalničke Banke
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cijena</span>
                      <span className="text-xl font-black text-slate-900">
                        {property.price === 0 ? (
                          <span className="text-emerald-600 font-black">Besplatno</span>
                        ) : (
                          <>
                            {formatMoney(property.price)} <span className="text-xs text-slate-400">€</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Reservation Action Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isUnavailable ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 bg-slate-300 text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <span>🔒 Nedostupno</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateReservation(property, false)}
                        className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer active:scale-98 uppercase tracking-wider flex items-center justify-center gap-2"
                        id={`reserve-btn-${property.id}`}
                      >
                        <span>📋 Rezerviraj</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. PREDEFINIRANI AUTOMOBILI */}
      {(activeFilter === 'all' || activeFilter === 'cars' || activeFilter === 'reserved' || activeFilter === 'for_sale') && (
        <section className="space-y-6" id="cars-section">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏎️</span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide">
                AUTOMOBILI
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automobili se mogu kupiti kroz trgovinu. Plaćanje i preuzimanje vozila se rješava u banci.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="cars-grid">
            {filteredCars.map((car) => {
              const isUnavailable = isCarUnavailable(car.id, car.name);

              return (
                <div
                  key={car.id}
                  className={`rounded-3xl border transition-all flex flex-col justify-between p-6 group relative ${
                    isUnavailable
                      ? 'bg-slate-100 border-slate-300 opacity-60 grayscale'
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                  id={`car-card-${car.id}`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm select-none bg-blue-50 border border-blue-100">
                        {car.icon}
                      </div>

                      {isUnavailable ? (
                        <span className="px-2.5 py-1 bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          Nedostupno
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          Dostupno za kupnju
                        </span>
                      )}
                    </div>

                    <div>
                      {car.badge && (
                        <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 text-blue-600 bg-blue-50">
                          {car.badge}
                        </span>
                      )}
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">
                        {car.name}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cijena</span>
                      <span className="text-xl font-black text-slate-900">
                        {formatMoney(car.price)} <span className="text-xs text-slate-400">€</span>
                      </span>
                    </div>
                  </div>

                  {/* Car Purchase Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isUnavailable ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 bg-slate-300 text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <span>🔒 Nedostupno</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateCarPurchase(car, false)}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer active:scale-98 uppercase tracking-wider flex items-center justify-center gap-2"
                        id={`buy-car-btn-${car.id}`}
                      >
                        <span>🛒 Kupi</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================== MODALS ================== */}

      {/* 1. OGLASI IMOVINU ZA PRODAJU MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
              id="create-listing-modal"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl select-none font-bold">
                    🏷️
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {editingListing ? 'Uredi svoj oglas' : 'Oglasi imovinu za prodaju'}
                    </h3>
                    <p className="text-xs text-slate-400">Pojavit će se u sekciji Korištena Imovina</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleListingSubmit} className="p-6 space-y-5">
                {/* 1. Odabir ili unos imovine */}
                {!editingListing ? (
                  <div>
                    {ownedSellItems.length > 0 && (
                      <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setCreationMode('owned');
                            if (ownedSellItems.length > 0) {
                              handleSelectOwnedItem(ownedSellItems[0]);
                            }
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            creationMode === 'owned' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Iz moje imovine ({ownedSellItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreationMode('custom');
                            setSelectedOwnedAssetKey('');
                            setListingTitle('');
                            setListingPrice('');
                            setListingDesc('');
                          }}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            creationMode === 'custom' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Unesi drugi naziv
                        </button>
                      </div>
                    )}

                    {creationMode === 'owned' && ownedSellItems.length > 0 ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          1. Odaberite imovinu koju želite oglasiti *
                        </label>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {ownedSellItems.map((item) => {
                            const isSelected = selectedOwnedAssetKey === item.key;
                            return (
                              <div
                                key={item.key}
                                onClick={() => handleSelectOwnedItem(item)}
                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-100 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl select-none flex-shrink-0">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-black text-slate-900 leading-tight">{item.title}</h4>
                                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {item.badge}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Banka: <strong className="text-slate-700">{formatMoney(item.originalPrice)} €</strong>
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  {isSelected ? (
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-sm">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Kategorija *
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setListingType('car')}
                              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                listingType === 'car' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100' : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              🏎️ Automobil
                            </button>
                            <button
                              type="button"
                              onClick={() => setListingType('property')}
                              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                listingType === 'property' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-100' : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              🏡 Nekretnina
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Naziv imovine *
                          </label>
                          <input
                            type="text"
                            value={listingTitle}
                            onChange={(e) => setListingTitle(e.target.value)}
                            placeholder="npr. BMW M4 Competition ili Luksuzna Vila"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-800 transition-all outline-none"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Imovina koja se prodaje
                    </label>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800">
                      {listingTitle} ({listingType === 'car' ? 'Automobil' : 'Nekretnina'})
                    </div>
                  </div>
                )}

                {/* 2. Odaberite cijenu */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    2. Odaberite vašu prodajnu cijenu (€) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-base font-black text-slate-800 transition-all outline-none"
                      required
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">€</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sami slobodno određujete cijenu po kojoj želite oglasiti ovu imovinu.
                  </p>
                </div>

                {/* 3. Opis imovine */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    3. Opis / Stanje imovine *
                  </label>
                  <textarea
                    rows={3}
                    value={listingDesc}
                    onChange={(e) => setListingDesc(e.target.value)}
                    placeholder="Opišite stanje, opremu ili detalje o imovini..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs font-medium text-slate-700 transition-all outline-none"
                    required
                  />
                </div>

                {listingFormError && (
                  <div className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-2xl border border-rose-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{listingFormError}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingListing ? 'Spremi izmjene' : `Objavi oglas (${formatMoney(Number(listingPrice) || 0)} €)`}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. POTVRDA REZERVACIJE NEKRETNINE */}
      <AnimatePresence>
        {pendingReservation && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              id="reserve-confirmation-modal"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-2xl select-none">
                  🏡
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    Želite li rezervirati ovu imovinu?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rezervacija ne naplaćuje novac s računa kroz trgovinu.
                  </p>
                </div>

                {/* Details Box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Naziv imovine:</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {'title' in pendingReservation.item ? pendingReservation.item.title : 'Imovina'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cijena:</span>
                    <span className="font-black text-amber-700 text-sm">
                      {pendingReservation.item.price === 0 ? 'Besplatno' : `${formatMoney(pendingReservation.item.price)} €`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Vaše stanje na računu:</span>
                    <span className={`font-black text-xs ${userBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatMoney(userBalance)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Stanje nakon obrade:</span>
                    <span className={`font-black text-xs ${userBalance - pendingReservation.item.price < 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {formatMoney(userBalance - pendingReservation.item.price)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Korisničko ime:</span>
                    <span className="font-bold text-slate-700">{userDisplayName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Datum rezervacije:</span>
                    <span className="font-mono text-slate-600 font-bold">{pendingReservation.date}</span>
                  </div>
                </div>

                {userBalance - pendingReservation.item.price < -10000 ? (
                  <div className="bg-rose-50 rounded-2xl p-3 text-xs text-rose-700 border border-rose-200 flex items-start gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Nemate dovoljno novaca!</strong> Maksimalan iznos koji možete biti u minusu je 10.000 €.
                    </span>
                  </div>
                ) : (
                  <div className="bg-blue-50/70 rounded-2xl p-3 text-[11px] text-blue-900 border border-blue-100 flex items-start gap-2 text-left">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Status rezervacije bit će: <strong>Rezervirano – čeka obradu u banci</strong>. Novac se sa vašeg računa oduzima tek poslije kada je kupnja imovine obrađena u banci.
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingReservation(null)}
                  className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                  Odustani
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReservation}
                  disabled={userBalance - pendingReservation.item.price < -10000}
                  className={`py-2.5 px-5 text-white text-xs font-bold rounded-xl shadow-md transition-all uppercase tracking-wider ${
                    userBalance - pendingReservation.item.price < -10000
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 cursor-pointer'
                  }`}
                  id="confirm-reservation-btn"
                >
                  Potvrdi rezervaciju
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. POTVRDA KUPNJE AUTOMOBILA */}
      <AnimatePresence>
        {pendingCarPurchase && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              id="buy-car-confirmation-modal"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-2xl select-none">
                  🏎️
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    Jeste li sigurni da želite kupiti ovaj automobil?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Novac se NE skida automatski. Plaćanje i preuzimanje se obavlja u Kalničkoj Banci.
                  </p>
                </div>

                {/* Details Box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Naziv automobila:</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {'name' in pendingCarPurchase.item ? pendingCarPurchase.item.name : pendingCarPurchase.item.title}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cijena:</span>
                    <span className="font-black text-blue-800 text-sm">
                      {formatMoney(pendingCarPurchase.item.price)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Vaše stanje na računu:</span>
                    <span className={`font-black text-xs ${userBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatMoney(userBalance)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Stanje nakon obrade:</span>
                    <span className={`font-black text-xs ${userBalance - pendingCarPurchase.item.price < 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {formatMoney(userBalance - pendingCarPurchase.item.price)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Korisničko ime:</span>
                    <span className="font-bold text-slate-700">{userDisplayName}</span>
                  </div>
                </div>

                {userBalance - pendingCarPurchase.item.price < -10000 ? (
                  <div className="bg-rose-50 rounded-2xl p-3 text-xs text-rose-700 border border-rose-200 flex items-start gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Nemate dovoljno novaca!</strong> Maksimalan iznos koji možete biti u minusu je 10.000 €.
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 rounded-2xl p-3 text-[11px] text-emerald-900 border border-emerald-100 flex items-start gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Status vozila bit će: <strong>Čeka preuzimanje u banci</strong>. Iznos ({formatMoney(pendingCarPurchase.item.price)} €) se oduzima s računa tek kada se vozilo preuzme u banci.
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingCarPurchase(null)}
                  className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                  Odustani
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCarPurchase}
                  disabled={userBalance - pendingCarPurchase.item.price < -10000}
                  className={`py-2.5 px-5 text-white text-xs font-bold rounded-xl shadow-md transition-all uppercase tracking-wider ${
                    userBalance - pendingCarPurchase.item.price < -10000
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                  }`}
                  id="confirm-buy-car-btn"
                >
                  Potvrdi kupnju
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. POŠALJI UPIT MODAL (SA OPCIJOM CJENKANJA ±10.000 €) */}
      <AnimatePresence>
        {inquiryListing && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
              id="send-inquiry-modal"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl select-none font-bold">
                    💬
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Pošalji upit za oglas
                    </h3>
                    <p className="text-xs text-slate-400">Prodavatelj: <strong>{inquiryListing.sellerName}</strong></p>
                  </div>
                </div>
                <button
                  onClick={() => setInquiryListing(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInquirySubmit} className="p-6 space-y-5">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Predmet oglasa:</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {inquiryListing.title} ({inquiryListing.type === 'car' ? 'Automobil 🏎️' : 'Nekretnina 🏡'})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Oglašena cijena:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatMoney(inquiryListing.price)} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Vaše stanje na računu:</span>
                    <span className={`font-black text-xs ${userBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatMoney(userBalance)} €
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Vaša ponuda / Cijena (€) *
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Cjenkanje: max ±10.000 €
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Cjenkanje je dopušteno samo do 10.000 € manje ili više ({formatMoney(Math.max(0, inquiryListing.price - 10000))} € – {formatMoney(inquiryListing.price + 10000)} €).
                  </p>

                  {/* Quick Negotiation Adjustment buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(0, inquiryListing.price - 10000);
                        setInquiryOfferPrice(val.toString());
                        setInquiryError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      -10.000 €
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(0, inquiryListing.price - 5000);
                        setInquiryOfferPrice(val.toString());
                        setInquiryError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      -5.000 €
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInquiryOfferPrice(inquiryListing.price.toString());
                        setInquiryError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      Ista cijena
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = inquiryListing.price + 5000;
                        setInquiryOfferPrice(val.toString());
                        setInquiryError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      +5.000 €
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = inquiryListing.price + 10000;
                        setInquiryOfferPrice(val.toString());
                        setInquiryError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                    >
                      +10.000 €
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      value={inquiryOfferPrice}
                      onChange={(e) => {
                        setInquiryOfferPrice(e.target.value);
                        setInquiryError(null);
                      }}
                      min={Math.max(0, inquiryListing.price - 10000)}
                      max={inquiryListing.price + 10000}
                      step="500"
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-base font-black text-slate-800 transition-all outline-none"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">€</span>
                  </div>
                </div>

                {inquiryError && (
                  <div className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-2xl border border-rose-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInquiryListing(null)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Pošalji upit ({formatMoney(Number(inquiryOfferPrice) || 0)} €)</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. BALANCE ERROR ALERT MODAL */}
      <AnimatePresence>
        {balanceErrorAlert && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl select-none">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Nemate dovoljno novaca!
                </h3>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-medium">
                  {balanceErrorAlert}
                </p>
                <button
                  type="button"
                  onClick={() => setBalanceErrorAlert(null)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
                >
                  U redu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SUCCESS FEEDBACK MODAL WITH "IDI U KALNIČKU BANKU" BUTTON */}
      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              id="success-action-modal"
            >
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm text-3xl select-none">
                  🎉
                </div>

                {successModal.type === 'reservation' ? (
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Rezervacija uspješna!
                    </h3>
                    <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl">
                      Svoju rezervaciju možete riješiti u Kalničkoj Banci.
                    </p>
                    <p className="text-xs text-slate-500">
                      Rezervirana imovina: <strong>{successModal.itemName}</strong>
                    </p>
                  </div>
                ) : successModal.type === 'car_purchase' ? (
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Kupnja uspješna!
                    </h3>
                    <p className="text-sm font-semibold text-blue-700 bg-blue-50 py-2 px-3 rounded-xl">
                      Možete pokupiti svoje vozilo u Kalničkoj Banci.
                    </p>
                    <p className="text-xs text-slate-500">
                      Vozilo: <strong>{successModal.itemName}</strong> (Status: <em>Čeka preuzimanje u banci</em>)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Upit uspješno poslan!
                    </h3>
                    <p className="text-sm font-semibold text-blue-700 bg-blue-50 py-2 px-3 rounded-xl">
                      Vaš upit s ponudom od {formatMoney(successModal.price)} € je poslan prodavatelju.
                    </p>
                    <p className="text-xs text-slate-500">
                      Predmet: <strong>{successModal.itemName}</strong>. Čim se prodavatelj prijavi na račun, dobit će obavijest s vašom ponudom!
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-6 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuccessModal(null)}
                  className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-center"
                >
                  Ostani u Trgovini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessModal(null);
                    onNavigateToBank();
                  }}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 text-center"
                  id="go-to-kalnicka-banka-btn"
                >
                  <span>Idi u Kalničku Banku</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
