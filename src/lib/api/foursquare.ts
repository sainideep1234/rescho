// ─────────────────────────────────────────────────────────────────────────────
// src/lib/api/foursquare.ts — Fetches nearby restaurants from Foursquare.
//
// Flow:
//   1. The socket server calls searchRestaurants(lat, lng, limit).
//   2. This file sends a request to Foursquare's Places API.
//   3. The raw API results are cleaned up and returned as Restaurant objects.
//   4. If the API key is missing or the request fails, we return mock data
//      so the app still works during development.
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";
import { Restaurant } from "@/types";

// ─── API configuration ───────────────────────────────────────────────────────

// The API key is read from the environment file (.env.local).
// It is intentionally NOT hardcoded here so it doesn't leak to the public.
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

const FOURSQUARE_BASE_URL = "https://places-api.foursquare.com";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript shape of a single place returned by the Foursquare API.
// We only list the fields we actually use; the API may return more.
// ─────────────────────────────────────────────────────────────────────────────
interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    formatted_address?: string;
  };
  categories: Array<{
    fsq_category_id: string;
    name: string;
    short_name?: string;
    icon: {
      prefix: string; // URL fragment before the size, e.g. "https://ss3.4sqi.net/img/categories_v2/food/"
      suffix: string; // URL fragment after the size, e.g. ".png"
    };
  }>;
  distance?: number; // Distance from the search point, in metres.
  rating?: number; // 0–10 score.
  price?: number; // 1 = cheap … 4 = expensive.
  tel?: string;
  website?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// searchRestaurants  (the main exported function)
