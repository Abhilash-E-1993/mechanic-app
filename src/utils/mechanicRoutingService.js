import {
  calculateDistanceKm,
  estimateEtaMinutesFromLocation,
} from "./etaService";

const supportsRequestedService = (mechanic, serviceType) => {
  if (!serviceType) {
    return true;
  }

  if (!Array.isArray(mechanic?.services) || mechanic.services.length === 0) {
    return true;
  }

  return mechanic.services.includes(serviceType);
};

// Mechanics have fixed, real garage hub locations chosen during onboarding.
export const getMechanicCoordinates = (mechanic) => {
  if (mechanic?.mechanicBaseLocation?.lat && mechanic?.mechanicBaseLocation?.lng) {
    return mechanic.mechanicBaseLocation;
  }

  if (mechanic?.latitude != null && mechanic?.longitude != null) {
    return {
      addressLine1:
        mechanic?.hubName ||
        (mechanic?.serviceArea
          ? `${mechanic.serviceArea} Garage`
          : "Mechanic Garage"),
      addressLine2: [mechanic?.serviceArea, mechanic?.city]
        .filter(Boolean)
        .join(", "),
      lat: Number(mechanic.latitude),
      lng: Number(mechanic.longitude),
    };
  }

  return null;
};

export const rankMechanicsByDistance = ({
  mechanics = [],
  customerLocation,
  serviceType,
}) =>
  mechanics
    .filter((mechanic) => supportsRequestedService(mechanic, serviceType))
    .map((mechanic) => {
      const mechanicLocation = getMechanicCoordinates(mechanic);
      const distanceKm = mechanicLocation
        ? calculateDistanceKm(customerLocation, mechanicLocation)
        : null;
      const estimatedEtaMinutes = mechanicLocation
        ? estimateEtaMinutesFromLocation(customerLocation, mechanicLocation)
        : null;

      return {
        ...mechanic,
        mechanicBaseLocation: mechanicLocation,
        distanceKm,
        estimatedEtaMinutes,
      };
    })
    .sort((left, right) => {
      if (left.estimatedEtaMinutes == null && right.estimatedEtaMinutes == null) {
        return 0;
      }

      if (left.estimatedEtaMinutes == null) {
        return 1;
      }

      if (right.estimatedEtaMinutes == null) {
        return -1;
      }

      return left.estimatedEtaMinutes - right.estimatedEtaMinutes;
    });

export const createMechanicRoutingQueue = (rankedMechanics = []) =>
  rankedMechanics.map((mechanic, index) => ({
    mechanicId: mechanic.id,
    name: mechanic.name,
    garageName: mechanic.garageName || "",
    phoneNumber: mechanic.phoneNumber || "",
    city: mechanic.city || "",
    serviceArea: mechanic.serviceArea || "",
    hubName: mechanic.hubName || "",
    mechanicBaseLocation: mechanic.mechanicBaseLocation || null,
    latitude:
      mechanic.mechanicBaseLocation?.lat ??
      (mechanic.latitude != null ? Number(mechanic.latitude) : null),
    longitude:
      mechanic.mechanicBaseLocation?.lng ??
      (mechanic.longitude != null ? Number(mechanic.longitude) : null),
    availabilityStatus: mechanic.availabilityStatus || "available",
    estimatedEtaMinutes: mechanic.estimatedEtaMinutes ?? null,
    distanceKm:
      mechanic.distanceKm != null ? Number(mechanic.distanceKm.toFixed(2)) : null,
    rank: index + 1,
  }));
