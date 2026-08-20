// Hardcoded garage hub locations.
// Mechanics pick one of these FIXED hubs as their garage location during onboarding.
// Customers are matched to mechanics by real GPS distance from these coordinates.

import { calculateDistanceKm } from "../utils/etaService";

export const GARAGE_HUBS = {
  Bengaluru: [
    { id: "bengaluru-indiranagar", name: "100 Feet Road Auto Care", area: "Indiranagar", lat: 12.9784, lng: 77.6408 },
    { id: "bengaluru-koramangala", name: "Koramangala Garage Works", area: "Koramangala", lat: 12.9279, lng: 77.6271 },
    { id: "bengaluru-whitefield", name: "Whitefield Motors Hub", area: "Whitefield", lat: 12.9698, lng: 77.75 },
    { id: "bengaluru-hsr", name: "HSR Layout Auto Point", area: "HSR Layout", lat: 12.9116, lng: 77.6474 },
    { id: "bengaluru-jayanagar", name: "Jayanagar Service Station", area: "Jayanagar", lat: 12.925, lng: 77.5938 },
    { id: "bengaluru-electronic-city", name: "Electronic City Auto Hub", area: "Electronic City", lat: 12.8399, lng: 77.677 },
  ],
  Chennai: [
    { id: "chennai-tnagar", name: "T Nagar Auto Care", area: "T Nagar", lat: 13.0418, lng: 80.2341 },
    { id: "chennai-annanagar", name: "Anna Nagar Motors", area: "Anna Nagar", lat: 13.085, lng: 80.2101 },
    { id: "chennai-velachery", name: "Velachery Garage Hub", area: "Velachery", lat: 12.9815, lng: 80.218 },
    { id: "chennai-adyar", name: "Adyar Auto Works", area: "Adyar", lat: 13.0067, lng: 80.2572 },
    { id: "chennai-omr", name: "OMR Service Point", area: "OMR", lat: 12.9416, lng: 80.2362 },
    { id: "chennai-tambaram", name: "Tambaram Auto Hub", area: "Tambaram", lat: 12.9249, lng: 80.1 },
  ],
  Delhi: [
    { id: "delhi-cp", name: "Connaught Place Auto Care", area: "Connaught Place", lat: 28.6315, lng: 77.2167 },
    { id: "delhi-karolbagh", name: "Karol Bagh Motors", area: "Karol Bagh", lat: 28.6519, lng: 77.19 },
    { id: "delhi-dwarka", name: "Dwarka Garage Hub", area: "Dwarka", lat: 28.5921, lng: 77.046 },
    { id: "delhi-rohini", name: "Rohini Auto Point", area: "Rohini", lat: 28.7496, lng: 77.0665 },
    { id: "delhi-lajpat", name: "Lajpat Nagar Service Station", area: "Lajpat Nagar", lat: 28.5677, lng: 77.2434 },
    { id: "delhi-saket", name: "Saket Auto Works", area: "Saket", lat: 28.5245, lng: 77.2066 },
  ],
  Gurgaon: [
    { id: "gurgaon-dlf1", name: "DLF Phase 1 Auto Care", area: "DLF Phase 1", lat: 28.472, lng: 77.096 },
    { id: "gurgaon-sec14", name: "Sector 14 Motors", area: "Sector 14", lat: 28.472, lng: 77.045 },
    { id: "gurgaon-gcr", name: "Golf Course Road Garage", area: "Golf Course Road", lat: 28.4515, lng: 77.099 },
    { id: "gurgaon-sohna", name: "Sohna Road Auto Hub", area: "Sohna Road", lat: 28.4089, lng: 77.042 },
    { id: "gurgaon-udyog", name: "Udyog Vihar Service Point", area: "Udyog Vihar", lat: 28.4867, lng: 77.0855 },
    { id: "gurgaon-sec29", name: "Sector 29 Auto Works", area: "Sector 29", lat: 28.466, lng: 77.063 },
  ],
  Hyderabad: [
    { id: "hyderabad-banjara", name: "Banjara Hills Auto Care", area: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
    { id: "hyderabad-jubilee", name: "Jubilee Hills Motors", area: "Jubilee Hills", lat: 17.431, lng: 78.407 },
    { id: "hyderabad-gachibowli", name: "Gachibowli Garage Hub", area: "Gachibowli", lat: 17.4401, lng: 78.3489 },
    { id: "hyderabad-madhapur", name: "Madhapur Auto Point", area: "Madhapur", lat: 17.4483, lng: 78.3915 },
    { id: "hyderabad-kukatpally", name: "Kukatpally Service Station", area: "Kukatpally", lat: 17.4948, lng: 78.3996 },
    { id: "hyderabad-secunderabad", name: "Secunderabad Auto Works", area: "Secunderabad", lat: 17.4399, lng: 78.4983 },
  ],
  Kolkata: [
    { id: "kolkata-saltlake", name: "Salt Lake Auto Care", area: "Salt Lake", lat: 22.5797, lng: 88.4143 },
    { id: "kolkata-parkstreet", name: "Park Street Motors", area: "Park Street", lat: 22.5552, lng: 88.3516 },
    { id: "kolkata-howrah", name: "Howrah Garage Hub", area: "Howrah", lat: 22.5892, lng: 88.3103 },
    { id: "kolkata-newtown", name: "New Town Auto Point", area: "New Town", lat: 22.589, lng: 88.4744 },
    { id: "kolkata-garia", name: "Garia Service Station", area: "Garia", lat: 22.4612, lng: 88.3814 },
    { id: "kolkata-behala", name: "Behala Auto Works", area: "Behala", lat: 22.4981, lng: 88.3108 },
  ],
  Mumbai: [
    { id: "mumbai-andheri", name: "Andheri Auto Care", area: "Andheri", lat: 19.1136, lng: 72.8697 },
    { id: "mumbai-bandra", name: "Bandra Motors", area: "Bandra", lat: 19.0596, lng: 72.8295 },
    { id: "mumbai-powai", name: "Powai Garage Hub", area: "Powai", lat: 19.1197, lng: 72.9051 },
    { id: "mumbai-borivali", name: "Borivali Auto Point", area: "Borivali", lat: 19.2307, lng: 72.8567 },
    { id: "mumbai-dadar", name: "Dadar Service Station", area: "Dadar", lat: 19.0178, lng: 72.8478 },
    { id: "mumbai-thane", name: "Thane Auto Works", area: "Thane", lat: 19.2183, lng: 72.9781 },
  ],
  Noida: [
    { id: "noida-sec18", name: "Sector 18 Auto Care", area: "Sector 18", lat: 28.5708, lng: 77.326 },
    { id: "noida-sec62", name: "Sector 62 Motors", area: "Sector 62", lat: 28.627, lng: 77.3649 },
    { id: "noida-extension", name: "Noida Extension Garage", area: "Noida Extension", lat: 28.6, lng: 77.432 },
    { id: "noida-sec137", name: "Sector 137 Auto Hub", area: "Sector 137", lat: 28.509, lng: 77.406 },
    { id: "noida-greaternoida", name: "Greater Noida Service Point", area: "Greater Noida", lat: 28.4744, lng: 77.504 },
    { id: "noida-parichowk", name: "Pari Chowk Auto Works", area: "Pari Chowk", lat: 28.4595, lng: 77.51 },
  ],
  Pune: [
    { id: "pune-hinjewadi", name: "Hinjewadi Auto Care", area: "Hinjewadi", lat: 18.5913, lng: 73.7389 },
    { id: "pune-kothrud", name: "Kothrud Motors", area: "Kothrud", lat: 18.5074, lng: 73.8077 },
    { id: "pune-vimannagar", name: "Viman Nagar Garage Hub", area: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
    { id: "pune-hadapsar", name: "Hadapsar Auto Point", area: "Hadapsar", lat: 18.5089, lng: 73.926 },
    { id: "pune-baner", name: "Baner Service Station", area: "Baner", lat: 18.559, lng: 73.7868 },
    { id: "pune-wakad", name: "Wakad Auto Works", area: "Wakad", lat: 18.598, lng: 73.768 },
  ],
  Ahmedabad: [
    { id: "ahmedabad-satellite", name: "Satellite Auto Care", area: "Satellite", lat: 23.03, lng: 72.535 },
    { id: "ahmedabad-navrangpura", name: "Navrangpura Motors", area: "Navrangpura", lat: 23.0358, lng: 72.5644 },
    { id: "ahmedabad-prahladnagar", name: "Prahlad Nagar Garage", area: "Prahlad Nagar", lat: 23.01, lng: 72.535 },
    { id: "ahmedabad-maninagar", name: "Maninagar Auto Hub", area: "Maninagar", lat: 22.995, lng: 72.605 },
    { id: "ahmedabad-vastrapur", name: "Vastrapur Service Point", area: "Vastrapur", lat: 23.0395, lng: 72.526 },
    { id: "ahmedabad-bopal", name: "Bopal Auto Works", area: "Bopal", lat: 22.992, lng: 72.465 },
  ],
  Jaipur: [
    { id: "jaipur-malviyanagar", name: "Malviya Nagar Auto Care", area: "Malviya Nagar", lat: 26.852, lng: 75.806 },
    { id: "jaipur-vaishali", name: "Vaishali Nagar Motors", area: "Vaishali Nagar", lat: 26.9124, lng: 75.743 },
    { id: "jaipur-mansarovar", name: "Mansarovar Garage Hub", area: "Mansarovar", lat: 26.855, lng: 75.768 },
    { id: "jaipur-jagatpura", name: "Jagatpura Auto Point", area: "Jagatpura", lat: 26.838, lng: 75.87 },
    { id: "jaipur-cscheme", name: "C Scheme Service Station", area: "C Scheme", lat: 26.906, lng: 75.795 },
    { id: "jaipur-rajapark", name: "Raja Park Auto Works", area: "Raja Park", lat: 26.899, lng: 75.825 },
  ],
  Kochi: [
    { id: "kochi-kakkanad", name: "Kakkanad Auto Care", area: "Kakkanad", lat: 10.0158, lng: 76.3419 },
    { id: "kochi-edappally", name: "Edappally Motors", area: "Edappally", lat: 10.0261, lng: 76.3125 },
    { id: "kochi-fortkochi", name: "Fort Kochi Garage Hub", area: "Fort Kochi", lat: 9.9658, lng: 76.2421 },
    { id: "kochi-vyttila", name: "Vyttila Auto Point", area: "Vyttila", lat: 9.967, lng: 76.318 },
    { id: "kochi-kaloor", name: "Kaloor Service Station", area: "Kaloor", lat: 9.995, lng: 76.292 },
    { id: "kochi-marinedrive", name: "Marine Drive Auto Works", area: "Marine Drive", lat: 9.98, lng: 76.275 },
  ],
};

export const getHubsForCity = (city) => GARAGE_HUBS[city] || [];

export const getHubById = (city, hubId) =>
  getHubsForCity(city).find((hub) => hub.id === hubId) || null;

// Find the closest hub to any GPS location (used to label the customer's position).
export const findNearestHub = (location) => {
  if (!location?.lat || !location?.lng) return null;

  let best = null;

  Object.entries(GARAGE_HUBS).forEach(([city, hubs]) => {
    hubs.forEach((hub) => {
      const distanceKm = calculateDistanceKm(location, hub);
      if (distanceKm == null) return;
      if (!best || distanceKm < best.distanceKm) {
        best = { ...hub, city, distanceKm };
      }
    });
  });

  return best;
};
