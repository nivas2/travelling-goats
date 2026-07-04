// ===== Common Types =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
  description?: string;
}

// ===== Trip Types =====

export interface TripCardData {
  id: string;
  title: string;
  slug: string;
  destination: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  duration: number;
  basePricePaise: number;
  maxGroupSize: number;
  currentBookings: number;
  category: string;
  difficulty: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  tags: string[];
  highlights: string[];
}

export interface TripDetail extends TripCardData {
  description: string;
  shortDescription: string | null;
  origin: string;
  images: string[];
  couplePricePaise: number | null;
  groupPricePaise: number | null;
  platformFeePaise: number;
  inclusions: string[];
  exclusions: string[];
  meetingPoint: string | null;
  meetingTime: string | null;
  cancellationPolicy: string;
  itineraryDays: ItineraryDayData[];
  addOns: AddOnData[];
  snackOptions: SnackOptionData[];
  faqs: FaqData[];
  minGroupSize: number;
}

export interface ItineraryDayData {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  activities: ActivityData[];
  meals: string[];
  accommodation: string | null;
}

export interface ActivityData {
  time: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface AddOnData {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  icon: string | null;
  maxQuantity: number;
  isPopular: boolean;
}

export interface SnackOptionData {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  category: string | null;
  icon: string | null;
  isVeg: boolean;
}

export interface FaqData {
  id: string;
  question: string;
  answer: string;
}

// ===== Booking Types =====

export interface TravelerInfo {
  name: string;
  age: number;
  gender: string;
  phone: string;
}

export interface BookingFormData {
  tripId: string;
  bookingType: "SOLO" | "COUPLE" | "GROUP";
  travelerCount: number;
  travelers: TravelerInfo[];
  seatPreference: string | null;
  specialRequests: string | null;
  pickupPoint: string | null;
  addOns: { addOnId: string; quantity: number }[];
  snacks: { snackId: string; quantity: number }[];
  couponCode: string | null;
}

export interface BookingSummary {
  basePricePaise: number;
  addonsPricePaise: number;
  snacksPricePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  walletAmountPaise: number;
  totalPricePaise: number;
}

// ===== User Types =====

export interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  city: string | null;
  bio: string | null;
  interests: string[];
  isVerified: boolean;
  isOnboarded: boolean;
  idVerified: boolean;
  rewardPoints: number;
  rewardTier: string;
  totalTrips: number;
  referralCode: string | null;
}

// ===== Chat Types =====

export interface ChatMessageData {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  type: "TEXT" | "IMAGE" | "SYSTEM" | "LOCATION";
  imageUrl: string | null;
  replyToId: string | null;
  replyToContent: string | null;
  isEdited: boolean;
  createdAt: string;
}

// ===== Wallet Types =====

export interface WalletData {
  id: string;
  balancePaise: number;
  transactions: WalletTransactionData[];
}

export interface WalletTransactionData {
  id: string;
  type: string;
  amountPaise: number;
  description: string;
  balanceAfterPaise: number;
  createdAt: string;
}

export interface SavingsGoalData {
  id: string;
  name: string;
  targetPaise: number;
  currentPaise: number;
  autoSaveAmount: number | null;
  targetDate: string | null;
  isActive: boolean;
}

// ===== Notification Types =====

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ===== Admin Types =====

export interface DashboardStats {
  totalUsers: number;
  totalTrips: number;
  totalBookings: number;
  totalRevenuePaise: number;
  activeTrips: number;
  pendingBookings: number;
  userGrowth: number;
  revenueGrowth: number;
}

export interface AdminTripData extends TripDetail {
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Filter Types =====

export interface TripFilters {
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  duration?: string;
  destination?: string;
  search?: string;
  sortBy?: "price_asc" | "price_desc" | "date" | "rating" | "popularity";
}
