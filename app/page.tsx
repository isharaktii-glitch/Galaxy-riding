"use "use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic Imports for Leaflet (SSR Safe)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

const MapFlyTo = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const Component = ({
        bounds,
        center,
        zoom,
      }: {
        bounds?: [[number, number], [number, number]];
        center?: [number, number];
        zoom?: number;
      }) => {
        const map = mod.useMap();
        useEffect(() => {
          if (map) {
            if (bounds && bounds[0][0] !== bounds[1][0]) {
              map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            } else if (center && zoom) {
              map.flyTo(center, zoom, { animate: true, duration: 1.5 });
            }
          }
        }, [bounds, center, zoom, map]);
        return null;
      };
      return Component;
    }),
  { ssr: false }
);

// Types
type Language = "si" | "en" | "ta";
type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

interface User {
  id: string;
  name: string;
  phone: string;
  role: "driver" | "passenger";
  kycStatus: KycStatus;
  nicNumber?: string;
  licenseNumber?: string;
  vehicleType?: "Small Car/Nano" | "Sedan/Prius" | "Van/Mini Bus" | "Bike";
  vehicleModel?: string;
  vehicleNumber?: string;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Review {
  passengerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface RidePost {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  vehicleCategory: "Small Car/Nano" | "Sedan/Prius" | "Van/Mini Bus" | "Bike";
  seats: number;
  price: number;
  startName: string;
  startCoords: [number, number];
  endName: string;
  endCoords: [number, number];
  routePolyline: [number, number][];
  distanceKm: string;
  isLadiesOnly: boolean;
  status: "active" | "finished";
  aiShortcutAnalysis?: string;
  reviews?: Review[];
}

// Trilingual Translations Dictionary
const translations = {
  si: {
    title: "🌌 Galaxy Rides 3D",
    passenger: "🙋‍♂️ මගියා (Passenger)",
    driver: "🚗 රියදුරු (Driver)",
    login: "ඇතුළු වන්න (Login)",
    register: "ලියාපදිංචි වන්න (Register)",
    fullName: "සම්පූර්ණ නම",
    phone: "දුරකථන අංකය",
    password: "මුරපදය (Password)",
    logout: "ඉවත් වන්න (Logout)",
    kycWarning: "⚠️ ඔබ තවමත් Verified Driver කෙනෙක් නොවේ. Ride එකක් පළ කිරීමට පෙර ඔබගේ KYC තොරතුරු ලබා දී තහවුරු කරගන්න.",
    kycPendingNotice: "⏳ ඔබගේ KYC විස්තර පරීක්ෂා කරමින් පවතී (PENDING). පරිපාලක අනුමැතිය ලැබෙන තෙක් රැඳී සිටින්න.",
    kycRejectedNotice: "❌ ඔබගේ KYC විස්තර ප්‍රතික්ෂේප විය (REJECTED). කරුණාකර නිවැරදි විස්තර නැවත ඇතුළත් කරන්න.",
    fillKycBtn: "🪪 Driver KYC ලබා දෙන්න",
    kycModalTitle: "🪪 Driver KYC සත්‍යාපනය",
    nic: "ජාතික හැඳුනුම්පත් (NIC) අංකය",
    license: "රියදුරු බලපත්‍ර අංකය (Driving License)",
    vehicleType: "වාහන වර්ගය",
    vehicleModel: "වාහනයේ මාදිලිය (Model)",
    vehicleNum: "වාහන අංකය (උදා: CAD-1234)",
    submitKyc: "KYC විස්තර යොමු කරන්න (Submit)",
    editRide: "✏️ Ride Post එක සංස්කරණය කරන්න",
    publishRide: "🚗 අලුත් Route එකක් පළ කරන්න",
    startLoc: "ආරම්භක ස්ථානය (Start Location)",
    endLoc: "ගමනාන්තය (End Destination)",
    aiShortcutBtn: "🤖 AI මගින් කෙටිම මාර්ග සහ විස්තර ලබාගන්න",
    aiAnalyzing: "⏳ AI විසින් කෙටිම මාර්ග විශ්ලේෂණය කරමින් පවතී...",
    priceLkr: "ගාස්තුව (LKR)",
    seatsAvailable: "ආසන ගණන",
    saveChanges: "💾 වෙනස්කම් සුරකින්න",
    publishLive: "🚀 Route එක පළ කරන්න",
    myPostedRides: "📋 මා පළ කළ Rides",
    edit: "✏️ Edit",
    delete: "🗑️ Delete",
    markFinished: "✅ අවසන් කරන්න (Mark Finished)",
    finishedRidesArchive: "🏁 අවසන් වූ Rides ✅ Archive (මකා දැමිය නොහැක)",
    searchPassengerDest: "🏁 ඔබට යා යුතු ස්ථානය (End Point) Type කරන්න",
    rateAndReview: "⭐ Driver ට Rating / Comment එකක් දමන්න",
    rateDriverTitle: "⭐ Driver Rating",
    ratingStars: "ලකුණු (1-5 Stars)",
    commentFeedback: "අදහස් / Comments",
    submit: "ලබා දෙන්න (Submit)",
    cancel: "අවලංගු කරන්න (Cancel)",
    kmAway: "km දුරින් (End Point match)",
  },
  en: {
    title: "🌌 Galaxy Rides 3D",
    passenger: "🙋‍♂️️ Passenger",
    driver: "🚗 Driver",
    login: "Login",
    register: "Register",
    fullName: "Full Name",
    phone: "Phone Number",
    password: "Password",
    logout: "Logout",
    kycWarning: "⚠️ You are not a Verified Driver yet. Please complete your KYC verification to publish rides.",
    kycPendingNotice: "⏳ Your KYC verification is PENDING review. Please wait for approval.",
    kycRejectedNotice: "❌ Your KYC verification was REJECTED. Please re-submit valid details.",
    fillKycBtn: "🪪 Fill Driver KYC",
    kycModalTitle: "🪪 Driver KYC Verification",
    nic: "NIC Number",
    license: "Driving License Number",
    vehicleType: "Vehicle Category",
    vehicleModel: "Vehicle Model",
    vehicleNum: "Vehicle Number (e.g. CAD-1234)",
    submitKyc: "Submit KYC Details",
    editRide: "✏️ Edit Ride Post",
    publishRide: "🚗 Publish New Route",
    startLoc: "Start Location (Search)",
    endLoc: "End Destination (Search)",
    aiShortcutBtn: "🤖 AI Route Shortcut Analysis",
    aiAnalyzing: "⏳ AI Analyzing Shortest Routes...",
    priceLkr: "Price (LKR)",
    seatsAvailable: "Seats Available",
    saveChanges: "💾 Save Changes",
    publishLive: "🚀 Publish Route Live",
    myPostedRides: "📋 My Posted Rides",
    edit: "✏️ Edit",
    delete: "🗑️ Delete",
    markFinished: "✅ Mark Finished",
    finishedRidesArchive: "🏁 Finished Rides Archive (Non-deletable)",
    searchPassengerDest: "🏁 Search Your Destination (End Point)",
    rateAndReview: "⭐ Rate & Review Driver",
    rateDriverTitle: "⭐ Rate Driver",
    ratingStars: "Rating Stars (1-5)",
    commentFeedback: "Comment / Feedback",
    submit: "Submit",
    cancel: "Cancel",
    kmAway: "km away from destination",
  },
  ta: {
    title: "🌌 Galaxy Rides 3D",
    passenger: "🙋‍♂️ பயணி (Passenger)",
    driver: "🚗 ஓட்டுநர் (Driver)",
    login: "உள்நுழைக (Login)",
    register: "பதிவு செய்க (Register)",
    fullName: "முழு பெயர்",
    phone: "தொலைபேசி எண்",
    password: "கடவுச்சொல் (Password)",
    logout: "வெளியேறு (Logout)",
    kycWarning: "⚠️ நீங்கள் இன்னும் சரிபார்க்கப்பட்ட ஓட்டுநர் அல்ல. சவாரிகளைப் பதிவேற்ற KYC ஐப் பூர்த்தி செய்யவும்.",
    kycPendingNotice: "⏳ உங்கள் KYC சரிபார்ப்பு பரிசீலனையில் உள்ளது (PENDING). ஒப்புதலுக்கு காத்திருக்கவும்.",
    kycRejectedNotice: "❌ உங்கள் KYC நிராகரிக்கப்பட்டது (REJECTED). தயவுசெய்து சரியான விவரங்களை மீண்டும் சமர்ப்பிக்கவும்.",
    fillKycBtn: "🪪 Driver KYC பூர்த்தி செய்க",
    kycModalTitle: "🪪 Driver KYC சரிபார்ப்பு",
    nic: "தேசிய அடையாள அட்டை (NIC) எண்",
    license: "ஓட்டுநர் உரிம எண் (License No)",
    vehicleType: "வாகன வகை",
    vehicleModel: "வாகன மாதிரி (Model)",
    vehicleNum: "வாகன எண் (எ.கா. CAD-1234)",
    submitKyc: "KYC சமர்ப்பிக்கவும்",
    editRide: "✏️ Ride Post திருத்துக",
    publishRide: "🚗 புதிய வழியைப் பதிவேற்றுக",
    startLoc: "தொ தொடங்கும் இடம் (Start Location)",
    endLoc: "சேரும் இடம் (End Destination)",
    aiShortcutBtn: "🤖 AI குறுகிய வழியைக் கண்டறியவும்",
    aiAnalyzing: "⏳ AI பகுப்பாய்வு செய்கிறது...",
    priceLkr: "கட்டணம் (LKR)",
    seatsAvailable: "இருக்கைகள்",
    saveChanges: "💾 மாற்றங்களைச் சேமிக்கவும்",
    publishLive: "🚀 வழியைப் பதிவேற்றுக",
    myPostedRides: "📋 எனது சவாரிகள்",
    edit: "✏️ Edit",
    delete: "🗑️ Delete",
    markFinished: "✅ முடிந்தது என குறிக்கவும்",
    finishedRidesArchive: "🏁 முடிந்த சவாரிகள் (Archive)",
    searchPassengerDest: "🏁 நீங்கள் செல்லும் இடத்தை தட்டச்சு செய்க",
    rateAndReview: "⭐ ஓட்டுநருக்கு மதிப்பிடவும்",
    rateDriverTitle: "⭐ ஓட்டுநர் மதிப்பீடு",
    ratingStars: "நட்சத்திர மதிப்பீடு (1-5)",
    commentFeedback: "கருத்துகள் (Comment)",
    submit: "சமர்ப்பிக்கவும்",
    cancel: "ரத்து செய்",
    kmAway: "கி.மீ தூரத்தில்",
  },
};

// Haversine Distance Calculation (Km)
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GalaxyRidesApp() {
  const [lang, setLang] = useState<Language>("si");
  const t = translations[lang];

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger">("driver");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // KYC Modal States
  const [showKycModal, setShowKycModal] = useState(false);
  const [nicInput, setNicInput] = useState("");
  const [licenseInput, setLicenseInput] = useState("");
  const [vehTypeInput, setVehTypeInput] = useState<"Small Car/Nano" | "Sedan/Prius" | "Van/Mini Bus" | "Bike">("Sedan/Prius");
  const [vehModelInput, setVehModelInput] = useState("Toyota Prius");
  const [vehNumberInput, setVehNumberInput] = useState("CAD-5678");

  // Ride Form States
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [price, setPrice] = useState(1500);
  const [seats, setSeats] = useState(3);
  const [isLadiesOnly, setIsLadiesOnly] = useState(false);

  // Map & Location Search States
  const [startQuery, setStartQuery] = useState("Colombo Fort");
  const [startCoords, setStartCoords] = useState<[number, number]>([6.9344, 79.8428]);
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);

  const [endQuery, setEndQuery] = useState("Kandy Clock Tower");
  const [endCoords, setEndCoords] = useState<[number, number]>([7.2906, 80.6337]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);

  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]]>([
    [6.9344, 79.8428],
    [7.2906, 80.6337],
  ]);

  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>("");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Ride Posts & Review States
  const [ridePosts, setRidePosts] = useState<RidePost[]>([]);
  const [passengerEndQuery, setPassengerEndQuery] = useState("");
  const [passengerEndCoords, setPassengerEndCoords] = useState<[number, number] | null>(null);
  const [passengerEndSuggestions, setPassengerEndSuggestions] = useState<Suggestion[]>([]);

  const [ratingTargetPostId, setRatingTargetPostId] = useState<string | null>(null);
  const [starCount, setStarCount] = useState(5);
  const [commentText, setCommentText] = useState("");

  const [greenIcon, setGreenIcon] = useState<any>(null);
  const [redIcon, setRedIcon] = useState<any>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Leaflet Icons
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      const green = new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const red = new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      setGreenIcon(green);
      setRedIcon(red);
    });
  }, []);

  // Autosuggest Location Search (Nominatim API)
  const fetchSuggestions = (query: string, setFn: (s: Suggestion[]) => void) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 2) {
      setFn([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query + ", Sri Lanka"
          )}&limit=6&addressdetails=1`
        );
        const data = await res.json();
        setFn(data || []);
      } catch (err) {
        console.error("Autosuggest Error:", err);
      }
    }, 300);
  };

  const selectStartSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    setStartQuery(s.display_name);
    setStartCoords(coords);
    setStartSuggestions([]);
    updateRouteAndBounds(coords, endCoords);
  };

  const selectEndSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    setEndQuery(s.display_name);
    setEndCoords(coords);
    setEndSuggestions([]);
    updateRouteAndBounds(startCoords, coords);
  };

  const selectPassengerEndSuggestion = (s: Suggestion) => {
    const coords: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)];
    setPassengerEndQuery(s.display_name);
    setPassengerEndCoords(coords);
    setPassengerEndSuggestions([]);
  };

  // Real-time OSRM Routing
  const updateRouteAndBounds = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        const leafletCoords: [number, number][] = coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        setRoadRoute(leafletCoords);
        const distInKm = (data.routes[0].distance / 1000).toFixed(1);
        setRouteDistance(`${distInKm} km`);

        setMapBounds([
          [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
          [Math.max(start[0], end[0]), Math.max(start[1], end[1])],
        ]);
      } else {
        setRoadRoute([start, end]);
      }
    } catch (err) {
      setRoadRoute([start, end]);
    }
  };

  // AI-Powered Route Analysis
  const generateAiShortcuts = () => {
    setIsAiAnalyzing(true);
    setAiAnalysisResult("");

    setTimeout(() => {
      let shortcutAdvice = "";
      const veh = currentUser?.vehicleType || vehTypeInput;
      if (veh === "Van/Mini Bus") {
        shortcutAdvice = `🚐 Vehicle Type: Van/Mini Bus\n⚠️ WARNING: Stick strictly to A-Grade highways. Avoid narrow inner village shortcuts near ${endQuery.split(",")[0]}.\n🛣️ Recommended: Outer Circular Highway for smooth transit.`;
      } else if (veh === "Bike") {
        shortcutAdvice = `🏍️ Vehicle Type: Motorcycle\n⚡ Fast By-Pass Active: Can utilize narrow interior bypass lanes and beat traffic signals near main intersections. Saved ~18 mins.`;
      } else {
        shortcutAdvice = `🚗 Vehicle Type: Sedan / Small Car\n✅ AI Shortcut Detected: Use B-grade secondary connector roads to bypass heavy urban congestion near ${startQuery.split(",")[0]}. Watch for sharp turns.`;
      }

      setAiAnalysisResult(`🤖 AI Route Optimization:\n📍 Distance: ${routeDistance}\n${shortcutAdvice}`);
      setIsAiAnalyzing(false);
    }, 1200);
  };

  // Auth Handlers
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !passwordInput) return;

    const user: User = {
      id: "USR-" + Date.now().toString().slice(-4),
      name: nameInput || (selectedRole === "driver" ? "Driver User" : "Passenger User"),
      phone: phoneInput,
      role: selectedRole,
      kycStatus: selectedRole === "driver" ? "NOT_SUBMITTED" : "APPROVED",
    };
    setCurrentUser(user);
  };

  // KYC Submit Handler
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Simulate submitting KYC (Sets status to PENDING or APPROVED for demo)
    setCurrentUser({
      ...currentUser,
      kycStatus: "PENDING", // Change to "APPROVED" if you want instant approval
      nicNumber: nicInput,
      licenseNumber: licenseInput,
      vehicleType: vehTypeInput,
      vehicleModel: vehModelInput,
      vehicleNumber: vehNumberInput,
    });
    setShowKycModal(false);
    alert("✅ KYC Submitted Successfully! Verification Status is now PENDING.");
  };

  // Admin Quick Simulation to Approve Driver for testing
  const simulateAdminApproval = () => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, kycStatus: "APPROVED" });
    alert("🎉 Admin Simulation: Driver KYC has been APPROVED!");
  };

  // Driver Ride Actions
  const handlePublishOrUpdateRide = () => {
    if (!currentUser || currentUser.kycStatus !== "APPROVED") return;

    if (editingPostId) {
      setRidePosts((prev) =>
        prev.map((post) =>
          post.id === editingPostId
            ? {
                ...post,
                vehicle: currentUser.vehicleModel || vehModelInput,
                vehicleCategory: currentUser.vehicleType || vehTypeInput,
                seats,
                price,
                startName: startQuery,
                startCoords,
                endName: endQuery,
                endCoords,
                routePolyline: roadRoute,
                distanceKm: routeDistance,
                isLadiesOnly,
                aiShortcutAnalysis: aiAnalysisResult,
              }
            : post
        )
      );
      setEditingPostId(null);
      alert("✅ Ride Post Updated Successfully!");
    } else {
      const newRide: RidePost = {
        id: "RIDE-" + Date.now().toString().slice(-4),
        driverId: currentUser.id,
        driverName: currentUser.name,
        driverPhone: currentUser.phone,
        vehicle: currentUser.vehicleModel || vehModelInput,
        vehicleCategory: currentUser.vehicleType || vehTypeInput,
        seats,
        price,
        startName: startQuery,
        startCoords,
        endName: endQuery,
        endCoords,
        routePolyline: roadRoute.length > 0 ? roadRoute : [startCoords, endCoords],
        distanceKm: routeDistance || "N/A",
        isLadiesOnly,
        status: "active",
        aiShortcutAnalysis: aiAnalysisResult,
        reviews: [],
      };
      setRidePosts([newRide, ...ridePosts]);
      alert("🚀 Ride Route Published Live!");
    }
  };

  const handleEditPost = (post: RidePost) => {
    setEditingPostId(post.id);
    setPrice(post.price);
    setSeats(post.seats);
    setStartQuery(post.startName);
    setStartCoords(post.startCoords);
    setEndQuery(post.endName);
    setEndCoords(post.endCoords);
    setIsLadiesOnly(post.isLadiesOnly);
    setAiAnalysisResult(post.aiShortcutAnalysis || "");
    updateRouteAndBounds(post.startCoords, post.endCoords);
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Are you sure you want to delete this ride post?")) {
      setRidePosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleMarkAsFinished = (postId: string) => {
    setRidePosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, status: "finished" } : post))
    );
    alert("✅ Ride marked as Finished!");
  };

  // Review Submit
  const handleSubmitReview = () => {
    if (!ratingTargetPostId || !currentUser) return;

    const newReview: Review = {
      passengerName: currentUser.name,
      rating: starCount,
      comment: commentText,
      date: new Date().toLocaleDateString(),
    };

    setRidePosts((prev) =>
      prev.map((post) =>
        post.id === ratingTargetPostId
          ? { ...post, reviews: [...(post.reviews || []), newReview] }
          : post
      )
    );

    setRatingTargetPostId(null);
    setCommentText("");
    alert("🌟 Thank you for your review!");
  };

  // Destination Matching Engine (10km Radius)
  const filteredRides = passengerEndCoords
    ? ridePosts
        .filter((ride) => ride.status === "active")
        .map((ride) => {
          const distToDriverEnd = getDistanceInKm(
            passengerEndCoords[0],
            passengerEndCoords[1],
            ride.endCoords[0],
            ride.endCoords[1]
          );
          return { ...ride, distToPassengerEnd: distToDriverEnd };
        })
        .filter((ride) => ride.distToPassengerEnd <= 10)
        .sort((a, b) => a.distToPassengerEnd - b.distToPassengerEnd)
    : [];

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      {/* Language Switcher Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", background: "#1e293b", padding: "10px 20px", borderRadius: "10px", border: "1px solid #334155" }}>
        <span style={{ fontWeight: "bold", color: "#38bdf8" }}>🌐 Language / භාෂාව / மொழி:</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setLang("si")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: lang === "si" ? "#0284c7" : "#334155", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>සිංහල</button>
          <button onClick={() => setLang("en")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: lang === "en" ? "#0284c7" : "#334155", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>English</button>
          <button onClick={() => setLang("ta")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: lang === "ta" ? "#0284c7" : "#334155", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>தமிழ்</button>
        </div>
      </div>

      {/* Auth Screen */}
      {!currentUser ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155", width: "100%", maxWidth: "420px" }}>
            <h1 style={{ color: "#38bdf8", textAlign: "center", marginTop: 0 }}>{t.title}</h1>
            <div style={{ display: "flex", background: "#0f172a", padding: "4px", borderRadius: "8px", marginBottom: "20px" }}>
              <button type="button" onClick={() => setSelectedRole("driver")} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "driver" ? "#0284c7" : "transparent", color: "#fff" }}>{t.driver}</button>
              <button type="button" onClick={() => setSelectedRole("passenger")} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer", background: selectedRole === "passenger" ? "#0284c7" : "transparent", color: "#fff" }}>{t.passenger}</button>
            </div>
            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {authMode === "register" && (
                <input type="text" placeholder={t.fullName} value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
              )}
              <input type="text" placeholder={t.phone} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={{ padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
              <input type="password" placeholder={t.password} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} required />
              <button type="submit" style={{ padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>{authMode === "login" ? t.login : t.register}</button>
            </form>
            <p style={{ textAlign: "center", color: "#94a3b8", marginTop: "15px", cursor: "pointer", fontSize: "0.85rem" }} onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Main App Header */}
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#1e293b", padding: "15px 20px", borderRadius: "12px", border: "1px solid #334155" }}>
            <div>
              <h2 style={{ margin: 0, color: "#38bdf8" }}>{t.title}</h2>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
                {currentUser.name} | Status: <b style={{ color: currentUser.kycStatus === "APPROVED" ? "#4ade80" : "#f59e0b" }}>{currentUser.kycStatus}</b> ({currentUser.role.toUpperCase()})
              </p>
            </div>
            <button onClick={() => setCurrentUser(null)} style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>{t.logout}</button>
          </header>

          {/* DRIVER DASHBOARD */}
          {currentUser.role === "driver" && (
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              
              {/* KYC ALERT BOX & STATUS NOTICES */}
              {currentUser.kycStatus === "NOT_SUBMITTED" && (
                <div style={{ background: "#7f1d1d", border: "1px solid #ef4444", padding: "16px", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{t.kycWarning}</span>
                  <button onClick={() => setShowKycModal(true)} style={{ padding: "10px 16px", background: "#f59e0b", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>{t.fillKycBtn}</button>
                </div>
              )}

              {currentUser.kycStatus === "PENDING" && (
                <div style={{ background: "#78350f", border: "1px solid #f59e0b", padding: "16px", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{t.kycPendingNotice}</span>
                  <button onClick={simulateAdminApproval} style={{ padding: "8px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>[Demo: Simulate Admin Approve]</button>
                </div>
              )}

              {currentUser.kycStatus === "REJECTED" && (
                <div style={{ background: "#7f1d1d", border: "1px solid #ef4444", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
                  <span>{t.kycRejectedNotice}</span>
                  <button onClick={() => setShowKycModal(true)} style={{ marginLeft: "15px", padding: "8px 12px", background: "#f59e0b", color: "#000", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>{t.fillKycBtn}</button>
                </div>
              )}

              {/* RIDE PUBLISH / EDIT SECTION (LOCKED UNLESS KYC APPROVED) */}
              <div style={{ opacity: currentUser.kycStatus === "APPROVED" ? 1 : 0.4, pointerEvents: currentUser.kycStatus === "APPROVED" ? "auto" : "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                  <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
                    <h3 style={{ color: "#38bdf8", margin: "0 0 12px 0" }}>{editingPostId ? t.editRide : t.publishRide}</h3>

                    {/* Start Location Search */}
                    <div style={{ marginBottom: "12px", position: "relative" }}>
                      <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{t.startLoc}</label>
                      <input type="text" value={startQuery} onChange={(e) => { setStartQuery(e.target.value); fetchSuggestions(e.target.value, setStartSuggestions); }} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                      {startSuggestions.length > 0 && (
                        <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: 0, margin: "4px 0 0 0", zIndex: 1000, maxHeight: "160px", overflowY: "auto" }}>
                          {startSuggestions.map((item, idx) => (
                            <li key={idx} onClick={() => selectStartSuggestion(item)} style={{ padding: "8px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem" }}>📍 {item.display_name}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* End Location Search */}
                    <div style={{ marginBottom: "12px", position: "relative" }}>
                      <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{t.endLoc}</label>
                      <input type="text" value={endQuery} onChange={(e) => { setEndQuery(e.target.value); fetchSuggestions(e.target.value, setEndSuggestions); }} style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #38bdf8" }} />
                      {endSuggestions.length > 0 && (
                        <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "6px", listStyle: "none", padding: 0, margin: "4px 0 0 0", zIndex: 1000, maxHeight: "160px", overflowY: "auto" }}>
                          {endSuggestions.map((item, idx) => (
                            <li key={idx} onClick={() => selectEndSuggestion(item)} style={{ padding: "8px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem" }}>🏁 {item.display_name}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* AI Shortcut Button */}
                    <button onClick={generateAiShortcuts} disabled={isAiAnalyzing} style={{ width: "100%", padding: "10px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginBottom: "12px" }}>
                      {isAiAnalyzing ? t.aiAnalyzing : t.aiShortcutBtn}
                    </button>

                    {aiAnalysisResult && (
                      <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", border: "1px solid #8b5cf6", whiteSpace: "pre-wrap", fontSize: "0.85rem", marginBottom: "12px", color: "#c084fc" }}>
                        {aiAnalysisResult}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{t.priceLkr}</label>
                        <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{t.seatsAvailable}</label>
                        <input type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #475569" }} />
                      </div>
                    </div>

                    <button onClick={handlePublishOrUpdateRide} style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                      {editingPostId ? t.saveChanges : t.publishLive}
                    </button>
                  </div>

                  {/* Leaflet Map Integration */}
                  <div style={{ height: "460px", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
                    <MapContainer bounds={mapBounds} style={{ height: "100%", width: "100%" }}>
                      <MapFlyTo bounds={mapBounds} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {greenIcon && <Marker position={startCoords} icon={greenIcon}><Popup>🟢 Start: {startQuery}</Popup></Marker>}
                      {redIcon && <Marker position={endCoords} icon={redIcon}><Popup>🔴 End: {endQuery}</Popup></Marker>}
                      {roadRoute.length > 0 && <Polyline positions={roadRoute} pathOptions={{ color: "#2563eb", weight: 6 }} />}
                    </MapContainer>
                  </div>
                </div>

                {/* Active Rides List */}
                <h3 style={{ color: "#38bdf8" }}>{t.myPostedRides}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {ridePosts.filter((p) => p.driverId === currentUser.id && p.status === "active").map((post) => (
                    <div key={post.id} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: 0, color: "#38bdf8" }}>{post.startName} ➔ {post.endName}</h4>
                        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                          LKR {post.price} | {post.vehicle} ({post.distanceKm})
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleEditPost(post)} style={{ padding: "6px 12px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>{t.edit}</button>
                        <button onClick={() => handleDeletePost(post.id)} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>{t.delete}</button>
                        <button onClick={() => handleMarkAsFinished(post.id)} style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>{t.markFinished}</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Finished Rides Archive */}
                <h3 style={{ color: "#4ade80", marginTop: "30px" }}>{t.finishedRidesArchive}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {ridePosts.filter((p) => p.driverId === currentUser.id && p.status === "finished").map((post) => (
                    <div key={post.id} style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", border: "1px solid #16a34a" }}>
                      <h4 style={{ margin: 0, color: "#4ade80" }}>✅ COMPLETED: {post.startName} ➔ {post.endName}</h4>
                      <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#cbd5e1" }}>Passenger Reviews & Ratings:</p>
                      {post.reviews && post.reviews.length > 0 ? (
                        post.reviews.map((rev, idx) => (
                          <div key={idx} style={{ background: "#1e293b", padding: "8px", borderRadius: "6px", marginTop: "4px", fontSize: "0.85rem" }}>
                            ⭐ <b>{rev.rating}/5</b> by {rev.passengerName}: "{rev.comment}"
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No passenger comments yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASSENGER DASHBOARD */}
          {currentUser.role === "passenger" && (
            <div style={{ maxWidth: "950px", margin: "0 auto" }}>
              <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #334155" }}>
                <h3 style={{ color: "#38bdf8", margin: "0 0 12px 0" }}>{t.searchPassengerDest}</h3>
                <div style={{ position: "relative" }}>
                  <input type="text" placeholder="Type destination in Sri Lanka..." value={passengerEndQuery} onChange={(e) => { setPassengerEndQuery(e.target.value); fetchSuggestions(e.target.value, setPassengerEndSuggestions); }} style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #38bdf8", background: "#0f172a", color: "#fff" }} />
                  {passengerEndSuggestions.length > 0 && (
                    <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #38bdf8", borderRadius: "8px", listStyle: "none", padding: 0, margin: "4px 0 0 0", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                      {passengerEndSuggestions.map((item, idx) => (
                        <li key={idx} onClick={() => selectPassengerEndSuggestion(item)} style={{ padding: "10px", borderBottom: "1px solid #334155", cursor: "pointer", fontSize: "0.85rem" }}>🗺️ {item.display_name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Matched Drivers (10km Radius) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredRides.map((ride: any) => (
                  <div key={ride.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, color: "#38bdf8" }}>{ride.driverName}</h4>
                        <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#94a3b8" }}>🚗 {ride.vehicle} | 📞 {ride.driverPhone}</p>
                      </div>
                      <span style={{ background: "#16a34a", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                        📍 {ride.distToPassengerEnd.toFixed(1)} {t.kmAway}
                      </span>
                    </div>
                    <p style={{ color: "#cbd5e1", margin: "8px 0" }}><b>Route:</b> {ride.startName} ➔ {ride.endName}</p>
                    <button onClick={() => setRatingTargetPostId(ride.id)} style={{ padding: "8px 14px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" }}>
                      {t.rateAndReview}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEDICATED KYC MODAL */}
          {showKycModal && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000 }}>
              <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", width: "420px", border: "1px solid #38bdf8" }}>
                <h3 style={{ color: "#38bdf8", marginTop: 0 }}>{t.kycModalTitle}</h3>
                <form onSubmit={handleKycSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{t.nic}</label>
                    <input type="text" value={nicInput} onChange={(e) => setNicInput(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{t.license}</label>
                    <input type="text" value={licenseInput} onChange={(e) => setLicenseInput(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{t.vehicleType}</label>
                    <select value={vehTypeInput} onChange={(e) => setVehTypeInput(e.target.value as any)} style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }}>
                      <option value="Sedan/Prius">Sedan / Hybrid Car</option>
                      <option value="Small Car/Nano">Small Car / Alto / Nano</option>
                      <option value="Van/Mini Bus">Van / Mini Bus</option>
                      <option value="Bike">Motorcycle / Bike</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{t.vehicleModel}</label>
                    <input type="text" value={vehModelInput} onChange={(e) => setVehModelInput(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>{t.vehicleNum}</label>
                    <input type="text" value={vehNumberInput} onChange={(e) => setVehNumberInput(e.target.value)} required style={{ width: "100%", padding: "8px", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button type="submit" style={{ flex: 1, padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>{t.submitKyc}</button>
                    <button type="button" onClick={() => setShowKycModal(false)} style={{ flex: 1, padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>{t.cancel}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PASSENGER RATING MODAL */}
          {ratingTargetPostId && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000 }}>
              <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", width: "350px", border: "1px solid #38bdf8" }}>
                <h3 style={{ color: "#38bdf8", marginTop: 0 }}>{t.rateDriverTitle}</h3>
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{t.ratingStars}</label>
                <input type="number" min="1" max="5" value={starCount} onChange={(e) => setStarCount(Number(e.target.value))} style={{ width: "100%", padding: "8px", margin: "6px 0 12px 0", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{t.commentFeedback}</label>
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ width: "100%", padding: "8px", margin: "6px 0 16px 0", background: "#0f172a", color: "#fff", border: "1px solid #475569", borderRadius: "6px" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleSubmitReview} style={{ flex: 1, padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>{t.submit}</button>
                  <button onClick={() => setRatingTargetPostId(null)} style={{ flex: 1, padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>{t.cancel}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
