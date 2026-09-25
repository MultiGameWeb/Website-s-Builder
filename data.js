const BOOKSTORE_DEFAULT_DATA = {
  settings: {
    brand: "Golden Leaf Books",
    tagline: "Stories worth holding.",
    heroHeading: "Discover your next favourite book",
    heroText: "A premium reusable bookstore storefront for printed books, thoughtful gifts and timeless stories.",
    supportText: "Support: Mon-Sat, 9:00 AM - 6:00 PM",
    currency: "₹",
    deliveryEnabled: true,
    deliveryPerKm: 12,
    minimumDeliveryFee: 40,
    freeDeliveryThreshold: 999,
    codEnabled: true,
    whatsapp: "919999999999",
    phone: "+91 99999 99999",
    locationLabel: "Visit our bookstore",
    mapsUrl: "https://maps.google.com/?q=Hyderabad,Telangana",
    address: "Hyderabad, Telangana, India",
    seoTitle: "Golden Leaf Books | Printed Books Online",
    seoDescription: "Shop printed books from Golden Leaf Books. Browse, order and enquire with ease.",
    seoKeywords: "books, bookstore, printed books, novels, education books",
    socialImage: ""
  },
  offer: {
    enabled: true,
    type: "percent",
    value: 10,
    minimumPurchase: 500,
    freeItemPriceCap: 500,
    text: "10% off on orders above ₹500"
  },
  books: [
    {
      id: "atomic-habits",
      title: "Atomic Habits",
      author: "James Clear",
      price: 499,
      format: "Paperback",
      category: "Self Help",
      stock: 14,
      rating: 4.8,
      reviews: 420,
      amazonUrl: "https://www.amazon.in/s?k=Atomic+Habits",
      cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7b?auto=format&fit=crop&w=900&q=80",
      description: "A practical guide to building good habits, breaking bad ones and making small changes that compound over time.",
      active: true,
      featured: true
    },
    {
      id: "the-alchemist",
      title: "The Alchemist",
      author: "Paulo Coelho",
      price: 299,
      format: "Paperback",
      category: "Fiction",
      stock: 21,
      rating: 4.7,
      reviews: 315,
      amazonUrl: "https://www.amazon.in/s?k=The+Alchemist+Paulo+Coelho",
      cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
      description: "A philosophical novel about following dreams, listening to the heart and finding meaning on a journey.",
      active: true,
      featured: true
    },
    {
      id: "ikigai",
      title: "Ikigai",
      author: "Héctor García & Francesc Miralles",
      price: 349,
      format: "Paperback",
      category: "Lifestyle",
      stock: 18,
      rating: 4.6,
      reviews: 268,
      amazonUrl: "https://www.amazon.in/s?k=Ikigai+book",
      cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80",
      description: "An accessible introduction to the Japanese idea of purpose, balance, longevity and meaningful daily living.",
      active: true,
      featured: false
    },
    {
      id: "deep-work",
      title: "Deep Work",
      author: "Cal Newport",
      price: 429,
      format: "Paperback",
      category: "Productivity",
      stock: 9,
      rating: 4.7,
      reviews: 197,
      amazonUrl: "https://www.amazon.in/s?k=Deep+Work+Cal+Newport",
      cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
      description: "Strategies for focused work in a distracted world, designed to improve quality and speed of learning.",
      active: true,
      featured: false
    },
    {
      id: "rich-dad-poor-dad",
      title: "Rich Dad Poor Dad",
      author: "Robert T. Kiyosaki",
      price: 379,
      format: "Paperback",
      category: "Finance",
      stock: 0,
      rating: 4.5,
      reviews: 502,
      amazonUrl: "https://www.amazon.in/s?k=Rich+Dad+Poor+Dad",
      cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
      description: "A popular personal-finance book exploring how different attitudes toward money can shape financial habits.",
      active: true,
      featured: false
    },
    {
      id: "the-power-of-now",
      title: "The Power of Now",
      author: "Eckhart Tolle",
      price: 399,
      format: "Paperback",
      category: "Mindfulness",
      stock: 7,
      rating: 4.6,
      reviews: 286,
      amazonUrl: "https://www.amazon.in/s?k=The+Power+of+Now",
      cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
      description: "A reflective guide to presence, attention and reducing the mental noise of everyday life.",
      active: true,
      featured: true
    }
  ],
  gallery: [
    { id: "g1", title: "Store shelf", url: "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1200&q=80" },
    { id: "g2", title: "Reading corner", url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80" },
    { id: "g3", title: "New arrivals", url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80" },
    { id: "g4", title: "Book stack", url: "https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&w=1200&q=80" }
  ],
  enquiries: [],
  orders: [],
  analytics: [],
  admin: { pin: "1234" },
  ui: { selectedCategory: "all" }
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStoreData() {
  try {
    const raw = localStorage.getItem("bookstore_demo_data");
    return raw ? JSON.parse(raw) : deepClone(BOOKSTORE_DEFAULT_DATA);
  } catch (error) {
    console.warn("Unable to read bookstore data; using defaults.", error);
    return deepClone(BOOKSTORE_DEFAULT_DATA);
  }
}

function saveStoreData(data) {
  localStorage.setItem("bookstore_demo_data", JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("bookstore:data-updated", { detail: data }));
  return data;
}

function resetStoreData() {
  const fresh = deepClone(BOOKSTORE_DEFAULT_DATA);
  saveStoreData(fresh);
  return fresh;
}

window.BookstoreData = {
  defaults: deepClone(BOOKSTORE_DEFAULT_DATA),
  get: getStoreData,
  save: saveStoreData,
  reset: resetStoreData
};
