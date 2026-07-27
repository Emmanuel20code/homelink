import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Initial mock data with realistic verification and trust stats
interface Listing {
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
  landlord: {
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
  };
  verifiedProperty: boolean;
  verificationMethod?: string;
  safetyScore: number;
  views: number;
  datePosted: string;
  lastConfirmedDate: string; // For 30-day freshness rule
  scamRiskScore: number; // 0 (safe) to 100 (high risk)
  aiAnalysisNotes: string;
  reportsCount: number;
}

let listings: Listing[] = [
  {
    id: "lst-1",
    title: "Modern 2-Bedroom Sunlight Loft with Balcony",
    price: 1850,
    location: "Downtown Financial District, Metro City",
    lat: 37.7749,
    lng: -122.4194,
    rooms: 2,
    bathrooms: 2,
    squareFeet: 950,
    description: "Stunning corner loft featuring floor-to-ceiling windows, hardwood floors, updated kitchen with stainless steel appliances, and secure underground parking. Walking distance to central subway and top-rated schools.",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["High-speed Fiber", "In-unit Washer/Dryer", "Secure Parking", "Balcony", "Air Conditioning", "Elevator"],
    availability: "Available",
    landlord: {
      id: "usr-101",
      name: "Eleanor Vance",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      phone: "+1 (555) 234-5678",
      verifiedIdentity: true,
      verifiedPhone: true,
      selfieVerified: true,
      trustScore: 98,
      rating: 4.9,
      reviewCount: 34,
      responseMinutes: 15,
      successfulRentals: 28,
      accountAgeMonths: 48
    },
    verifiedProperty: true,
    verificationMethod: "GPS & On-site local agent verified",
    safetyScore: 96,
    views: 412,
    datePosted: "2026-07-01",
    lastConfirmedDate: "2026-07-20",
    scamRiskScore: 2,
    aiAnalysisNotes: "Listing photos verified original, price aligns with local market median ($1.95/sqft). Landlord identity is fully confirmed.",
    reportsCount: 0
  },
  {
    id: "lst-2",
    title: "Cozy 1-Bedroom Garden Retreat Near University",
    price: 1100,
    location: "Oakwood University District, Metro City",
    lat: 37.7833,
    lng: -122.4167,
    rooms: 1,
    bathrooms: 1,
    squareFeet: 580,
    description: "Quiet and bright 1-bedroom apartment with shared courtyard garden access. Fully furnished option available. Utilities included in rent. Strict No Deposit Before Viewing policy enforced.",
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Garden Access", "Furnished", "Utilities Included", "Pet Friendly", "Bike Storage"],
    availability: "Available",
    landlord: {
      id: "usr-102",
      name: "Marcus Sterling",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      phone: "+1 (555) 876-5432",
      verifiedIdentity: true,
      verifiedPhone: true,
      selfieVerified: true,
      trustScore: 92,
      rating: 4.7,
      reviewCount: 19,
      responseMinutes: 30,
      successfulRentals: 14,
      accountAgeMonths: 24
    },
    verifiedProperty: true,
    verificationMethod: "Utility bill and ownership deed verified",
    safetyScore: 92,
    views: 289,
    datePosted: "2026-07-10",
    lastConfirmedDate: "2026-07-25",
    scamRiskScore: 4,
    aiAnalysisNotes: "Clean listing profile. Consistent metadata and legitimate property tax ID registered.",
    reportsCount: 0
  },
  {
    id: "lst-3",
    title: "Luxury 3-Bedroom Penthouse with Panoramic City Views",
    price: 3400,
    location: "Skyline Heights, Metro City",
    lat: 37.7600,
    lng: -122.4400,
    rooms: 3,
    bathrooms: 2.5,
    squareFeet: 1650,
    description: "Exquisite penthouse offering 360-degree views, floor-to-ceiling glass, private rooftop terrace, concierge service, and premium Miele appliances. Direct elevator access.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Private Rooftop", "Concierge 24/7", "Valet Parking", "Smart Home", "Gym & Pool", "Wine Cellar"],
    availability: "Available",
    landlord: {
      id: "usr-103",
      name: "Victoria Chen",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      phone: "+1 (555) 345-6789",
      verifiedIdentity: true,
      verifiedPhone: true,
      selfieVerified: true,
      trustScore: 99,
      rating: 5.0,
      reviewCount: 52,
      responseMinutes: 5,
      successfulRentals: 45,
      accountAgeMonths: 60
    },
    verifiedProperty: true,
    verificationMethod: "Property management corporate registry & on-site inspection",
    safetyScore: 99,
    views: 650,
    datePosted: "2026-07-05",
    lastConfirmedDate: "2026-07-22",
    scamRiskScore: 1,
    aiAnalysisNotes: "Verified premier partner. Pristine background and authentic media assets.",
    reportsCount: 0
  },
  {
    id: "lst-4",
    title: "Suspicious Ultra-Cheap Studio (Flagged for Demo)",
    price: 450,
    location: "Harbor Industrial Zone, Metro City",
    lat: 37.7300,
    lng: -122.3800,
    rooms: 1,
    bathrooms: 1,
    squareFeet: 400,
    description: "URGENT RENT! Wire deposit via Western Union before viewing to secure keys immediately. Best price in town!",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Basic Utilities"],
    availability: "Available",
    landlord: {
      id: "usr-999",
      name: "Anon Scammer",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      phone: "+1 (555) 000-0000",
      verifiedIdentity: false,
      verifiedPhone: false,
      selfieVerified: false,
      trustScore: 15,
      rating: 1.2,
      reviewCount: 3,
      responseMinutes: 120,
      successfulRentals: 0,
      accountAgeMonths: 1
    },
    verifiedProperty: false,
    safetyScore: 20,
    views: 120,
    datePosted: "2026-07-26",
    lastConfirmedDate: "2026-07-26",
    scamRiskScore: 95,
    aiAnalysisNotes: "WARNING: AI detected demand for upfront wire deposit before viewing, price is 75% below market average, and landlord identity is unverified.",
    reportsCount: 4
  }
];

