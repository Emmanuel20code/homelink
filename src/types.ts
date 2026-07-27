export interface Landlord {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  verifiedIdentity: boolean;
  verifiedPhone: boolean;
  selfieVerified: boolean;
  trustScore: number;
  rating: number;
  reviewCount: number;
  responseMinutes: number;
  successfulRentals: number;
  accountAgeMonths: number;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  lat: number;
  lng: number;
  rooms: number;
  bathrooms: number;
  squareFeet: number;
  description: string;
  images: string[];
  videoUrl?: string;
  amenities: string[];
  availability: 'Available' | 'Rented' | 'Pending';
  landlord: Landlord;
  verifiedProperty: boolean;
  verificationMethod?: string;
  safetyScore: number;
  views: number;
  datePosted: string;
  lastConfirmedDate: string;
  scamRiskScore: number;
  aiAnalysisNotes: string;
  reportsCount: number;
}

export interface Appointment {
  id: string;
  listingId: string;
  listingTitle: string;
  renterName: string;
  renterEmail: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  feedback?: {
    rating: number;
    comment: string;
    landlordMet: boolean;
  };
}

export interface Message {
  id: string;
  listingId: string;
  sender: 'renter' | 'landlord';
  senderName: string;
  text: string;
  timestamp: string;
}