//
// Parameters:
//   lat, lng — GPS coordinates of the user's chosen location.
//   limit    — maximum number of restaurants to return (default 15).
//
// Returns a Promise that resolves to an array of Restaurant objects.
// ─────────────────────────────────────────────────────────────────────────────
export async function searchRestaurants(
  lat: number,
  lng: number,
  limit: number = 15,
): Promise<Restaurant[]> {
  // If no API key is set, skip the network request entirely.
  if (!FOURSQUARE_API_KEY) {
    console.warn("Foursquare API key not configured — using mock data.");
    return getMockRestaurants();
  }

  try {
    // We give the API a maximum of 4 seconds to respond.
    // AbortController lets us cancel the request if it takes too long.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await axios.get<{ results: FoursquarePlace[] }>(
      `${FOURSQUARE_BASE_URL}/places/search`,
      {
        // Authentication and version headers required by Foursquare.
        headers: {
          Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
          Accept: "application/json",
          "X-Places-Api-Version": "2025-06-17",
        },
        // Query parameters appended to the URL.
        params: {
          ll: `${lat},${lng}`, // "latitude,longitude" format.
          query: "restaurant",
          limit,
          sort: "DISTANCE", // Return closest restaurants first.
        },
        signal: controller.signal, // Lets AbortController cancel this request.
        timeout: 4000,
      },
    );

    // Clear the manual timeout since the request finished in time.
    clearTimeout(timeoutId);

    const places = response.data.results;

    // Convert each raw Foursquare place into the app's Restaurant format.
    const restaurants = places.map((place) => buildRestaurant(place));

    console.log(`Foursquare returned ${restaurants.length} restaurants.`);

    // If for some reason the API returned zero results, fall back to mock data.
    return restaurants.length > 0 ? restaurants : getMockRestaurants();
  } catch (error) {
    // Network error, timeout, bad API key, etc. — just use the mock list.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Foursquare API failed (${message}) — using mock data.`);
    return getMockRestaurants();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getCategoryIconUrl
//
// Builds a full icon image URL from the Foursquare category icon object.
//
// Foursquare splits icon URLs into a prefix and a suffix so you can choose
// the image size. We request the 120-pixel "bg_" variant (a background-style
// icon with a coloured tile behind it).
//
// Example:  prefix = "https://ss3.4sqi.net/img/categories_v2/food/italian_"
//           suffix = ".png"
//           result = "https://ss3.4sqi.net/img/categories_v2/food/italian_bg_120.png"
// ─────────────────────────────────────────────────────────────────────────────
function getCategoryIconUrl(place: FoursquarePlace): string {
  const icon = place.categories?.[0]?.icon;

  if (icon?.prefix && icon?.suffix) {
    return `${icon.prefix}bg_120${icon.suffix}`;
  }

  // If no icon is available, use Foursquare's generic food icon.
  return "https://ss3.4sqi.net/img/categories_v2/food/default_bg_120.png";
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour palettes — one CSS gradient per cuisine type.
//
// These are used as card backgrounds when no photo is available.
// The gradient goes from top-left (light) to bottom-right (dark).
// ─────────────────────────────────────────────────────────────────────────────
const CUISINE_GRADIENTS: Record<string, string> = {
  Indian: "linear-gradient(135deg, #ff6b35 0%, #d32f2f 50%, #c62828 100%)",
  Chinese: "linear-gradient(135deg, #e53935 0%, #c62828 50%, #b71c1c 100%)",
  Japanese: "linear-gradient(135deg, #ec407a 0%, #c2185b 50%, #880e4f 100%)",
  Italian: "linear-gradient(135deg, #43a047 0%, #2e7d32 50%, #1b5e20 100%)",
  Pizza: "linear-gradient(135deg, #ff8f00 0%, #f57f17 50%, #e65100 100%)",
  Mexican: "linear-gradient(135deg, #f4511e 0%, #d84315 50%, #bf360c 100%)",
  Thai: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 50%, #4a148c 100%)",
  French: "linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #0d47a1 100%)",
  Mediterranean:
    "linear-gradient(135deg, #00897b 0%, #00695c 50%, #004d40 100%)",
  American: "linear-gradient(135deg, #5d4037 0%, #4e342e 50%, #3e2723 100%)",
  "Fast Food": "linear-gradient(135deg, #fdd835 0%, #f9a825 50%, #f57f17 100%)",
  Burger: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 50%, #4e342e 100%)",
  Sandwich: "linear-gradient(135deg, #ffb300 0%, #ff8f00 50%, #e65100 100%)",
  Cafe: "linear-gradient(135deg, #795548 0%, #5d4037 50%, #3e2723 100%)",
  Coffee: "linear-gradient(135deg, #6d4c41 0%, #4e342e 50%, #3e2723 100%)",
  Seafood: "linear-gradient(135deg, #0277bd 0%, #01579b 50%, #004c8c 100%)",
  BBQ: "linear-gradient(135deg, #d84315 0%, #bf360c 50%, #8d2208 100%)",
  Korean: "linear-gradient(135deg, #c62828 0%, #b71c1c 50%, #880e4f 100%)",
  Vietnamese: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 50%, #0d4f13 100%)",
  Greek: "linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #002171 100%)",
  Steakhouse: "linear-gradient(135deg, #4e342e 0%, #3e2723 50%, #1b0000 100%)",
  Brunch: "linear-gradient(135deg, #ff8a65 0%, #ff7043 50%, #f4511e 100%)",
  default: "linear-gradient(135deg, #37474f 0%, #263238 50%, #1a1a2e 100%)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Emoji lookup — one emoji per cuisine type for the card overlay.
// ─────────────────────────────────────────────────────────────────────────────
const CUISINE_EMOJIS: Record<string, string> = {
  Indian: "🍛",
  Chinese: "🥡",
  Japanese: "🍣",
  Italian: "🍝",
  Pizza: "🍕",
  Mexican: "🌮",
  Thai: "🍜",
  French: "🥐",
  Mediterranean: "🫒",
  American: "🍔",
  "Fast Food": "🍟",
  Burger: "🍔",
  Sandwich: "🥪",
  Cafe: "☕",
  Coffee: "☕",
  Seafood: "🦐",
  BBQ: "🥩",
  Korean: "🍲",
  Vietnamese: "🍜",
  Greek: "🥗",
  Steakhouse: "🥩",
  Brunch: "🥞",
  default: "🍽️",
};

// ─────────────────────────────────────────────────────────────────────────────
// getCuisineGradient
//
// Returns the CSS gradient string for a given cuisine name.
// First tries an exact match, then looks for a partial match, then defaults.
// ─────────────────────────────────────────────────────────────────────────────
function getCuisineGradient(cuisineName: string): string {
  // Exact match (e.g. "Italian").
  if (CUISINE_GRADIENTS[cuisineName]) return CUISINE_GRADIENTS[cuisineName];

  // Partial match — useful for names like "Japanese Ramen" or "Korean BBQ".
  const lowerName = cuisineName.toLowerCase();
  for (const [key, gradient] of Object.entries(CUISINE_GRADIENTS)) {
    const lowerKey = key.toLowerCase();
    if (lowerName.includes(lowerKey) || lowerKey.includes(lowerName)) {
      return gradient;
    }
  }

  return CUISINE_GRADIENTS["default"];
}

// ─────────────────────────────────────────────────────────────────────────────
// getCuisineEmoji — same lookup logic as getCuisineGradient.
// ─────────────────────────────────────────────────────────────────────────────
function getCuisineEmoji(cuisineName: string): string {
  if (CUISINE_EMOJIS[cuisineName]) return CUISINE_EMOJIS[cuisineName];

  const lowerName = cuisineName.toLowerCase();
  for (const [key, emoji] of Object.entries(CUISINE_EMOJIS)) {
    const lowerKey = key.toLowerCase();
    if (lowerName.includes(lowerKey) || lowerKey.includes(lowerName)) {
      return emoji;
    }
  }

  return CUISINE_EMOJIS["default"];
}

// ─────────────────────────────────────────────────────────────────────────────
// buildRestaurant
//
// Converts one raw Foursquare place into the Restaurant shape our app uses.
// This keeps the rest of the app isolated from Foursquare-specific field names.
// ─────────────────────────────────────────────────────────────────────────────
function buildRestaurant(place: FoursquarePlace): Restaurant {
  const primaryCategory = place.categories?.[0];

  // Use the short category name if available (e.g. "Pizza" instead of "Pizza Restaurant").
  const cuisineName =
    primaryCategory?.short_name || primaryCategory?.name || "Restaurant";

  // Build the address string — try each field in order until we find one.
  const address =
    place.location?.formatted_address ||
    place.location?.address ||
    [place.location?.locality, place.location?.region]
      .filter(Boolean)
      .join(", ") ||
    "Address not available";

  // Price level: 1 → "$", 2 → "$$", etc.
  const priceLevel = place.price
    ? (["$", "$$", "$$$", "$$$$"] as const)[place.price - 1]
    : undefined;

  return {
    id: place.fsq_place_id,
    name: place.name,
    description: buildDescription(place),
    cuisine: cuisineName,
    image: getCategoryIconUrl(place),
    gradient: getCuisineGradient(cuisineName),
    emoji: getCuisineEmoji(cuisineName),
    address,
    distance: place.distance,
    rating: place.rating,
    priceLevel,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildDescription
//
// Creates a short one-line description like "Italian • 0.5km away • 8.5/10".
// We build the parts separately and join them with " • " as a separator.
// ─────────────────────────────────────────────────────────────────────────────
function buildDescription(place: FoursquarePlace): string {
  const parts: string[] = [];

  if (place.categories?.[0]?.name) {
    parts.push(place.categories[0].name);
  }

  if (place.distance) {
    const km = (place.distance / 1000).toFixed(1);
    parts.push(`${km}km away`);
  }

  if (place.rating) {
    parts.push(`${place.rating}/10 rating`);
  }

  return parts.join(" • ") || "A local restaurant";
}

// ─────────────────────────────────────────────────────────────────────────────
// getMockRestaurants
//
// Returns a hardcoded list of 15 restaurants.
// Used in two situations:
//   1. The FOURSQUARE_API_KEY environment variable is not set.
//   2. The real API request fails (network error, timeout, etc.).
// ─────────────────────────────────────────────────────────────────────────────
function getMockRestaurants(): Restaurant[] {
  const mockList: Restaurant[] = [
    {
      id: "mock-1",
      name: "The Golden Fork",
      description: "Italian • 0.5km away • 8.5/10 rating",
      cuisine: "Italian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/italian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Italian"],
      emoji: CUISINE_EMOJIS["Italian"],
      address: "123 Main Street",
      distance: 500,
      rating: 8.5,
      priceLevel: "$$",
    },
    {
      id: "mock-2",
      name: "Sakura Sushi",
      description: "Japanese • 0.8km away • 9.0/10 rating",
      cuisine: "Japanese",
      image: "https://ss3.4sqi.net/img/categories_v2/food/sushi_bg_120.png",
      gradient: CUISINE_GRADIENTS["Japanese"],
      emoji: CUISINE_EMOJIS["Japanese"],
      address: "456 Oak Avenue",
      distance: 800,
      rating: 9.0,
      priceLevel: "$$$",
    },
    {
      id: "mock-3",
      name: "Taco Paradise",
      description: "Mexican • 0.3km away • 8.0/10 rating",
      cuisine: "Mexican",
      image: "https://ss3.4sqi.net/img/categories_v2/food/mexican_bg_120.png",
      gradient: CUISINE_GRADIENTS["Mexican"],
      emoji: CUISINE_EMOJIS["Mexican"],
      address: "789 Elm Street",
      distance: 300,
      rating: 8.0,
      priceLevel: "$",
    },
    {
      id: "mock-4",
      name: "Le Petit Bistro",
      description: "French • 1.2km away • 9.2/10 rating",
      cuisine: "French",
      image: "https://ss3.4sqi.net/img/categories_v2/food/french_bg_120.png",
      gradient: CUISINE_GRADIENTS["French"],
      emoji: CUISINE_EMOJIS["French"],
      address: "321 Pine Road",
      distance: 1200,
      rating: 9.2,
      priceLevel: "$$$$",
    },
    {
      id: "mock-5",
      name: "Dragon Palace",
      description: "Chinese • 0.6km away • 8.8/10 rating",
      cuisine: "Chinese",
      image: "https://ss3.4sqi.net/img/categories_v2/food/asian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Chinese"],
      emoji: CUISINE_EMOJIS["Chinese"],
      address: "654 Maple Lane",
      distance: 600,
      rating: 8.8,
      priceLevel: "$$",
    },
    {
      id: "mock-6",
      name: "Spice Garden",
      description: "Indian • 0.9km away • 8.7/10 rating",
      cuisine: "Indian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/indian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Indian"],
      emoji: CUISINE_EMOJIS["Indian"],
      address: "987 Cedar Court",
      distance: 900,
      rating: 8.7,
      priceLevel: "$$",
    },
    {
      id: "mock-7",
      name: "The Burger Joint",
      description: "American • 0.4km away • 7.9/10 rating",
      cuisine: "American",
      image: "https://ss3.4sqi.net/img/categories_v2/food/burger_bg_120.png",
      gradient: CUISINE_GRADIENTS["American"],
      emoji: CUISINE_EMOJIS["American"],
      address: "147 Birch Boulevard",
      distance: 400,
      rating: 7.9,
      priceLevel: "$",
    },
    {
      id: "mock-8",
      name: "Mediterranean Oasis",
      description: "Mediterranean • 1.0km away • 8.6/10 rating",
      cuisine: "Mediterranean",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/mediterranean_bg_120.png",
      gradient: CUISINE_GRADIENTS["Mediterranean"],
      emoji: CUISINE_EMOJIS["Mediterranean"],
      address: "258 Walnut Way",
      distance: 1000,
      rating: 8.6,
      priceLevel: "$$$",
    },
    {
      id: "mock-9",
      name: "Thai Orchid",
      description: "Thai • 0.7km away • 8.9/10 rating",
      cuisine: "Thai",
      image: "https://ss3.4sqi.net/img/categories_v2/food/thai_bg_120.png",
      gradient: CUISINE_GRADIENTS["Thai"],
      emoji: CUISINE_EMOJIS["Thai"],
      address: "369 Spruce Street",
      distance: 700,
      rating: 8.9,
      priceLevel: "$$",
    },
    {
      id: "mock-10",
      name: "Pasta House",
      description: "Italian • 1.5km away • 8.3/10 rating",
      cuisine: "Italian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/italian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Italian"],
      emoji: CUISINE_EMOJIS["Italian"],
      address: "741 Ash Avenue",
      distance: 1500,
      rating: 8.3,
      priceLevel: "$$",
    },
    {
      id: "mock-11",
      name: "Seoul Kitchen",
      description: "Korean BBQ • 0.4km away • 9.1/10 rating",
      cuisine: "Korean BBQ",
      image: "https://ss3.4sqi.net/img/categories_v2/food/korean_bg_120.png",
      gradient: CUISINE_GRADIENTS["Korean"],
      emoji: CUISINE_EMOJIS["Korean"],
      address: "82 Willow Drive",
      distance: 400,
      rating: 9.1,
      priceLevel: "$$",
    },
    {
      id: "mock-12",
      name: "Ember & Oak",
      description: "Steakhouse • 1.3km away • 9.3/10 rating",
      cuisine: "Steakhouse",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/steakhouse_bg_120.png",
      gradient: CUISINE_GRADIENTS["Steakhouse"],
      emoji: CUISINE_EMOJIS["Steakhouse"],
      address: "14 Harbour Lane",
      distance: 1300,
      rating: 9.3,
      priceLevel: "$$$$",
    },
    {
      id: "mock-13",
      name: "Brunch & Co.",
      description: "Brunch • 0.2km away • 8.4/10 rating",
      cuisine: "Brunch",
      image: "https://ss3.4sqi.net/img/categories_v2/food/breakfast_bg_120.png",
      gradient: CUISINE_GRADIENTS["Brunch"],
      emoji: CUISINE_EMOJIS["Brunch"],
      address: "5 Morning Circle",
      distance: 200,
      rating: 8.4,
      priceLevel: "$$",
    },
    {
      id: "mock-14",
      name: "Pho Saigon",
      description: "Vietnamese • 0.6km away • 8.8/10 rating",
      cuisine: "Vietnamese",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/vietnamese_bg_120.png",
      gradient: CUISINE_GRADIENTS["Vietnamese"],
      emoji: CUISINE_EMOJIS["Vietnamese"],
      address: "210 Lotus Road",
      distance: 600,
      rating: 8.8,
      priceLevel: "$",
    },
    {
      id: "mock-15",
      name: "Naan & Curry",
      description: "Indian • 0.5km away • 8.6/10 rating",
      cuisine: "Indian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/indian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Indian"],
      emoji: CUISINE_EMOJIS["Indian"],
      address: "99 Spice Avenue",
      distance: 500,
      rating: 8.6,
      priceLevel: "$$",
    },
  ];

  return mockList;
}