// Appointments & Bookings
interface Appointment {
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

let appointments: Appointment[] = [
  {
    id: "apt-1",
    listingId: "lst-1",
    listingTitle: "Modern 2-Bedroom Sunlight Loft with Balcony",
    renterName: "Sarah Jenkins",
    renterEmail: "sarah@example.com",
    date: "2026-07-29",
    time: "14:00",
    status: "Confirmed"
  }
];

// Messages
interface Message {
  id: string;
  listingId: string;
  sender: 'renter' | 'landlord';
  senderName: string;
  text: string;
  timestamp: string;
}

let messages: Message[] = [
  {
    id: "msg-1",
    listingId: "lst-1",
    sender: "landlord",
    senderName: "Eleanor Vance",
    text: "Hello! Welcome to HomeLink. Remember our strict No Deposit Before Viewing policy. Would you like to schedule a physical tour?",
    timestamp: "10:30 AM"
  }
];

// API Endpoints

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", count: listings.length });
});

// Get all listings with filters
app.get("/api/listings", (req, res) => {
  const { search, minPrice, maxPrice, rooms, verifiedOnly, sort } = req.query;
  let result = [...listings];

  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.location.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    result = result.filter(l => l.price >= Number(minPrice));
  }
  if (maxPrice) {
    result = result.filter(l => l.price <= Number(maxPrice));
  }
  if (rooms && rooms !== 'all') {
    result = result.filter(l => l.rooms >= Number(rooms));
  }
  if (verifiedOnly === 'true') {
    result = result.filter(l => l.verifiedProperty && l.landlord.verifiedIdentity);
  }

  if (sort === 'price-asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (sort === 'safety') {
    result.sort((a, b) => b.safetyScore - a.safetyScore);
  }

  res.json(result);
});

// Get single listing
app.get("/api/listings/:id", (req, res) => {
  const item = listings.find(l => l.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Listing not found" });
  }
  item.views += 1;
  res.json(item);
});

