export enum UserRole {
  Admin = 'admin',
  Player = 'player'
}

export enum TransactionType {
  Add = 'add',
  Subtract = 'subtract'
}

export interface Transaction {
  id: string;
  timestamp: string;
  player: 'erik' | 'nera' | 'vito';
  amount: number;
  type: TransactionType;
  description: string;
  isP2P?: boolean;
}

export interface Balances {
  erik: number;
  nera: number;
  vito: number;
}

export type AssetCategory = 'car' | 'property';

export interface UserListing {
  id: string;
  seller: 'erik' | 'nera' | 'vito';
  sellerName: string;
  type: AssetCategory;
  title: string;
  price: number;
  description: string;
  imageUrl?: string;
  status: 'active' | 'reserved' | 'sold';
  reservedBy?: string;
  createdAt: string;
  lastPurchasedAt?: number;
}

export interface PredefinedProperty {
  id: string;
  title: string;
  price: number;
  isFree: boolean;
  category: 'property';
  description?: string;
  icon: string;
}

export interface PredefinedCar {
  id: string;
  name: string;
  price: number;
  category: 'car';
  speed?: string;
  badge?: string;
  icon: string;
}

export interface PropertyReservation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  price: number;
  username: 'erik' | 'nera' | 'vito';
  userDisplayName: string;
  date: string;
  status: 'Rezervirano – čeka obradu u banci' | 'Obrađeno' | 'Otkazano';
  isCustomListing?: boolean;
  listingId?: string;
  isPaid?: boolean;
  paidAt?: string;
  purchasedAt?: number;
}

export interface VehicleOrder {
  id: string;
  carId: string;
  carName: string;
  price: number;
  username: 'erik' | 'nera' | 'vito';
  userDisplayName: string;
  date: string;
  status: 'Čeka preuzimanje u banci' | 'Preuzeto' | 'Otkazano';
  isCustomListing?: boolean;
  listingId?: string;
  isPaid?: boolean;
  paidAt?: string;
  purchasedAt?: number;
}

export interface InquiryHistoryEntry {
  sender: 'buyer' | 'seller';
  senderName: string;
  price: number;
  timestamp: string;
  note?: string;
}

export interface ListingInquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: AssetCategory;
  seller: 'erik' | 'nera' | 'vito';
  sellerName: string;
  buyer: 'erik' | 'nera' | 'vito';
  buyerName: string;
  originalPrice: number;
  currentOffer: number;
  history: InquiryHistoryEntry[];
  status: 'pending' | 'countered' | 'accepted' | 'rejected';
  viewedBySeller: boolean;
  viewedByBuyer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankStateData {
  balances: Balances;
  history: Transaction[];
  listings: UserListing[];
  reservations: PropertyReservation[];
  vehicleOrders: VehicleOrder[];
  inquiries: ListingInquiry[];
}
