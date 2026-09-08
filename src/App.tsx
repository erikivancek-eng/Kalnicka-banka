import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  User,
  KeyRound,
  AlertCircle,
  LogIn,
  LogOut,
  Info,
  Users,
  CreditCard,
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  Send,
  Cog,
  Save,
  Download,
  Upload,
  RotateCcw,
  FolderArchive,
  FileDown,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Store,
  Briefcase,
  ArrowRight,
  MessageSquare,
  X
} from 'lucide-react';
import JSZip from 'jszip';
import {
  UserListing,
  PropertyReservation,
  VehicleOrder,
  PredefinedProperty,
  PredefinedCar,
  ListingInquiry
} from './types';
import { ShopView } from './components/ShopView';
import { UserAssetsView } from './components/UserAssetsView';
import { AdminMarketplaceManagement } from './components/AdminMarketplaceManagement';

// 1. TYPES & ENUMS
enum UserRole {
  Admin = 'admin',
  Player = 'player'
}

enum TransactionType {
  Add = 'add',
  Subtract = 'subtract'
}

interface Transaction {
  id: string;
  timestamp: string;
  player: 'erik' | 'nera' | 'vito';
  amount: number;
  type: TransactionType;
  description: string;
  isP2P?: boolean;
}

interface Balances {
  erik: number;
  nera: number;
  vito: number;
}

const LOGINS: Record<string, string> = {
  admin: 'kalnicka123',
  erik: '1909',
  nera: '1167',
  vito: '2507'
};

const DISPLAY_NAMES: Record<string, string> = {
  admin: 'Bankar (Admin)',
  erik: 'Erik',
  nera: 'Nera',
  vito: 'Vito'
};

const AVATARS: Record<string, string> = {
  erik: '👨‍💻',
  nera: '👩‍🎨',
  vito: '🚀'
};

const CARD_CLASSES: Record<string, string> = {
  erik: 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 border-indigo-950',
  nera: 'bg-gradient-to-br from-violet-900 via-violet-800 to-purple-900 border-violet-950',
  vito: 'bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-900 border-sky-950'
};