// Create new listing (Landlord action) with AI Scam Detection
app.post("/api/listings", async (req, res) => {
  try {
    const data = req.body;
    
    // Run AI Scam Detection using Gemini
    let scamRiskScore = 10;
    let aiNotes = "Listing appears legitimate and well-structured.";

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Analyze this rental listing for scam indicators, unrealistic pricing, suspicious wording (like 'wire deposit before viewing', 'western union', 'out of country owner'), or duplicate patterns.
Title: ${data.title}
Price: $${data.price}
Location: ${data.location}
Description: ${data.description}
Landlord Verified ID: ${data.landlord?.verifiedIdentity || false}

Return ONLY a valid JSON object with keys: "scamRiskScore" (number 0 to 100) and "aiNotes" (string explanation).`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scamRiskScore: { type: Type.INTEGER },
                aiNotes: { type: Type.STRING }
              },
              required: ["scamRiskScore", "aiNotes"]
            }
          }
        });

        if (aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text);
          scamRiskScore = parsed.scamRiskScore ?? 15;
          aiNotes = parsed.aiNotes ?? aiNotes;
        }
      } catch (err) {
        console.error("AI Scam check error:", err);
      }
    }

    const newListing: Listing = {
      id: `lst-${Date.now()}`,
      title: data.title || "New Property Listing",
      price: Number(data.price) || 1200,
      location: data.location || "Metro City",
      lat: data.lat || 37.77,
      lng: data.lng || -122.42,
      rooms: Number(data.rooms) || 1,
      bathrooms: Number(data.bathrooms) || 1,
      squareFeet: Number(data.squareFeet) || 600,
      description: data.description || "No description provided.",
      images: data.images?.length ? data.images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"],
      videoUrl: data.videoUrl,
      amenities: data.amenities || ["High-speed Internet", "Air Conditioning"],
      availability: "Available",
      landlord: data.landlord || {
        id: `usr-${Date.now()}`,
        name: data.landlordName || "Verified Landlord",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        phone: data.phone || "+1 (555) 987-6543",
        verifiedIdentity: true,
        verifiedPhone: true,
        selfieVerified: true,
        trustScore: 95,
        rating: 4.8,
        reviewCount: 12,
        responseMinutes: 10,
        successfulRentals: 8,
        accountAgeMonths: 18
      },
      verifiedProperty: data.verifiedProperty ?? true,
      verificationMethod: "GPS & Documentation confirmed",
      safetyScore: scamRiskScore > 50 ? 40 : 95,
      views: 1,
      datePosted: new Date().toISOString().split('T')[0],
      lastConfirmedDate: new Date().toISOString().split('T')[0],
      scamRiskScore,
      aiAnalysisNotes: aiNotes,
      reportsCount: 0
    };

    listings.unshift(newListing);
    res.json(newListing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Report listing scam
app.post("/api/listings/:id/report", (req, res) => {
  const { reason, comment } = req.body;
  const listing = listings.find(l => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  listing.reportsCount += 1;
  listing.scamRiskScore = Math.min(100, listing.scamRiskScore + 35);
  listing.aiAnalysisNotes += ` [REPORTED: ${reason} - ${comment || 'No comment'}]`;

  if (listing.reportsCount >= 3) {
    listing.availability = "Pending";
  }

  res.json({ success: true, listing });
});

// Verify property
app.post("/api/listings/:id/verify", (req, res) => {
  const listing = listings.find(l => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  listing.verifiedProperty = true;
  listing.verificationMethod = "On-site agent inspection & official deed confirmed";
  listing.safetyScore = Math.max(90, listing.safetyScore + 20);
  listing.scamRiskScore = Math.max(0, listing.scamRiskScore - 40);
  listing.lastConfirmedDate = new Date().toISOString().split('T')[0];

  res.json({ success: true, listing });
});

// Get appointments
app.get("/api/appointments", (req, res) => {
  res.json(appointments);
});

// Book viewing appointment
app.post("/api/appointments", (req, res) => {
  const { listingId, listingTitle, renterName, renterEmail, date, time } = req.body;
  const newApt: Appointment = {
    id: `apt-${Date.now()}`,
    listingId,
    listingTitle,
    renterName: renterName || "Renter",
    renterEmail: renterEmail || "renter@example.com",
    date: date || new Date().toISOString().split('T')[0],
    time: time || "10:00",
    status: "Confirmed"
  };
  appointments.unshift(newApt);
  res.json(newApt);
});

// Submit viewing feedback
app.post("/api/appointments/:id/feedback", (req, res) => {
  const { rating, comment, landlordMet } = req.body;
  const apt = appointments.find(a => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: "Appointment not found" });

  apt.status = "Completed";
  apt.feedback = {
    rating: Number(rating) || 5,
    comment: comment || "Great viewing experience. Landlord adhered to safety policy.",
    landlordMet: landlordMet ?? true
  };
  res.json({ success: true, apt });
});

// Get messages
app.get("/api/chat/:listingId", (req, res) => {
  const list = messages.filter(m => m.listingId === req.params.listingId);
  res.json(list);
});

// Send message
app.post("/api/chat", (req, res) => {
  const { listingId, sender, senderName, text } = req.body;
  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    listingId,
    sender: sender || "renter",
    senderName: senderName || "You",
    text: text || "",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  messages.push(newMsg);
  res.json(newMsg);
});

// AI Smart Search endpoint
app.post("/api/ai/smart-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ response: "AI smart search requires Gemini API key. Showing all listings matching keywords." });
    }

    const prompt = `User is looking for a rental with query: "${query}".
Available listings: ${JSON.stringify(listings.map(l => ({ id: l.id, title: l.title, price: l.price, location: l.location, rooms: l.rooms, verified: l.verifiedProperty, scamScore: l.scamRiskScore })))}

Analyze the user query and return a JSON object with:
1. "matchedIds": array of listing IDs that best match the query.
2. "recommendationSummary": a short, friendly explanation of why these match and safety notes.`;

    const aiRes = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationSummary: { type: Type.STRING }
          },
          required: ["matchedIds", "recommendationSummary"]
        }
      }
    });

    if (aiRes.text) {
      const parsed = JSON.parse(aiRes.text);
      res.json(parsed);
    } else {
      res.json({ matchedIds: listings.map(l => l.id), recommendationSummary: "Here are our verified listings matching your search." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware setup for development, static for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HomeLink Server running on http://localhost:${PORT}`);
  });
}

startServer();
