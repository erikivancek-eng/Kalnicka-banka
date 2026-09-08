import { PredefinedProperty, PredefinedCar } from '../types';

export const PREDEFINED_PROPERTIES: PredefinedProperty[] = [
  {
    id: 'prop_mala_fotelja',
    title: 'Mala Fotelja',
    price: 0,
    isFree: true,
    category: 'property',
    icon: '🪑'
  },
  {
    id: 'prop_velika_fotelja',
    title: 'Velika fotelja',
    price: 0,
    isFree: true,
    category: 'property',
    icon: '🛋️'
  },
  {
    id: 'prop_tv_playstation',
    title: 'TV i Play Station',
    price: 0,
    isFree: true,
    category: 'property',
    icon: '🎮'
  },
  {
    id: 'prop_spavaca_soba',
    title: 'Spavaća Soba',
    price: 45000,
    isFree: false,
    category: 'property',
    icon: '🛏️'
  },
  {
    id: 'prop_bakina_djedova_soba',
    title: 'Bakina i Djedova Soba',
    price: 15000,
    isFree: false,
    category: 'property',
    icon: '🏡'
  },
  {
    id: 'prop_mala_soba',
    title: 'Mala Soba',
    price: 30000,
    isFree: false,
    category: 'property',
    icon: '🚪'
  },
  {
    id: 'prop_garaza',
    title: 'Garaža',
    price: 5000,
    isFree: false,
    category: 'property',
    icon: '🚗'
  },
  {
    id: 'prop_prostor_garaza_prvi',
    title: 'Prostor iznad Garaže Prvi',
    price: 3500,
    isFree: false,
    category: 'property',
    icon: '📦'
  },
  {
    id: 'prop_prostor_garaza_drugi',
    title: 'Prostor iznad Garaže Drugi',
    price: 1000,
    isFree: false,
    category: 'property',
    icon: '🗝️'
  },
  {
    id: 'prop_dvoriste_rostilj',
    title: 'Dvorište i Roštilj',
    price: 20000,
    isFree: false,
    category: 'property',
    icon: '🥩'
  },
  {
    id: 'prop_wc',
    title: 'WC',
    price: 45000,
    isFree: false,
    category: 'property',
    icon: '🚽'
  },
  {
    id: 'prop_dnevni_boravak',
    title: 'Dnevni Boravak',
    price: 35000,
    isFree: false,
    category: 'property',
    icon: '🛋️'
  },
  {
    id: 'prop_kuhinja',
    title: 'Kuhinja',
    price: 40000,
    isFree: false,
    category: 'property',
    icon: '🍳'
  }
];

export const PREDEFINED_CARS: PredefinedCar[] = [
  {
    id: 'car_bmw_caravan',
    name: 'BMW Caravan',
    price: 7500,
    category: 'car',
    badge: 'Obiteljski karavan',
    icon: '🚙'
  },
  {
    id: 'car_american_lowrider',
    name: 'American Lowrider Convertible',
    price: 12350,
    category: 'car',
    badge: 'Custom Klasik',
    icon: '🚘'
  },
  {
    id: 'car_bmw_i8',
    name: 'BMW i8',
    price: 40000,
    category: 'car',
    badge: 'Hybrid Sport',
    icon: '🏎️'
  },
  {
    id: 'car_ram_trx',
    name: 'RAM TRX 4X4',
    price: 70000,
    category: 'car',
    badge: 'Supercharged Truck',
    icon: '🛻'
  },
  {
    id: 'car_mclaren_570s',
    name: 'McLaren 570s',
    price: 85000,
    category: 'car',
    badge: 'Supercar',
    icon: '🏎️'
  },
  {
    id: 'car_lamborghini_urus',
    name: 'Lamborghini Urus',
    price: 100000,
    category: 'car',
    badge: 'Super SUV',
    icon: '🚙'
  },
  {
    id: 'car_porsche_gt2',
    name: 'Porsche GT2',
    price: 125000,
    category: 'car',
    badge: 'Track Beast',
    icon: '🏎️'
  },
  {
    id: 'car_lamborghini_aventador',
    name: 'Lamborghini Aventador',
    price: 150000,
    category: 'car',
    badge: 'V12 Monster',
    icon: '🏎️'
  },
  {
    id: 'car_ferrari_sf90',
    name: 'Ferrari SF90 Stradelle',
    price: 200000,
    category: 'car',
    badge: 'Hypercar 1000 HP',
    icon: '🏎️'
  },
  {
    id: 'car_mclaren_speedtail',
    name: 'McLaren Speedtail',
    price: 500000,
    category: 'car',
    badge: 'Hyper-GT',
    icon: '🚀'
  },
  {
    id: 'car_lamborghini_sian',
    name: 'Lamborghini Sian',
    price: 720000,
    category: 'car',
    badge: 'Supercapacitor',
    icon: '⚡'
  },
  {
    id: 'car_lamborghini_miura',
    name: 'Lamborghini Miura',
    price: 1000000,
    category: 'car',
    badge: 'Legendary Classic',
    icon: '👑'
  },
  {
    id: 'car_porsche_carrera_gts_turbo_classic',
    name: 'Porsche Carrera GTS Turbo Classic',
    price: 2500000,
    category: 'car',
    badge: 'Ultra Rare Masterpiece',
    icon: '💎'
  }
];