export default function App() {
  // 2. STATE MANAGEMENT
  const [balances, setBalances] = useState<Balances>({
    erik: 50000,
    nera: 50000,
    vito: 50000
  });
  const [history, setHistory] = useState<Transaction[]>([]);

  // Navigation tab for logged in user: 'bank' | 'shop' | 'my_assets'
  const [activeTab, setActiveTab] = useState<'bank' | 'shop' | 'my_assets'>('bank');

  // Marketplace & Store States
  const [listings, setListings] = useState<UserListing[]>([]);
  const [reservations, setReservations] = useState<PropertyReservation[]>([]);
  const [vehicleOrders, setVehicleOrders] = useState<VehicleOrder[]>([]);
  const [inquiries, setInquiries] = useState<ListingInquiry[]>([]);

  // Inquiry Notification Modal State (Centered on screen upon login)
  const [activeInquiryNotification, setActiveInquiryNotification] = useState<ListingInquiry | null>(null);
  const [negotiationOfferPrice, setNegotiationOfferPrice] = useState<string>('');
  const [negotiationError, setNegotiationError] = useState<string | null>(null);
  const [showNegotiationInput, setShowNegotiationInput] = useState<boolean>(false);
  
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  
  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Transaction Form States
  const [txPlayer, setTxPlayer] = useState<'erik' | 'nera' | 'vito' | null>(null);
  const [txType, setTxType] = useState<TransactionType | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txFormError, setTxFormError] = useState<string | null>(null);

  // P2P Transfer States
  const [p2pRecipient, setP2pRecipient] = useState<'erik' | 'nera' | 'vito' | null>(null);
  const [p2pAmount, setP2pAmount] = useState('');
  const [p2pDesc, setP2pDesc] = useState('');
  const [p2pFormError, setP2pFormError] = useState<string | null>(null);
  
  // UI Filtering & Modals
  const [historyFilter, setHistoryFilter] = useState<'all' | 'erik' | 'nera' | 'vito'>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connected, setConnected] = useState(true);

  // 3. LIFECYCLE & PERSISTENCE
  useEffect(() => {
    // 1. Load active session from sessionStorage
    const savedSession = sessionStorage.getItem('kalnicka_session_user');
    if (savedSession && LOGINS[savedSession]) {
      setCurrentUser(savedSession);
      setCurrentRole(savedSession === 'admin' ? UserRole.Admin : UserRole.Player);
    }

    // 2. Initial fetch from server
    const fetchInitialState = async () => {
      try {
        const response = await fetch('/api/bank-state');
        if (response.ok) {
          const data = await response.json();
          if (data.balances && data.history) {
            setBalances(data.balances);
            setHistory(data.history);
            if (Array.isArray(data.listings)) setListings(data.listings);
            if (Array.isArray(data.reservations)) setReservations(data.reservations);
            if (Array.isArray(data.vehicleOrders)) setVehicleOrders(data.vehicleOrders);
            if (Array.isArray(data.inquiries)) setInquiries(data.inquiries);
            setConnected(true);
          }
        }
      } catch (e) {
        console.error('Inicijalno dohvaćanje stanja nije uspjelo:', e);
        setConnected(false);
        // Fallback to localStorage if server is unreachable
        const savedBalances = localStorage.getItem('kalnicka_bank_balances');
        const savedHistory = localStorage.getItem('kalnicka_bank_history');
        const savedListings = localStorage.getItem('kalnicka_bank_listings');
        const savedReservations = localStorage.getItem('kalnicka_bank_reservations');
        const savedVehicleOrders = localStorage.getItem('kalnicka_bank_vehicleOrders');
        const savedInquiries = localStorage.getItem('kalnicka_bank_inquiries');

        if (savedBalances) {
          try {
            setBalances(JSON.parse(savedBalances));
          } catch (err) {
            console.error(err);
          }
        }
        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory));
          } catch (err) {
            console.error(err);
          }
        }
        if (savedListings) {
          try {
            setListings(JSON.parse(savedListings));
          } catch (err) {
            console.error(err);
          }
        }
        if (savedReservations) {
          try {
            setReservations(JSON.parse(savedReservations));
          } catch (err) {
            console.error(err);
          }
        }
        if (savedVehicleOrders) {
          try {
            setVehicleOrders(JSON.parse(savedVehicleOrders));
          } catch (err) {
            console.error(err);
          }
        }
        if (savedInquiries) {
          try {
            setInquiries(JSON.parse(savedInquiries));
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    fetchInitialState();

    // 3. Periodic polling every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/bank-state');
        if (response.ok) {
          const data = await response.json();
          if (data.balances && data.history) {
            setBalances(data.balances);
            setHistory(data.history);
            if (Array.isArray(data.listings)) setListings(data.listings);
            if (Array.isArray(data.reservations)) setReservations(data.reservations);
            if (Array.isArray(data.vehicleOrders)) setVehicleOrders(data.vehicleOrders);
            if (Array.isArray(data.inquiries)) setInquiries(data.inquiries);
            setConnected(true);
          }
        }
      } catch (e) {
        console.error('Sinkronizacija nije uspjela:', e);
        setConnected(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Check for pending inquiry notification whenever user logs in or inquiries update
  useEffect(() => {
    if (!currentUser || currentUser === 'admin') {
      setActiveInquiryNotification(null);
      return;
    }

    // 1. Pending inquiry from a buyer on seller's listing that hasn't been viewed yet
    const pendingForSeller = inquiries.find(
      (inq) => inq.seller === currentUser && inq.status === 'pending' && !inq.viewedBySeller
    );

    // 2. Counter-offer from seller that buyer hasn't viewed yet
    const counteredForBuyer = inquiries.find(
      (inq) => inq.buyer === currentUser && inq.status === 'countered' && !inq.viewedByBuyer
    );

    const targetInquiry = pendingForSeller || counteredForBuyer;

    if (targetInquiry && (!activeInquiryNotification || activeInquiryNotification.id !== targetInquiry.id)) {
      setActiveInquiryNotification(targetInquiry);
      setNegotiationOfferPrice(targetInquiry.currentOffer.toString());
      setNegotiationError(null);
      setShowNegotiationInput(false);
    }
  }, [currentUser, inquiries]);

  // Helper to trigger toast notifications
  const triggerToast = (message: string, isSuccess = true) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, isSuccess });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Auto-save data whenever state changes
  const saveState = async (
    updatedBalances: Balances = balances,
    updatedHistory: Transaction[] = history,
    updatedListings: UserListing[] = listings,
    updatedReservations: PropertyReservation[] = reservations,
    updatedVehicleOrders: VehicleOrder[] = vehicleOrders,
    updatedInquiries: ListingInquiry[] = inquiries
  ) => {
    localStorage.setItem('kalnicka_bank_balances', JSON.stringify(updatedBalances));
    localStorage.setItem('kalnicka_bank_history', JSON.stringify(updatedHistory));
    localStorage.setItem('kalnicka_bank_listings', JSON.stringify(updatedListings));
    localStorage.setItem('kalnicka_bank_reservations', JSON.stringify(updatedReservations));
    localStorage.setItem('kalnicka_bank_vehicleOrders', JSON.stringify(updatedVehicleOrders));
    localStorage.setItem('kalnicka_bank_inquiries', JSON.stringify(updatedInquiries));
    try {
      await fetch('/api/bank-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balances: updatedBalances,
          history: updatedHistory,
          listings: updatedListings,
          reservations: updatedReservations,
          vehicleOrders: updatedVehicleOrders,
          inquiries: updatedInquiries
        })
      });
      setConnected(true);
    } catch (e) {
      console.error('Greška prilikom sinkronizacije s poslužiteljem:', e);
      setConnected(false);
    }
  };

  // 4. MARKETPLACE ACTION HANDLERS

  // Add User Listing in Korištena Imovina
  const handleAddListing = (listingData: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => {
    const newListing: UserListing = {
      ...listingData,
      id: `listing_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'active',
      createdAt: new Date().toLocaleDateString('hr-HR')
    };
    const updatedListings = [newListing, ...listings];
    setListings(updatedListings);
    saveState(balances, history, updatedListings, reservations, vehicleOrders);
    triggerToast('Vaš oglas je uspješno objavljen u korištenoj imovini!', true);
  };

  // Edit User Listing
  const handleEditListing = (id: string, updated: Partial<UserListing>) => {
    const updatedListings = listings.map((l) => (l.id === id ? { ...l, ...updated } : l));
    setListings(updatedListings);
    saveState(balances, history, updatedListings, reservations, vehicleOrders);
    triggerToast('Oglas je uspješno ažuriran!', true);
  };

  // Delete User Listing
  const handleDeleteListing = (id: string) => {
    const updatedListings = listings.filter((l) => l.id !== id);
    setListings(updatedListings);
    saveState(balances, history, updatedListings, reservations, vehicleOrders);
    triggerToast('Oglas je uklonjen.', true);
  };

  // Reserve Property (Does NOT deduct money)
  const handleReserveProperty = (property: PredefinedProperty | UserListing) => {
    if (!currentUser) return;
    const price = property.price;

    // Strict balance check: max negative balance is -10,000 €
    if (['erik', 'nera', 'vito'].includes(currentUser)) {
      const currentBal = balances[currentUser as 'erik' | 'nera' | 'vito'];
      if (currentBal - price < -10000) {
        triggerToast(`Nemate dovoljno novaca! Maksimalan iznos koji možete biti u minusu je 10.000 €. Vaše stanje je ${formatMoney(currentBal)} €, a nakon ove kupnje bilo bi ${formatMoney(currentBal - price)} €.`, false);
        return;
      }
    }

    const isCustom = 'seller' in property;
    const propertyTitle = 'title' in property ? property.title : 'Nekretnina';
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestamp = Date.now();

    const newReservation: PropertyReservation = {
      id: `res_${timestamp}_${Math.floor(Math.random() * 1000)}`,
      propertyId: property.id,
      propertyTitle,
      price,
      username: currentUser as 'erik' | 'nera' | 'vito',
      userDisplayName: DISPLAY_NAMES[currentUser] || currentUser,
      date: formattedDate,
      status: 'Rezervirano – čeka obradu u banci',
      isCustomListing: isCustom,
      listingId: isCustom ? property.id : undefined,
      purchasedAt: timestamp
    };

    const updatedReservations = [newReservation, ...reservations];
    let updatedListings = listings;
    if (isCustom) {
      updatedListings = listings.map((l) =>
        l.id === property.id ? { ...l, lastPurchasedAt: timestamp, reservedBy: currentUser } : l
      );
    }

    setReservations(updatedReservations);
    setListings(updatedListings);
    saveState(balances, history, updatedListings, updatedReservations, vehicleOrders);
    triggerToast(`Uspješno ste rezervirali: ${propertyTitle}! Svoju rezervaciju možete riješiti u Kalničkoj Banci.`, true);
  };

  // Buy Car (Does NOT deduct money)
  const handleBuyCar = (car: PredefinedCar | UserListing) => {
    if (!currentUser) return;
    const price = car.price;

    // Strict balance check: max negative balance is -10,000 €
    if (['erik', 'nera', 'vito'].includes(currentUser)) {
      const currentBal = balances[currentUser as 'erik' | 'nera' | 'vito'];
      if (currentBal - price < -10000) {
        triggerToast(`Nemate dovoljno novaca! Maksimalan iznos koji možete biti u minusu je 10.000 €. Vaše stanje je ${formatMoney(currentBal)} €, a nakon ove kupnje bilo bi ${formatMoney(currentBal - price)} €.`, false);
        return;
      }
    }

    const isCustom = 'seller' in car;
    const carName = 'name' in car ? car.name : car.title;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestamp = Date.now();

    const newOrder: VehicleOrder = {
      id: `car_order_${timestamp}_${Math.floor(Math.random() * 1000)}`,
      carId: car.id,
      carName,
      price,
      username: currentUser as 'erik' | 'nera' | 'vito',
      userDisplayName: DISPLAY_NAMES[currentUser] || currentUser,
      date: formattedDate,
      status: 'Čeka preuzimanje u banci',
      isCustomListing: isCustom,
      listingId: isCustom ? car.id : undefined,
      purchasedAt: timestamp
    };

    const updatedVehicleOrders = [newOrder, ...vehicleOrders];
    let updatedListings = listings;
    if (isCustom) {
      updatedListings = listings.map((l) =>
        l.id === car.id ? { ...l, lastPurchasedAt: timestamp, reservedBy: currentUser } : l
      );
    }

    setVehicleOrders(updatedVehicleOrders);
    setListings(updatedListings);
    saveState(balances, history, updatedListings, reservations, updatedVehicleOrders);
    triggerToast(`Kupnja uspješna! Možete pokupiti svoje vozilo ${carName} u Kalničkoj Banci.`, true);
  };

  // Update vehicle status with money deduction upon processing ('Preuzeto')
  const handleUpdateVehicleStatus = (id: string, newStatus: 'Čeka preuzimanje u banci' | 'Preuzeto' | 'Otkazano') => {
    const targetOrder = vehicleOrders.find((v) => v.id === id);
    if (!targetOrder) return;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year}. ${hours}:${minutes}`;

    let updatedBalances = { ...balances };
    let updatedHistory = [...history];
    let updatedListings = [...listings];

    let isPaid = targetOrder.isPaid || false;
    let paidAt = targetOrder.paidAt;

    // 1. Transitioning to 'Preuzeto' (Obrađena kupnja -> Oduzmi novac sa računa kupca)
    if (newStatus === 'Preuzeto' && !targetOrder.isPaid) {
      const buyer = targetOrder.username;
      const price = targetOrder.price;

      // Deduct from buyer account
      updatedBalances[buyer] = (updatedBalances[buyer] || 0) - price;

      const buyerTx: Transaction = {
        id: `tx_${Date.now()}_car_buy_${Math.floor(Math.random() * 1000)}`,
        timestamp: formattedTime,
        player: buyer,
        amount: price,
        type: TransactionType.Subtract,
        description: `Kupnja vozila: ${targetOrder.carName} (Obrađeno u banci)`
      };
      updatedHistory = [buyerTx, ...updatedHistory];

      // If custom user listing, credit seller and mark listing sold
      if (targetOrder.isCustomListing && targetOrder.listingId) {
        const listing = listings.find((l) => l.id === targetOrder.listingId);
        if (listing && ['erik', 'nera', 'vito'].includes(listing.seller)) {
          const seller = listing.seller as 'erik' | 'nera' | 'vito';
          updatedBalances[seller] = (updatedBalances[seller] || 0) + price;

          const sellerTx: Transaction = {
            id: `tx_${Date.now()}_car_sell_${Math.floor(Math.random() * 1000)}`,
            timestamp: formattedTime,
            player: seller,
            amount: price,
            type: TransactionType.Add,
            description: `Prodaja vozila: ${targetOrder.carName} (Kupac: ${targetOrder.userDisplayName})`
          };
          updatedHistory = [sellerTx, ...updatedHistory];
        }

        updatedListings = updatedListings.map((l) =>
          l.id === targetOrder.listingId ? { ...l, status: 'sold' as const } : l
        );
      }

      isPaid = true;
      paidAt = formattedTime;
      triggerToast(`Kupnja vozila ${targetOrder.carName} je obrađena! S računa ${targetOrder.userDisplayName} je oduzeto ${formatMoney(price)} €.`, true);
    }
    // 2. Reverting from 'Preuzeto' to other status (if already paid, refund)
    else if (newStatus !== 'Preuzeto' && targetOrder.isPaid) {
      const buyer = targetOrder.username;
      const price = targetOrder.price;

      // Refund buyer
      updatedBalances[buyer] = (updatedBalances[buyer] || 0) + price;

      const refundTx: Transaction = {
        id: `tx_${Date.now()}_car_refund_${Math.floor(Math.random() * 1000)}`,
        timestamp: formattedTime,
        player: buyer,
        amount: price,
        type: TransactionType.Add,
        description: `Povrat za vozilo: ${targetOrder.carName} (${newStatus})`
      };
      updatedHistory = [refundTx, ...updatedHistory];

      // If custom user listing, debit seller
      if (targetOrder.isCustomListing && targetOrder.listingId) {
        const listing = listings.find((l) => l.id === targetOrder.listingId);
        if (listing && ['erik', 'nera', 'vito'].includes(listing.seller)) {
          const seller = listing.seller as 'erik' | 'nera' | 'vito';
          updatedBalances[seller] = (updatedBalances[seller] || 0) - price;

          const sellerDebitTx: Transaction = {
            id: `tx_${Date.now()}_car_seller_revert_${Math.floor(Math.random() * 1000)}`,
            timestamp: formattedTime,
            player: seller,
            amount: price,
            type: TransactionType.Subtract,
            description: `Poništena prodaja vozila: ${targetOrder.carName}`
          };
          updatedHistory = [sellerDebitTx, ...updatedHistory];
        }

        updatedListings = updatedListings.map((l) =>
          l.id === targetOrder.listingId
            ? { ...l, status: newStatus === 'Otkazano' ? ('active' as const) : ('reserved' as const) }
            : l
        );
      }

      isPaid = false;
      paidAt = undefined;
      triggerToast(`Status ažuriran na ${newStatus}. Sredstva (${formatMoney(price)} €) su vraćena na račun korisnika ${targetOrder.userDisplayName}.`, true);
    } else {
      triggerToast(`Status vozila ažuriran na: ${newStatus}`, true);
    }

    const updatedOrders = vehicleOrders.map((v) =>
      v.id === id ? { ...v, status: newStatus, isPaid, paidAt } : v
    );

    setBalances(updatedBalances);
    setHistory(updatedHistory);
    setListings(updatedListings);
    setVehicleOrders(updatedOrders);
    saveState(updatedBalances, updatedHistory, updatedListings, reservations, updatedOrders);
  };

  // Update reservation status with money deduction upon processing ('Obrađeno')
  const handleUpdateReservationStatus = (id: string, newStatus: 'Rezervirano – čeka obradu u banci' | 'Obrađeno' | 'Otkazano') => {
    const targetRes = reservations.find((r) => r.id === id);
    if (!targetRes) return;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year}. ${hours}:${minutes}`;

    let updatedBalances = { ...balances };
    let updatedHistory = [...history];
    let updatedListings = [...listings];

    let isPaid = targetRes.isPaid || false;
    let paidAt = targetRes.paidAt;

    // 1. Transitioning to 'Obrađeno' (Obrađena kupnja nekretnine -> Oduzmi novac sa računa)
    if (newStatus === 'Obrađeno' && !targetRes.isPaid && targetRes.price > 0) {
      const buyer = targetRes.username;
      const price = targetRes.price;

      // Deduct from buyer
      updatedBalances[buyer] = (updatedBalances[buyer] || 0) - price;

      const buyerTx: Transaction = {
        id: `tx_${Date.now()}_prop_buy_${Math.floor(Math.random() * 1000)}`,
        timestamp: formattedTime,
        player: buyer,
        amount: price,
        type: TransactionType.Subtract,
        description: `Kupnja nekretnine: ${targetRes.propertyTitle} (Obrađeno u banci)`
      };
      updatedHistory = [buyerTx, ...updatedHistory];

      // If custom user listing, credit seller and mark listing sold
      if (targetRes.isCustomListing && targetRes.listingId) {
        const listing = listings.find((l) => l.id === targetRes.listingId);
        if (listing && ['erik', 'nera', 'vito'].includes(listing.seller)) {
          const seller = listing.seller as 'erik' | 'nera' | 'vito';
          updatedBalances[seller] = (updatedBalances[seller] || 0) + price;

          const sellerTx: Transaction = {
            id: `tx_${Date.now()}_prop_sell_${Math.floor(Math.random() * 1000)}`,
            timestamp: formattedTime,
            player: seller,
            amount: price,
            type: TransactionType.Add,
            description: `Prodaja nekretnine: ${targetRes.propertyTitle} (Kupac: ${targetRes.userDisplayName})`
          };
          updatedHistory = [sellerTx, ...updatedHistory];
        }

        updatedListings = updatedListings.map((l) =>
          l.id === targetRes.listingId ? { ...l, status: 'sold' as const } : l
        );
      }

      isPaid = true;
      paidAt = formattedTime;
      triggerToast(`Kupnja nekretnine ${targetRes.propertyTitle} je obrađena! S računa korisnika ${targetRes.userDisplayName} je oduzeto ${formatMoney(price)} €.`, true);
    }
    // 2. Reverting from 'Obrađeno' to other status (if already paid, refund)
    else if (newStatus !== 'Obrađeno' && targetRes.isPaid && targetRes.price > 0) {
      const buyer = targetRes.username;
      const price = targetRes.price;

      // Refund buyer
      updatedBalances[buyer] = (updatedBalances[buyer] || 0) + price;

      const refundTx: Transaction = {
        id: `tx_${Date.now()}_prop_refund_${Math.floor(Math.random() * 1000)}`,
        timestamp: formattedTime,
        player: buyer,
        amount: price,
        type: TransactionType.Add,
        description: `Povrat za nekretninu: ${targetRes.propertyTitle} (${newStatus})`
      };
      updatedHistory = [refundTx, ...updatedHistory];

      // If custom user listing, debit seller
      if (targetRes.isCustomListing && targetRes.listingId) {
        const listing = listings.find((l) => l.id === targetRes.listingId);
        if (listing && ['erik', 'nera', 'vito'].includes(listing.seller)) {
          const seller = listing.seller as 'erik' | 'nera' | 'vito';
          updatedBalances[seller] = (updatedBalances[seller] || 0) - price;

          const sellerDebitTx: Transaction = {
            id: `tx_${Date.now()}_prop_seller_revert_${Math.floor(Math.random() * 1000)}`,
            timestamp: formattedTime,
            player: seller,
            amount: price,
            type: TransactionType.Subtract,
            description: `Poništena prodaja nekretnine: ${targetRes.propertyTitle}`
          };
          updatedHistory = [sellerDebitTx, ...updatedHistory];
        }

        updatedListings = updatedListings.map((l) =>
          l.id === targetRes.listingId
            ? { ...l, status: newStatus === 'Otkazano' ? ('active' as const) : ('reserved' as const) }
            : l
        );
      }

      isPaid = false;
      paidAt = undefined;
      triggerToast(`Status ažuriran na ${newStatus}. Sredstva (${formatMoney(price)} €) su vraćena korisniku ${targetRes.userDisplayName}.`, true);
    } else {
      triggerToast(`Status rezervacije ažuriran na: ${newStatus}`, true);
    }

    const updatedReservations = reservations.map((r) =>
      r.id === id ? { ...r, status: newStatus, isPaid, paidAt } : r
    );

    setBalances(updatedBalances);
    setHistory(updatedHistory);
    setListings(updatedListings);
    setReservations(updatedReservations);
    saveState(updatedBalances, updatedHistory, updatedListings, updatedReservations, vehicleOrders);
  };

  // 4. ACTION HANDLERS

  // Send inquiry from buyer to seller
  const handleSendInquiry = (inquiryData: Omit<ListingInquiry, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'viewedBySeller' | 'viewedByBuyer'>) => {
    const buyerBalance = balances[inquiryData.buyer];
    if (buyerBalance - inquiryData.currentOffer < -10000) {
      triggerToast(`Nemate dovoljno novaca! Maksimalan iznos koji možete biti u minusu je 10.000 €. Vaše stanje je ${formatMoney(buyerBalance)} €, a s ovom ponudom od ${formatMoney(inquiryData.currentOffer)} € stanje bi bilo ${formatMoney(buyerBalance - inquiryData.currentOffer)} €.`, false);
      return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year}. ${hours}:${minutes}`;

    const newInquiry: ListingInquiry = {
      ...inquiryData,
      id: `inq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: formattedTime,
      updatedAt: formattedTime,
      viewedBySeller: false,
      viewedByBuyer: true,
      history: [
        {
          sender: 'buyer',
          senderName: inquiryData.buyerName,
          price: inquiryData.currentOffer,
          timestamp: formattedTime,
          note: `Početna ponuda: ${formatMoney(inquiryData.currentOffer)} €`
        }
      ]
    };

    const updatedInquiries = [newInquiry, ...inquiries];
    setInquiries(updatedInquiries);
    saveState(balances, history, listings, reservations, vehicleOrders, updatedInquiries);
    triggerToast(`Upit poslan! Čim se ${inquiryData.sellerName} prijavi u Kalničku Banku, na sredini ekrana dobit će obavijest s vašom ponudom!`, true);
  };

  // Accept Inquiry (Seller accepts buyer offer, or Buyer accepts seller counter-offer)
  const handleAcceptInquiry = (inquiry: ListingInquiry) => {
    const buyerBalance = balances[inquiry.buyer];
    if (buyerBalance - inquiry.currentOffer < -10000) {
      triggerToast(`Kupac ${inquiry.buyerName} nema dovoljno novaca! Maksimalan iznos koji korisnik može biti u minusu je 10.000 €. Kupac ima ${formatMoney(buyerBalance)} €, a želi kupiti za ${formatMoney(inquiry.currentOffer)} € (stanje bi bilo ${formatMoney(buyerBalance - inquiry.currentOffer)} €).`, false);
      return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year}. ${hours}:${minutes}`;
    const timestamp = Date.now();

    const updatedInquiries = inquiries.map((inq) =>
      inq.id === inquiry.id
        ? {
            ...inq,
            status: 'accepted' as const,
            viewedBySeller: true,
            viewedByBuyer: true,
            updatedAt: formattedTime,
            history: [
              ...inq.history,
              {
                sender: (currentUser === inquiry.seller ? 'seller' : 'buyer') as 'seller' | 'buyer',
                senderName: DISPLAY_NAMES[currentUser || ''] || currentUser || '',
                price: inquiry.currentOffer,
                timestamp: formattedTime,
                note: `Ponuda od ${formatMoney(inquiry.currentOffer)} € je prihvaćena!`
              }
            ]
          }
        : inq
    );

    const updatedListings = listings.map((l) =>
      l.id === inquiry.listingId
        ? { ...l, status: 'sold' as const, reservedBy: inquiry.buyer, lastPurchasedAt: timestamp }
        : l
    );

    let updatedReservations = reservations;
    let updatedVehicleOrders = vehicleOrders;

    if (inquiry.listingType === 'car') {
      const newOrder: VehicleOrder = {
        id: `order_${timestamp}_custom_${Math.floor(Math.random() * 1000)}`,
        carId: inquiry.listingId,
        carName: inquiry.listingTitle,
        price: inquiry.currentOffer,
        username: inquiry.buyer,
        userDisplayName: inquiry.buyerName,
        date: formattedTime,
        status: 'Čeka preuzimanje u banci',
        isCustomListing: true,
        listingId: inquiry.listingId,
        purchasedAt: timestamp
      };
      updatedVehicleOrders = [newOrder, ...vehicleOrders];
    } else {
      const newRes: PropertyReservation = {
        id: `res_${timestamp}_custom_${Math.floor(Math.random() * 1000)}`,
        propertyId: inquiry.listingId,
        propertyTitle: inquiry.listingTitle,
        price: inquiry.currentOffer,
        username: inquiry.buyer,
        userDisplayName: inquiry.buyerName,
        date: formattedTime,
        status: 'Rezervirano – čeka obradu u banci',
        isCustomListing: true,
        listingId: inquiry.listingId,
        purchasedAt: timestamp
      };
      updatedReservations = [newRes, ...reservations];
    }

    setInquiries(updatedInquiries);
    setListings(updatedListings);
    setReservations(updatedReservations);
    setVehicleOrders(updatedVehicleOrders);

    saveState(balances, history, updatedListings, updatedReservations, updatedVehicleOrders, updatedInquiries);
    setActiveInquiryNotification(null);
    setShowNegotiationInput(false);
    triggerToast(`Uspješno prihvaćena ponuda za ${inquiry.listingTitle}! Stavka je poslana u Kalničku Banku na obradu.`, true);
  };

  // Counter Inquiry (Negotiate ±10,000 € from original price)
  const handleCounterInquiry = (inquiry: ListingInquiry, counterPrice: number) => {
    const minAllowed = Math.max(0, inquiry.originalPrice - 10000);
    const maxAllowed = inquiry.originalPrice + 10000;

    if (counterPrice < minAllowed || counterPrice > maxAllowed) {
      setNegotiationError(`Cjenkanje je dopušteno samo do 10.000 € manje ili više od originalne cijene (${formatMoney(minAllowed)} € – ${formatMoney(maxAllowed)} €).`);
      return;
    }

    const buyerBalance = balances[inquiry.buyer];
    if (buyerBalance - counterPrice < -10000) {
      setNegotiationError(`Kupac ${inquiry.buyerName} ima ${formatMoney(buyerBalance)} € i s ovom cijenom bio bi u minusu ${formatMoney(buyerBalance - counterPrice)} €, što premašuje maksimalni dopušteni minus od 10.000 €!`);
      return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year}. ${hours}:${minutes}`;

    const isSellerActing = currentUser === inquiry.seller;

    const updatedInquiries = inquiries.map((inq) =>
      inq.id === inquiry.id
        ? {
            ...inq,
            currentOffer: counterPrice,
            status: 'countered' as const,
            viewedBySeller: isSellerActing ? true : false,
            viewedByBuyer: isSellerActing ? false : true,
            updatedAt: formattedTime,
            history: [
              ...inq.history,
              {
                sender: (isSellerActing ? 'seller' : 'buyer') as 'seller' | 'buyer',
                senderName: DISPLAY_NAMES[currentUser || ''] || currentUser || '',
                price: counterPrice,
                timestamp: formattedTime,
                note: `Cjenkanje (protuponuda): ${formatMoney(counterPrice)} €`
              }
            ]
          }
        : inq
    );

    setInquiries(updatedInquiries);
    saveState(balances, history, listings, reservations, vehicleOrders, updatedInquiries);
    setActiveInquiryNotification(null);
    setShowNegotiationInput(false);
    triggerToast(`Protuponuda od ${formatMoney(counterPrice)} € je poslana!`, true);
  };

  // Reject Inquiry
  const handleRejectInquiry = (inquiry: ListingInquiry) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year}. ${hours}:${minutes}`;

    const updatedInquiries = inquiries.map((inq) =>
      inq.id === inquiry.id
        ? {
            ...inq,
            status: 'rejected' as const,
            viewedBySeller: true,
            viewedByBuyer: true,
            updatedAt: formattedTime,
            history: [
              ...inq.history,
              {
                sender: (currentUser === inquiry.seller ? 'seller' : 'buyer') as 'seller' | 'buyer',
                senderName: DISPLAY_NAMES[currentUser || ''] || currentUser || '',
                price: inquiry.currentOffer,
                timestamp: formattedTime,
                note: 'Ponuda je odbijena.'
              }
            ]
          }
        : inq
    );

    setInquiries(updatedInquiries);
    saveState(balances, history, listings, reservations, vehicleOrders, updatedInquiries);
    setActiveInquiryNotification(null);
    setShowNegotiationInput(false);
    triggerToast('Ponuda je odbijena.', false);
  };

  // Dismiss notification popup for current view
  const handleDismissInquiryNotification = () => {
    if (!activeInquiryNotification) return;
    const isSeller = currentUser === activeInquiryNotification.seller;
    const updatedInquiries = inquiries.map((inq) =>
      inq.id === activeInquiryNotification.id
        ? {
            ...inq,
            viewedBySeller: isSeller ? true : inq.viewedBySeller,
            viewedByBuyer: !isSeller ? true : inq.viewedByBuyer
          }
        : inq
    );
    setInquiries(updatedInquiries);
    saveState(balances, history, listings, reservations, vehicleOrders, updatedInquiries);
    setActiveInquiryNotification(null);
    setShowNegotiationInput(false);
  };

  // Perform Authentication
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUsername.trim().toLowerCase();
    
    if (LOGINS[user] && LOGINS[user] === loginPassword) {
      setCurrentUser(user);
      const isBankar = user === 'admin';
      setCurrentRole(isBankar ? UserRole.Admin : UserRole.Player);
      setLoginError(false);
      sessionStorage.setItem('kalnicka_session_user', user);

      // Restrict Admin: Bankar only has bank, no shop or user assets
      if (isBankar) {
        setActiveTab('bank');
      } else {
        // For players, check for pending inquiries on login
        const pendingForSeller = inquiries.find(
          (inq) => inq.seller === user && inq.status === 'pending' && !inq.viewedBySeller
        );
        const counteredForBuyer = inquiries.find(
          (inq) => inq.buyer === user && inq.status === 'countered' && !inq.viewedByBuyer
        );
        const target = pendingForSeller || counteredForBuyer;
        if (target) {
          setActiveInquiryNotification(target);
          setNegotiationOfferPrice(target.currentOffer.toString());
          setNegotiationError(null);
          setShowNegotiationInput(false);
        }
      }

      triggerToast(`Uspješna prijava. Dobrodošli, ${DISPLAY_NAMES[user]}!`);
    } else {
      setLoginError(true);
    }
  };

  // Logout current session
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    setLoginUsername('');
    setLoginPassword('');
    setActiveInquiryNotification(null);
    setShowNegotiationInput(false);
    setNegotiationError(null);
    setActiveTab('bank');
    sessionStorage.removeItem('kalnicka_session_user');
    triggerToast('Odjavljeni ste iz sustava.');
  };

  // Submit new transaction (Admin only)
  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTxFormError(null);
    
    if (!txPlayer) {
      setTxFormError('Molimo odaberite klijenta (Erik, Nera ili Vito).');
      return;
    }
    if (!txType) {
      setTxFormError('Molimo odaberite vrstu transakcije (Dodaj ili Oduzmi).');
      return;
    }
    
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxFormError('Unesite valjan iznos veći od nule.');
      return;
    }
    
    const currentBalance = balances[txPlayer];
    
    if (txType === TransactionType.Subtract && currentBalance - amount < 0) {
      setTxFormError(`Nedovoljno sredstava! Stanje računa ne smije biti negativno. (Trenutno: ${formatMoney(currentBalance)} €)`);
      return;
    }
    
    // Calculate new balance
    const updatedBalances = { ...balances };
    if (txType === TransactionType.Add) {
      updatedBalances[txPlayer] += amount;
    } else {
      updatedBalances[txPlayer] -= amount;
    }
    
    // Create new transaction object
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year} ${hours}:${minutes}`;
    
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedTime,
      player: txPlayer,
      amount: amount,
      type: txType,
      description: txDesc.trim() || 'Transakcija'
    };
    
    const updatedHistory = [newTx, ...history];
    
    // Update local and storage states
    setBalances(updatedBalances);
    setHistory(updatedHistory);
    saveState(updatedBalances, updatedHistory);
    
    triggerToast(`Transakcija uspješno provedena za klijenta ${DISPLAY_NAMES[txPlayer]}!`);
    
    // Clear form
    setTxAmount('');
    setTxDesc('');
    setTxPlayer(null);
    setTxType(null);
  };

  // P2P Money Transfer Handler
  const handleP2PTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setP2pFormError(null);

    if (!currentUser || currentUser === 'admin') {
      setP2pFormError('Morate biti prijavljeni kao igrač.');
      return;
    }

    if (!p2pRecipient) {
      setP2pFormError('Molimo odaberite primatelja transakcije.');
      return;
    }

    if (p2pRecipient === currentUser) {
      setP2pFormError('Ne možete poslati novac samom sebi.');
      return;
    }

    const amount = parseFloat(p2pAmount);
    if (isNaN(amount) || amount <= 0) {
      setP2pFormError('Unesite valjan iznos veći od nule.');
      return;
    }

    const senderBalance = balances[currentUser as 'erik' | 'nera' | 'vito'];
    if (senderBalance - amount < 0) {
      setP2pFormError(`Nedovoljno sredstava! Vaše stanje je ${formatMoney(senderBalance)} €.`);
      return;
    }

    // Check €5,000 daily limit
    const todayPrefix = (() => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      return `${day}.${month}.${year}`;
    })();

    const dailySent = history
      .filter((tx) => {
        const isSender = tx.player === currentUser;
        const isSubtract = tx.type === TransactionType.Subtract;
        const isToday = tx.timestamp.startsWith(todayPrefix);
        const isP2p = tx.isP2P || tx.description.startsWith('Prijenos za ');
        return isSender && isSubtract && isToday && isP2p;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (dailySent + amount > 5000) {
      const remainingLimit = 5000 - dailySent;
      setP2pFormError(`Dnevni limit je 5.000 €! Danas možete poslati još najviše ${formatMoney(Math.max(0, remainingLimit))} €.`);
      return;
    }

    // Perform transfer
    const updatedBalances = { ...balances };
    updatedBalances[currentUser as 'erik' | 'nera' | 'vito'] -= amount;
    updatedBalances[p2pRecipient] += amount;

    // Create 2 transaction logs (one subtract for sender, one add for receiver)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}.${month}.${year} ${hours}:${minutes}`;

    const senderTxDesc = p2pDesc.trim()
      ? `Prijenos za ${DISPLAY_NAMES[p2pRecipient]} (${p2pDesc.trim()})`
      : `Prijenos za ${DISPLAY_NAMES[p2pRecipient]}`;

    const receiverTxDesc = p2pDesc.trim()
      ? `Prijenos od ${DISPLAY_NAMES[currentUser]} (${p2pDesc.trim()})`
      : `Prijenos od ${DISPLAY_NAMES[currentUser]}`;

    const senderTx: Transaction = {
      id: `tx_${Date.now()}_send_${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedTime,
      player: currentUser as 'erik' | 'nera' | 'vito',
      amount: amount,
      type: TransactionType.Subtract,
      description: senderTxDesc,
      isP2P: true
    };

    const receiverTx: Transaction = {
      id: `tx_${Date.now()}_recv_${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedTime,
      player: p2pRecipient,
      amount: amount,
      type: TransactionType.Add,
      description: receiverTxDesc,
      isP2P: true
    };

    const updatedHistory = [senderTx, receiverTx, ...history];

    setBalances(updatedBalances);
    setHistory(updatedHistory);
    saveState(updatedBalances, updatedHistory, listings, reservations, vehicleOrders);

    triggerToast(`Uspješno ste poslali ${formatMoney(amount)} € korisniku ${DISPLAY_NAMES[p2pRecipient]}!`, true);

    // Clear form
    setP2pRecipient(null);
    setP2pAmount('');
    setP2pDesc('');
    setP2pFormError(null);
  };

  // Reset all accounts back to €50,000 (Admin only)
  const handleResetBank = () => {
    const defaultBalances = {
      erik: 50000,
      nera: 50000,
      vito: 50000
    };
    setBalances(defaultBalances);
    setHistory([]);
    setReservations([]);
    setVehicleOrders([]);
    saveState(defaultBalances, [], listings, [], []);
    setShowResetModal(false);
    triggerToast('Kalnička Banka je uspješno resetirana na početne postavke!', true);
  };

  // Manual save button trigger
  const handleManualSave = () => {
    saveState(balances, history, listings, reservations, vehicleOrders);
    triggerToast('Podaci su uspješno spremljeni u lokalnu pohranu preglednika i poslužitelj!', true);
  };

  // Copy shareable link to clipboard
  const handleShareLink = () => {
    let url = window.location.origin;
    if (url.includes('ais-dev-')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    setCopiedLink(url);
    navigator.clipboard.writeText(url).then(() => {
      triggerToast('Poveznica je kopirana! 🔗', true);
      setShowShareModal(true);
    }).catch((err) => {
      console.error('Failed to copy link:', err);
      setShowShareModal(true);
    });
  };

  // Export database to a JSON file
  const handleExportData = () => {
    const now = new Date();
    const backupData = {
      bankName: 'Kalnička Banka',
      exportTimestamp: now.toISOString(),
      balances,
      history,
      listings,
      reservations,
      vehicleOrders
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kalnicka_Banka_Sigurnosna_Kopija_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Sigurnosna kopija je uspješno preuzeta!');
  };

  // Import database from a JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        if (
          imported.balances &&
          typeof imported.balances.erik === 'number' &&
          typeof imported.balances.nera === 'number' &&
          typeof imported.balances.vito === 'number'
        ) {
          const cleanBalances = {
            erik: Math.max(0, imported.balances.erik),
            nera: Math.max(0, imported.balances.nera),
            vito: Math.max(0, imported.balances.vito)
          };
          
          const cleanHistory = Array.isArray(imported.history) ? imported.history : [];
          const cleanListings = Array.isArray(imported.listings) ? imported.listings : listings;
          const cleanReservations = Array.isArray(imported.reservations) ? imported.reservations : reservations;
          const cleanVehicleOrders = Array.isArray(imported.vehicleOrders) ? imported.vehicleOrders : vehicleOrders;
          
          setBalances(cleanBalances);
          setHistory(cleanHistory);
          setListings(cleanListings);
          setReservations(cleanReservations);
          setVehicleOrders(cleanVehicleOrders);
          saveState(cleanBalances, cleanHistory, cleanListings, cleanReservations, cleanVehicleOrders);
          
          triggerToast('Sigurnosna kopija je uspješno uvezena i primijenjena!', true);
        } else {
          triggerToast('Neispravan format sigurnosne kopije. Provjerite datoteku.', false);
        }
      } catch (err) {
        triggerToast('Greška pri čitanju JSON datoteke.', false);
      }
      
      // Clear input so same file can be selected again
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Download complete project package (Offline working code)
  const handleDownloadOfflineZIP = async () => {
    triggerToast('Priprema i pakiranje ZIP datoteke...', true);
    
    try {
      const zip = new JSZip();
      
      // Fetch public offline files that we wrote to public directory
      const resHtml = await fetch('/offline/index.html');
      const textHtml = await resHtml.text();
      
      const resCss = await fetch('/offline/style.css');
      const textCss = await resCss.text();
      
      const resJs = await fetch('/offline/script.js');
      const textJs = await resJs.text();
      
      zip.file('index.html', textHtml);
      zip.file('style.css', textCss);
      zip.file('script.js', textJs);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Kalnicka_Banka_Projekt.zip';
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      triggerToast('ZIP datoteka uspješno preuzeta! Možete je otpakirati i pokrenuti offline.', true);
    } catch (err) {
      console.error(err);
      triggerToast('Greška prilikom pakiranja. Molimo preuzmite datoteke izbornikom u IDE.', false);
    }
  };

  // Utility to format balance values
  const formatMoney = (amount: number) => {
    return Number(amount).toLocaleString('hr-HR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Sum of all money currently in the bank
  const totalTreasury = balances.erik + balances.nera + balances.vito;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans select-none selection:bg-blue-100 selection:text-blue-700">
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col" id="app-main-container">
        <AnimatePresence mode="wait">
          {!currentUser ? (
            // ================== SCREEN 1: LOGIN ==================
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex items-center justify-center p-4 md:p-8"
              id="login-screen-view"
            >
              <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden" id="login-card">
                <div className="bg-blue-800 text-white p-8 text-center relative">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700/50 rounded-2xl mb-4 border border-blue-500/30 shadow-inner">
                    <span className="text-4xl">🏦</span>
                  </div>
                  <h1 className="text-2xl font-bold font-display tracking-tight uppercase">Kalnička Banka</h1>
                  <p className="text-blue-200 text-xs mt-1 font-medium uppercase tracking-wider">Sigurno mobilno i internetsko bankarstvo</p>
                </div>

                <div className="p-8">
                  <div className="mb-4 text-center">
                    <p className="text-xs font-medium text-slate-500">Molimo unesite Vaše korisničko ime i pripadajući PIN / lozinku za pristup računu.</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form-element">
                    <div>
                      <label htmlFor="login-username" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Korisničko ime</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          id="login-username"
                          value={loginUsername}
                          onChange={(e) => {
                            setLoginUsername(e.target.value);
                            setLoginError(false);
                          }}
                          required
                          className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Upišite korisničko ime"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="login-password" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Lozinka / PIN</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyRound className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          id="login-password"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError(false);
                          }}
                          required
                          className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Upišite lozinku"
                        />
                      </div>
                    </div>

                    {loginError && (
                      <div className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-center gap-2" id="login-error-alert">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                        <span>Neispravno korisničko ime ili lozinka!</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer text-sm"
                      id="login-submit-btn"
                    >
                      <LogIn className="w-4 h-4" /> Prijavi se u sustav
                    </button>
                  </form>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 Kalnička Banka d.d.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            // ================== SCREEN 2: LOGGED IN VIEWS ==================
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col"
              id="dashboard-container-view"
            >
              {/* TOP NAVIGATION HEADER */}
              <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md shadow-slate-950/20" id="main-header">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow select-none">🏦</span>
                      <div>
                        <span className="font-sans font-extrabold text-lg md:text-xl text-white tracking-tight">Kalnička Banka</span>
                        <span className="hidden md:inline-flex ml-2 px-2 py-0.5 bg-blue-500/10 text-[10px] text-blue-400 font-bold uppercase rounded-md tracking-wider border border-blue-500/20">Portal</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Korisnik</div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-sm font-bold text-slate-200">{DISPLAY_NAMES[currentUser]}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                            currentRole === UserRole.Admin 
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                              : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                          }`}>
                            {currentRole === UserRole.Admin ? 'Bankar' : 'Klijent'}
                          </span>
                        </div>
                      </div>

                      <div className="h-8 w-[1px] bg-slate-800" />

                      {/* Connection status badge */}
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 border border-slate-700/60 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className={connected ? 'text-emerald-400' : 'text-rose-400'}>
                          {connected ? 'Uživo' : 'Offline'}
                        </span>
                      </div>

                      {/* Active Inquiries badge button */}
                      {currentUser && currentUser !== 'admin' && inquiries.some(inq => (inq.seller === currentUser && inq.status === 'pending') || (inq.buyer === currentUser && inq.status === 'countered')) && (
                        <button
                          onClick={() => {
                            const pendingForSeller = inquiries.find(
                              (inq) => inq.seller === currentUser && inq.status === 'pending'
                            );
                            const counteredForBuyer = inquiries.find(
                              (inq) => inq.buyer === currentUser && inq.status === 'countered'
                            );
                            const target = pendingForSeller || counteredForBuyer;
                            if (target) {
                              setActiveInquiryNotification(target);
                              setNegotiationOfferPrice(target.currentOffer.toString());
                              setNegotiationError(null);
                              setShowNegotiationInput(false);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
                          id="header-inquiries-badge-btn"
                          title="Imate aktivnih upita za kupnju!"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="uppercase tracking-wider text-[10px]">
                            Upiti ({inquiries.filter(inq => (inq.seller === currentUser && inq.status === 'pending') || (inq.buyer === currentUser && inq.status === 'countered')).length})
                          </span>
                        </button>
                      )}

                      {/* Share link button */}
                      <button
                        onClick={handleShareLink}
                        className="inline-flex items-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl border border-blue-700 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        title="Podijeli poveznicu s prijateljima"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline uppercase tracking-wider text-[10px]">Podijeli link</span>
                      </button>

                      <div className="hidden md:block h-8 w-[1px] bg-slate-800" />

                      <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-bold rounded-xl border border-slate-700 hover:border-rose-900/50 transition-all cursor-pointer"
                        id="logout-btn"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline uppercase tracking-wider text-[10px]">Odjava</span>
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {/* USER WELCOME BANNERS */}
              {currentRole === UserRole.Player && (
                <div className="bg-[#1e3a8a] bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-3 px-4 shadow-inner border-b border-blue-800/30" id="player-banner">
                  <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 text-blue-400 animate-pulse" />
                      <span className="font-medium tracking-wide">Dobrodošli u osobno bankarstvo. Pratite stanje i povijest računa uživo s prijateljima! Transakcije obavlja isključivo bankar (Admin).</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MAIN BODY DASHBOARD CONTENT */}
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-grow w-full">
                {activeTab === 'shop' && currentRole === UserRole.Player ? (
                  <ShopView
                    currentUser={currentUser}
                    userDisplayName={DISPLAY_NAMES[currentUser] || currentUser}
                    listings={listings}
                    reservations={reservations}
                    vehicleOrders={vehicleOrders}
                    onAddListing={handleAddListing}
                    onEditListing={handleEditListing}
                    onDeleteListing={handleDeleteListing}
                    onReserveProperty={handleReserveProperty}
                    onBuyCar={handleBuyCar}
                    onNavigateToBank={() => {
                      setActiveTab('bank');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    formatMoney={formatMoney}
                    userBalance={currentUser && ['erik', 'nera', 'vito'].includes(currentUser) ? balances[currentUser as 'erik' | 'nera' | 'vito'] : 0}
                    inquiries={inquiries}
                    onSendInquiry={handleSendInquiry}
                  />
                ) : activeTab === 'my_assets' && currentRole === UserRole.Player ? (
                  <UserAssetsView
                    currentUser={currentUser}
                    userDisplayName={DISPLAY_NAMES[currentUser] || currentUser}
                    vehicleOrders={vehicleOrders}
                    reservations={reservations}
                    userListings={listings}
                    onNavigateToShop={() => {
                      setActiveTab('shop');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onNavigateToBank={() => {
                      setActiveTab('bank');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onEditListing={() => {
                      setActiveTab('shop');
                    }}
                    onDeleteListing={handleDeleteListing}
                    onUpdateVehicleStatus={handleUpdateVehicleStatus}
                    onUpdateReservationStatus={handleUpdateReservationStatus}
                    formatMoney={formatMoney}
                  />
                ) : currentRole === UserRole.Admin ? (
                  // ================== A. ADMIN VIEW ==================
                  <div className="space-y-6 md:space-y-8" id="admin-dashboard-section">
                    {/* 1. Client Card Overviews */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-4 h-4" /> Pregled računa klijenata
                        </h2>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                          UKUPNO U TREZORU: {formatMoney(totalTreasury)} €
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="admin-client-cards-grid">
                        
                        {/* Erik Card */}
                        <div 
                          onClick={() => {
                            setTxPlayer('erik');
                            setTxFormError(null);
                            document.getElementById('admin-tx-form-container')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] ${
                            txPlayer === 'erik' ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <span className="text-7xl font-black italic text-blue-900 font-mono select-none">E</span>
                          </div>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">VLASNIK RAČUNA</p>
                                <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">Erik</h3>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">Aktivno</span>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold tracking-widest">RASPOLOŽIVO STANJE</p>
                              <div className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                                {formatMoney(balances.erik)} <span className="text-sm font-bold text-slate-400">€</span>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                              <span>HR93 2500 0001 ERIK</span>
                              <CreditCard className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        </div>

                        {/* Nera Card */}
                        <div 
                          onClick={() => {
                            setTxPlayer('nera');
                            setTxFormError(null);
                            document.getElementById('admin-tx-form-container')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden group hover:border-purple-300 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] ${
                            txPlayer === 'nera' ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-100' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <span className="text-7xl font-black italic text-purple-950 font-mono select-none">N</span>
                          </div>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">VLASNIK RAČUNA</p>
                                <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">Nera</h3>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">Aktivno</span>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold tracking-widest">RASPOLOŽIVO STANJE</p>
                              <div className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                                {formatMoney(balances.nera)} <span className="text-sm font-bold text-slate-400">€</span>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                              <span>HR93 2500 0002 NERA</span>
                              <CreditCard className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        </div>

                        {/* Vito Card */}
                        <div 
                          onClick={() => {
                            setTxPlayer('vito');
                            setTxFormError(null);
                            document.getElementById('admin-tx-form-container')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden group hover:border-sky-300 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] ${
                            txPlayer === 'vito' ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-100' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <span className="text-7xl font-black italic text-sky-950 font-mono select-none">V</span>
                          </div>
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">VLASNIK RAČUNA</p>
                                <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">Vito</h3>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">Aktivno</span>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold tracking-widest">RASPOLOŽIVO STANJE</p>
                              <div className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                                {formatMoney(balances.vito)} <span className="text-sm font-bold text-slate-400">€</span>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                              <span>HR93 2500 0003 VITO</span>
                              <CreditCard className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* 2. Management Panel and Forms */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Left Block: Transaction Input Form (7 columns) */}
                      <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="admin-tx-form-container">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-800 shadow-sm font-sans font-extrabold text-base select-none">
                            💸
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">Nova Bankarska Transakcija</h3>
                            <p className="text-xs text-slate-400">Prijenos, isplata ili nagrada za odabranog klijenta</p>
                          </div>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="p-6 space-y-5">
                          {/* Client Selection Row */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" id="client-select-label">1. Odaberite Klijenta *</label>
                            <div className="grid grid-cols-3 gap-3" id="admin-tx-player-select">
                              {(['erik', 'nera', 'vito'] as const).map((player) => (
                                <button
                                  key={player}
                                  type="button"
                                  onClick={() => {
                                    setTxPlayer(player);
                                    setTxFormError(null);
                                  }}
                                  className={`py-3 px-4 rounded-xl border text-center transition-all cursor-pointer ${
                                    txPlayer === player
                                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-extrabold ring-2 ring-blue-100'
                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-semibold'
                                  }`}
                                  id={`admin-select-btn-${player}`}
                                >
                                  <span className="block text-xl mb-0.5 select-none">{AVATARS[player]}</span>
                                  <span className="text-xs">{DISPLAY_NAMES[player]}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Selected Client Status Header */}
                          {txPlayer && (
                            <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-center justify-between text-xs animate-fade-in">
                              <span className="text-slate-500 font-medium">Trenutno stanje računa:</span>
                              <span className="font-extrabold text-blue-800 text-sm">{formatMoney(balances[txPlayer])} €</span>
                            </div>
                          )}

                          {/* Action Selector */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">2. Vrsta transakcije *</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setTxType(TransactionType.Add);
                                  setTxFormError(null);
                                }}
                                className={`py-3 px-4 border text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  txType === TransactionType.Add
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 font-bold'
                                }`}
                                id="admin-tx-type-add"
                              >
                                <span>➕</span> Dodaj novac
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTxType(TransactionType.Subtract);
                                  setTxFormError(null);
                                }}
                                className={`py-3 px-4 border text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  txType === TransactionType.Subtract
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-100'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 font-bold'
                                }`}
                                id="admin-tx-type-subtract"
                              >
                                <span>➖</span> Oduzmi novac
                              </button>
                            </div>
                          </div>

                          {/* Transaction Amount */}
                          <div className="space-y-2">
                            <label htmlFor="form-tx-amount" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. Upišite Iznos (€) *</label>
                            <div className="relative rounded-xl shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-bold text-sm">€</span>
                              </div>
                              <input
                                type="number"
                                id="form-tx-amount"
                                min="0.01"
                                step="any"
                                value={txAmount}
                                onChange={(e) => {
                                  setTxAmount(e.target.value);
                                  setTxFormError(null);
                                }}
                                required
                                className="block w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800"
                                placeholder="0"
                              />
                            </div>

                            {/* Preset amount additions */}
                            <div className="grid grid-cols-4 gap-2">
                              {([1000, 5000, 10000, 20000] as const).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => {
                                    const currentNum = parseFloat(txAmount) || 0;
                                    setTxAmount((currentNum + v).toString());
                                    setTxFormError(null);
                                  }}
                                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer text-center"
                                  id={`admin-tx-quick-amount-${v}`}
                                >
                                  +{formatMoney(v)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Transaction Description */}
                          <div className="space-y-2">
                            <label htmlFor="form-tx-desc" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">4. Svrha / Opis Transakcije</label>
                            <input
                              type="text"
                              id="form-tx-desc"
                              value={txDesc}
                              onChange={(e) => {
                                setTxDesc(e.target.value);
                                setTxFormError(null);
                              }}
                              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 font-medium"
                              placeholder="Napišite razlog transakcije"
                            />

                            {/* Preset descriptions for easy play */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {['Plaća', 'Bonus', 'Prodaja Imovine', 'Kupnja imovine', 'Porez', 'Kazna'].map((desc) => (
                                <button
                                  key={desc}
                                  type="button"
                                  onClick={() => {
                                    setTxDesc(desc);
                                    setTxFormError(null);
                                  }}
                                  className={`py-1 px-3 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                                    txDesc === desc
                                      ? 'bg-blue-600 border-blue-600 text-white shadow'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                  id={`admin-tx-preset-${desc.replace(/\s+/g, '-').toLowerCase()}`}
                                >
                                  {desc === 'Plaća' ? '💼' : desc === 'Bonus' ? '🎁' : desc === 'Prodaja Imovine' ? '🏢' : desc === 'Kupnja imovine' ? '🏡' : desc === 'Porez' ? '🧾' : '🚨'} {desc}
                                </button>
                              ))}
                            </div>
                          </div>

                          {txFormError && (
                            <div className="text-rose-500 text-xs font-semibold bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-center gap-2 animate-fade-in" id="admin-tx-error-alert">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{txFormError}</span>
                            </div>
                          )}

                          {/* Submit Actions */}
                          <div className="pt-3 border-t border-slate-100" id="admin-tx-submit-container">
                            <button
                              type="submit"
                              className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-xs uppercase flex items-center justify-center gap-2"
                              id="admin-tx-submit-btn"
                            >
                              <Send className="w-4 h-4" /> Izvrši transakciju
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Right Block: System Utilities & Backup (5 columns) */}
                      <div className="lg:col-span-5 space-y-6">
                        {/* Backup & System operations Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4" id="system-utilities-card">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-sans font-black text-sm select-none">
                              ⚙️
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">Sustav & Sigurnost</h4>
                          </div>

                          <div className="grid grid-cols-1 gap-2 pt-2">
                            <button
                              type="button"
                              onClick={handleManualSave}
                              className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer gap-2"
                              id="admin-save-btn"
                            >
                              <span className="flex items-center gap-2">
                                <Save className="w-4 h-4 text-emerald-500" /> Spremi trenutačno stanje
                              </span>
                              <span className="text-[10px] bg-slate-200/60 px-2 py-0.5 rounded text-slate-500 uppercase font-mono font-bold">Lokalno</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleExportData}
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                              id="admin-export-btn"
                            >
                              <Download className="w-4 h-4 text-blue-500" />
                              <span>Izvezi sigurnosnu kopiju (JSON)</span>
                            </button>

                            <label
                              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer text-center gap-1.5"
                              id="admin-import-label"
                            >
                              <Upload className="w-5 h-5 text-purple-500" />
                              <span>Uvezi sigurnosnu kopiju (JSON)</span>
                              <input
                                type="file"
                                className="hidden"
                                accept=".json"
                                onChange={handleImportData}
                                id="admin-import-input"
                              />
                            </label>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setShowResetModal(true)}
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-100 transition-all cursor-pointer animate-fade-in"
                              id="admin-reset-trigger-btn"
                            >
                              <RotateCcw className="w-4 h-4" /> Resetiraj banku
                            </button>
                          </div>
                        </div>


                      </div>

                    </div>

                    {/* 3. Transaction History Log (Full Admin view) */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" id="admin-history-section">
                      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-sans font-black text-sm select-none">
                            📜
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">Povijest Svih Transakcija</h3>
                            <p className="text-xs text-slate-400">Kronološki pregled svih uplata i isplata</p>
                          </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex flex-wrap items-center gap-1.5" id="admin-history-filters">
                          <span className="text-xs font-bold text-slate-400 mr-1.5 uppercase tracking-wider">Filtriraj:</span>
                          {(['all', 'erik', 'nera', 'vito'] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setHistoryFilter(filter)}
                              className={`py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                historyFilter === filter
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              id={`admin-filter-btn-${filter}`}
                            >
                              {filter === 'all' ? 'Sve' : DISPLAY_NAMES[filter]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* History Log Items */}
                      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto" id="admin-history-list">
                        {(() => {
                          const filtered = historyFilter === 'all' 
                            ? history 
                            : history.filter((tx) => tx.player === historyFilter);

                          if (filtered.length === 0) {
                            return (
                              <div className="p-12 text-center text-slate-400 text-xs">
                                <span className="block text-3xl mb-2 select-none">🔍</span>
                                <p className="font-semibold text-slate-500">Nema zabilježenih transakcija za odabranog klijenta.</p>
                              </div>
                            );
                          }

                          return filtered.map((tx) => {
                            const isAdd = tx.type === TransactionType.Add;
                            return (
                              <div key={tx.id} className="p-4 hover:bg-slate-50/80 flex items-center justify-between gap-4 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                                    isAdd ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                  }`}>
                                    {isAdd ? '📈' : '📉'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-800">{DISPLAY_NAMES[tx.player]}</span>
                                      <span className="text-[10px] text-slate-400 font-medium">{tx.timestamp}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Opis: <span className="font-extrabold text-slate-700">{tx.description}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-black ${isAdd ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isAdd ? '+' : '-'}{formatMoney(tx.amount)} €
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Admin Marketplace Orders & Reservations Manager */}
                    <AdminMarketplaceManagement
                      listings={listings}
                      reservations={reservations}
                      vehicleOrders={vehicleOrders}
                      onDeleteListing={handleDeleteListing}
                      onUpdateVehicleStatus={handleUpdateVehicleStatus}
                      onUpdateReservationStatus={handleUpdateReservationStatus}
                      formatMoney={formatMoney}
                    />
                  </div>
                ) : (
                  // ================== B. PLAYER VIEW ==================
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="player-dashboard-section">
                    {/* Personalized Debit Card and Info Box (5 columns) */}
                    <div className="md:col-span-5 space-y-6">
                      {/* Debit Card */}
                      <div className="bg-[#0f172a] bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 rounded-3xl shadow-xl text-white p-8 relative overflow-hidden border border-slate-700/60" id="player-credit-card">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />

                        <div className="flex justify-between items-start mb-10">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl select-none">{currentUser ? AVATARS[currentUser] : '💳'}</span>
                              <span className="font-sans font-extrabold text-xl tracking-tight text-white">
                                {currentUser ? DISPLAY_NAMES[currentUser] : 'Klijent'}
                              </span>
                            </div>
                            <p className="text-[10px] text-indigo-300 tracking-wider font-mono mt-1 font-bold">
                              {currentUser === 'erik' ? 'HR93 2500 0001 ERIK' : currentUser === 'nera' ? 'HR93 2500 0002 NERA' : 'HR93 2500 0003 VITO'}
                            </p>
                          </div>
                          <div className="w-12 h-8 bg-white/10 rounded-md border border-white/20 backdrop-blur-sm flex items-center justify-center font-black text-[10px] tracking-widest text-indigo-200">
                            VISA
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Raspoloživo stanje računa</p>
                          <div className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                            <span>{currentUser ? formatMoney(balances[currentUser as 'erik' | 'nera' | 'vito']) : '0'}</span>
                            <span className="text-xl font-bold text-indigo-300">€</span>
                          </div>
                        </div>

                        <div className="mt-12 flex justify-between items-end text-xs font-mono text-slate-300">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-sans font-bold mb-0.5">Vrijedi do</p>
                            <p className="font-bold">12/31</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 bg-gradient-to-br from-amber-300 to-amber-500 rounded-md shadow border border-amber-400 flex flex-col justify-between p-1 opacity-90">
                              <div className="h-[1px] w-full bg-amber-200/55" />
                              <div className="h-[1px] w-full bg-amber-200/55" />
                              <div className="h-[1px] w-full bg-amber-200/55" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Send Money Form */}
                      {(() => {
                        const todayPrefix = (() => {
                          const now = new Date();
                          const d = String(now.getDate()).padStart(2, '0');
                          const m = String(now.getMonth() + 1).padStart(2, '0');
                          const y = now.getFullYear();
                          return `${d}.${m}.${y}`;
                        })();

                        const dailySentTotal = history
                          .filter((tx) => {
                            const isSender = tx.player === currentUser;
                            const isSubtract = tx.type === TransactionType.Subtract;
                            const isToday = tx.timestamp.startsWith(todayPrefix);
                            const isP2p = tx.isP2P || tx.description.startsWith('Prijenos za ');
                            return isSender && isSubtract && isToday && isP2p;
                          })
                          .reduce((sum, tx) => sum + tx.amount, 0);

                        const remainingLimit = 5000 - dailySentTotal;

                        return (
                          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4" id="player-p2p-transfer-card">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pošalji novac prijatelju</h4>
                              <p className="text-[11px] text-slate-500 mt-1">Prenesite sredstva izravno na račun drugog igrača u stvarnom vremenu.</p>
                            </div>

                            <form onSubmit={handleP2PTransfer} className="space-y-4">
                              {/* Recipient Selection */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Primatelj</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {(['erik', 'nera', 'vito'] as const)
                                    .filter((p) => p !== currentUser)
                                    .map((player) => (
                                      <button
                                        key={player}
                                        type="button"
                                        onClick={() => setP2pRecipient(player)}
                                        className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                          p2pRecipient === player
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <span className="text-lg">{AVATARS[player]}</span>
                                        <span>{DISPLAY_NAMES[player]}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>

                              {/* Amount Input */}
                              <div>
                                <label htmlFor="p2p-amount" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Iznos (€)</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    id="p2p-amount"
                                    value={p2pAmount}
                                    onChange={(e) => setP2pAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-black text-slate-800 transition-all outline-none"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">€</span>
                                </div>
                              </div>

                              {/* Description Input */}
                              <div>
                                <label htmlFor="p2p-desc" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Poruka / Opis (opcionalno)</label>
                                <input
                                  type="text"
                                  id="p2p-desc"
                                  value={p2pDesc}
                                  onChange={(e) => setP2pDesc(e.target.value)}
                                  placeholder="npr. Za kupnju zemljišta, najam..."
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-700 transition-all outline-none"
                                />
                              </div>

                              {/* Daily Limit Tracker */}
                              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                                  <span>Dnevni limit prijenosa:</span>
                                  <span className="font-extrabold text-slate-700">5.000 €</span>
                                </div>
                                <div className="flex justify-between items-baseline text-xs">
                                  <span className="text-[10px] font-medium text-slate-400">Preostalo za danas:</span>
                                  <span className="font-black text-emerald-600">{formatMoney(Math.max(0, remainingLimit))} €</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300" 
                                    style={{ width: `${Math.min(100, (dailySentTotal / 5000) * 100)}%` }}
                                  />
                                </div>
                              </div>

                              {p2pFormError && (
                                <div className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-2xl border border-rose-100 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                  <span>{p2pFormError}</span>
                                </div>
                              )}

                              <button
                                type="submit"
                                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl border border-blue-700 transition-all cursor-pointer shadow-md active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
                              >
                                💸 Pošalji Sredstva
                              </button>
                            </form>
                          </div>
                        );
                      })()}

                      {/* Directions box */}
                      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upute za korištenje</h4>
                        <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">Stanje vašeg računa se ažurira u realnom vremenu čim bankar (Admin) unese promjenu.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">Povijest s desne strane prikazuje isključivo vaše transakcije (plaća, kupnja, porezi).</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">Možete samostalno slati novac drugim igračima do 5.000 € dnevno. Ostale uplate i isplate i dalje vrši isključivo bankar (Admin).</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Personal Transaction History List (7 columns) */}
                    <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="player-history-container">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-sans font-black text-sm select-none">
                            📜
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">Povijest Mojih Transakcija</h3>
                            <p className="text-xs text-slate-400">Pregled svih promjena stanja na vašem računu</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                          UKUPNO: {history.filter((tx) => tx.player === currentUser).length}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto" id="player-history-list">
                        {(() => {
                          const playerHistory = history.filter((tx) => tx.player === currentUser);

                          if (playerHistory.length === 0) {
                            return (
                              <div className="p-12 text-center text-slate-400 text-xs">
                                <span className="block text-3xl mb-2 select-none">🔍</span>
                                <p className="font-semibold text-slate-500">Nema zabilježenih transakcija na vašem računu.</p>
                              </div>
                            );
                          }

                          return playerHistory.map((tx) => {
                            const isAdd = tx.type === TransactionType.Add;
                            return (
                              <div key={tx.id} className="p-4 hover:bg-slate-50/80 flex items-center justify-between gap-4 transition-all animate-fade-in">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                                    isAdd ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                  }`}>
                                    {isAdd ? '📈' : '📉'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black text-slate-800">{isAdd ? 'Uplata na račun' : 'Isplata s računa'}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{tx.timestamp}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Opis: <span className="font-extrabold text-slate-700">{tx.description}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-black ${isAdd ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isAdd ? '+' : '-'}{formatMoney(tx.amount)} €
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </main>

              {/* BOTTOM NAVIGATION DOCK (VISIBLE ONLY WHEN LOGGED IN) */}
              <nav className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2.5 px-4 shadow-2xl" id="bottom-navigation-bar">
                <div className="max-w-md mx-auto flex items-center justify-around">
                  <button
                    onClick={() => {
                      setActiveTab('bank');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col sm:flex-row items-center gap-1.5 py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
                      activeTab === 'bank'
                        ? 'bg-blue-600 text-white shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium'
                    }`}
                    id="bottom-tab-bank"
                  >
                    <span className="text-lg select-none">🏦</span>
                    <span className="text-xs">Kalnička Banka</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('shop');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col sm:flex-row items-center gap-1.5 py-1.5 px-4 rounded-xl transition-all cursor-pointer relative ${
                      activeTab === 'shop'
                        ? 'bg-blue-600 text-white shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium'
                    }`}
                    id="bottom-tab-shop"
                  >
                    <span className="text-lg select-none">🏪</span>
                    <span className="text-xs">Trgovina</span>
                    {listings.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    )}
                  </button>

                  {currentRole === UserRole.Player && (
                    <button
                      onClick={() => {
                        setActiveTab('my_assets');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex flex-col sm:flex-row items-center gap-1.5 py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'my_assets'
                          ? 'bg-blue-600 text-white shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium'
                      }`}
                      id="bottom-tab-my-assets"
                    >
                      <span className="text-lg select-none">💼</span>
                      <span className="text-xs">Moja Imovina</span>
                    </button>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>



      {/* ================== GLOBAL SYSTEM MODALS ================== */}
      
      {/* 1. RESET BANK CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" id="reset-modal-mask">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
              id="reset-modal-box"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm text-2xl select-none">
                  ⚠️
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-800">Resetiranje Kalničke Banke</h3>
                  <p className="text-sm text-slate-500 font-medium">Jeste li sigurni da želite resetirati Kalničku Banku?</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 text-xs text-amber-800 text-left flex items-start gap-2.5">
                  <Info className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span className="font-medium leading-relaxed">Ova radnja će nepovratno vratiti sve račune klijenata (Erik, Nera, Vito) na početno stanje od <strong>50.000 €</strong> te obrisati cjelokupnu povijest transakcija.</span>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  id="reset-modal-cancel-btn"
                >
                  Odustani
                </button>
                <button
                  onClick={handleResetBank}
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                  id="reset-modal-confirm-btn"
                >
                  Da, resetiraj
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1.5. SHARE LINK MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" id="share-modal-mask">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
              id="share-modal-box"
            >
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shadow-sm text-xl select-none">
                  🔗
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-100">Podijeli Kalničku Banku</h3>
                  <p className="text-xs text-slate-400 font-medium">Pošalji link prijateljima i pratite stanje u stvarnom vremenu!</p>
                </div>

                {/* Copied link box */}
                <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-nowrap scrollbar-thin select-all flex-1 py-1 px-1">
                    {copiedLink || 'Dohvaćam poveznicu...'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(copiedLink);
                      triggerToast('Kopirano!', true);
                    }}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer flex-shrink-0 active:scale-95"
                  >
                    Kopiraj opet
                  </button>
                </div>

                {/* Crucial Instructions */}
                <div className="bg-amber-950/40 rounded-2xl p-4 border border-amber-900/40 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="text-base leading-none">⚠️</span>
                    <span>VAŽNO: KAKO OMOGUĆITI PRISTUP ZA PRIJATELJE?</span>
                  </div>
                  <p className="leading-relaxed font-medium text-slate-300">
                    Tvoji prijatelji trenutno ne mogu ući na link jer aplikacija radi u privatnom načinu rada. Da bi im link proradio i da ne dobiju <strong>Error 404</strong>:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 font-medium pl-1 text-slate-300">
                    <li>
                      U gornjem desnom kutu ovog <strong className="text-amber-400">Google AI Studio</strong> sučelja klikni na gumb <strong className="text-blue-400">"Share"</strong> (Podijeli).
                    </li>
                    <li>
                      Omogući javno dijeljenje aplikacije kako bi tvoji prijatelji dobili dozvolu za otvaranje poveznicu na svojim uređajima.
                    </li>
                    <li>
                      Nakon toga će kopirani link proraditi bez ikakve greške!
                    </li>
                  </ol>
                </div>
              </div>

              <div className="bg-slate-950 px-6 py-4 flex justify-end border-t border-slate-800/60">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  id="share-modal-close-btn"
                >
                  Razumijem, zatvori
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. CENTERED INQUIRY NOTIFICATION MODAL (Triggered on login for seller/buyer) */}
      <AnimatePresence>
        {activeInquiryNotification && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
            id="inquiry-notification-modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white my-auto relative"
              id="inquiry-notification-modal-card"
            >
              {/* Close X */}
              <button
                onClick={handleDismissInquiryNotification}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                title="Zatvori (Kasnije)"
                id="inquiry-modal-close-x-btn"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner select-none">
                  💬
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Obavijest o upitu za kupnju
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {activeInquiryNotification.seller === currentUser ? 'Novi upit za vaš oglas' : 'Protuponuda za oglas'}
                  </h3>
                </div>
              </div>

              {/* Main message requested by user */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-center space-y-2">
                <p className="text-base font-extrabold text-amber-300 leading-snug">
                  "{activeInquiryNotification.buyerName} želi kupiti {activeInquiryNotification.listingType === 'car' ? 'vozilo' : 'imovinu'} sa tvojeg oglasa za {formatMoney(activeInquiryNotification.currentOffer)} €"
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  {activeInquiryNotification.listingTitle}
                </p>
              </div>

              {/* Pricing & Balance Details */}
              {(() => {
                const buyerBalance = balances[activeInquiryNotification.buyer] || 0;
                const buyerAfterBalance = buyerBalance - activeInquiryNotification.currentOffer;
                const buyerCannotAfford = buyerAfterBalance < -10000;

                const minPrice = Math.max(0, activeInquiryNotification.originalPrice - 10000);
                const maxPrice = activeInquiryNotification.originalPrice + 10000;

                const counterNum = parseFloat(negotiationOfferPrice) || activeInquiryNotification.currentOffer;
                const buyerAfterCounter = buyerBalance - counterNum;
                const buyerCannotAffordCounter = buyerAfterCounter < -10000;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Originalna cijena oglasa:</span>
                        <span className="font-bold text-slate-200 text-sm">{formatMoney(activeInquiryNotification.originalPrice)} €</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Ponuđeni iznos:</span>
                        <span className="font-black text-amber-400 text-sm">{formatMoney(activeInquiryNotification.currentOffer)} €</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-800/80 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Stanje kupca ({activeInquiryNotification.buyerName}):
                        </span>
                        <span className="font-bold text-slate-200">{formatMoney(buyerBalance)} €</span>
                      </div>
                      <div className="col-span-2 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Stanje kupca nakon kupnje:
                        </span>
                        <span className={`font-extrabold ${buyerCannotAfford ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}`}>
                          {formatMoney(buyerAfterBalance)} €
                        </span>
                      </div>
                    </div>

                    {/* Balance Alert if buyer would drop below -10,000 € */}
                    {buyerCannotAfford && (
                      <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 space-y-1">
                        <div className="flex items-center gap-2 font-black text-rose-300">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                          <span>Kupac nema dovoljno novaca!</span>
                        </div>
                        <p className="text-[11px] text-rose-200/90 leading-relaxed">
                          Maksimalan iznos koji korisnik može biti u minusu je <strong>10.000 €</strong>. Kupac ima <strong>{formatMoney(buyerBalance)} €</strong>, a želi kupiti za <strong>{formatMoney(activeInquiryNotification.currentOffer)} €</strong> (stanje bi bilo <strong>{formatMoney(buyerAfterBalance)} €</strong>).
                        </p>
                      </div>
                    )}

                    {/* Negotiation Form (Cjenkanje - samo 10.000 manje ili više) */}
                    {showNegotiationInput ? (
                      <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-800/70 space-y-3" id="negotiation-panel">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                            🤝 Cjenkanje (Protuponuda)
                          </span>
                          <span className="text-[10px] text-blue-200/80 font-mono">
                            ±10.000 € od originala
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300">
                          Unesite vašu protuponudu (dopušteno samo od <strong>{formatMoney(minPrice)} €</strong> do <strong>{formatMoney(maxPrice)} €</strong>):
                        </p>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-grow">
                            <input
                              type="number"
                              min={minPrice}
                              max={maxPrice}
                              step="500"
                              value={negotiationOfferPrice}
                              onChange={(e) => {
                                setNegotiationOfferPrice(e.target.value);
                                setNegotiationError(null);
                              }}
                              className="w-full bg-slate-900 border border-blue-500/50 rounded-xl py-2 px-3 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Iznos ponude..."
                              id="negotiation-price-input"
                            />
                            <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">€</span>
                          </div>
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNegotiationOfferPrice(minPrice.toString());
                              setNegotiationError(null);
                            }}
                            className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 text-[10px] font-bold rounded-lg border border-blue-700/50 cursor-pointer"
                          >
                            -10.000 € ({formatMoney(minPrice)} €)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNegotiationOfferPrice(activeInquiryNotification.originalPrice.toString());
                              setNegotiationError(null);
                            }}
                            className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 text-[10px] font-bold rounded-lg border border-blue-700/50 cursor-pointer"
                          >
                            Original ({formatMoney(activeInquiryNotification.originalPrice)} €)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNegotiationOfferPrice(maxPrice.toString());
                              setNegotiationError(null);
                            }}
                            className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 text-[10px] font-bold rounded-lg border border-blue-700/50 cursor-pointer"
                          >
                            +10.000 € ({formatMoney(maxPrice)} €)
                          </button>
                        </div>

                        {/* Warning if counter exceeds buyer balance minus 10,000 */}
                        {buyerCannotAffordCounter && (
                          <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[10px] text-amber-200 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span>Kupac bi s ovom cijenom bio u minusu {formatMoney(buyerAfterCounter)} € (limit: -10.000 €).</span>
                          </div>
                        )}

                        {negotiationError && (
                          <div className="p-2 bg-rose-950/40 border border-rose-800/60 rounded-lg text-[10px] text-rose-300">
                            {negotiationError}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseFloat(negotiationOfferPrice);
                              if (isNaN(val)) {
                                setNegotiationError('Unesite valjan broj.');
                                return;
                              }
                              handleCounterInquiry(activeInquiryNotification, val);
                            }}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
                            id="submit-counter-offer-btn"
                          >
                            Pošalji protuponudu ({formatMoney(counterNum)} €)
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNegotiationInput(false)}
                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Odustani
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Prihvati ponudu */}
                        <button
                          type="button"
                          onClick={() => handleAcceptInquiry(activeInquiryNotification)}
                          disabled={buyerCannotAfford}
                          className={`py-3 px-4 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                            buyerCannotAfford
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-emerald-900/50'
                          }`}
                          title={buyerCannotAfford ? 'Kupac nema dovoljno novaca (limit -10.000 €)' : 'Prihvati ponudu'}
                          id="accept-inquiry-btn"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Prihvati ({formatMoney(activeInquiryNotification.currentOffer)} €)
                        </button>

                        {/* Cjenkaj se (Protuponuda) */}
                        <button
                          type="button"
                          onClick={() => setShowNegotiationInput(!showNegotiationInput)}
                          className="py-3 px-4 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 hover:text-white border border-blue-500/40 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                          id="toggle-negotiate-btn"
                        >
                          🤝 Cjenkaj se (±10.000 €)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Odbij ponudu */}
                        <button
                          type="button"
                          onClick={() => handleRejectInquiry(activeInquiryNotification)}
                          className="py-2.5 px-4 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 border border-rose-800/40 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                          id="reject-inquiry-btn"
                        >
                          Odbij ponudu
                        </button>

                        {/* Kasnije / Zatvori */}
                        <button
                          type="button"
                          onClick={handleDismissInquiryNotification}
                          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                          id="dismiss-inquiry-btn"
                        >
                          Zatvori (Kasnije)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. TOAST NOTIFICATION BADGE */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-slate-800"
            id="toast-notification-popup"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
              toast.isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {toast.isSuccess ? '✅' : '❌'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 leading-tight">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
