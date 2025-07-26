// Geographic utility functions for coordinate conversion

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface PixelCoordinates {
  x: number;
  y: number;
}

// Earth's radius in meters
const EARTH_RADIUS = 6378137;

// Convert geographic coordinates to pixel coordinates relative to a center point
export function geoToPixel(
  geoCoord: GeoCoordinates,
  centerGeo: GeoCoordinates,
  metersPerPixel: number
): PixelCoordinates {
  // Calculate distance in meters from center
  const deltaLat = geoCoord.lat - centerGeo.lat;
  const deltaLng = geoCoord.lng - centerGeo.lng;
  
  // Convert to meters using approximate formulas for small distances
  const metersNorth = deltaLat * (Math.PI / 180) * EARTH_RADIUS;
  const metersEast = deltaLng * (Math.PI / 180) * EARTH_RADIUS * Math.cos(centerGeo.lat * Math.PI / 180);
  
  // Convert to pixels (positive Y goes down in screen coordinates)
  return {
    x: metersEast / metersPerPixel,
    y: -metersNorth / metersPerPixel // Negative because screen Y increases downward
  };
}

// Convert pixel coordinates to geographic coordinates relative to a center point
export function pixelToGeo(
  pixelCoord: PixelCoordinates,
  centerGeo: GeoCoordinates,
  metersPerPixel: number
): GeoCoordinates {
  // Convert pixels to meters
  const metersEast = pixelCoord.x * metersPerPixel;
  const metersNorth = -pixelCoord.y * metersPerPixel; // Negative because screen Y increases downward
  
  // Convert meters to degrees
  const deltaLat = metersNorth / (EARTH_RADIUS * Math.PI / 180);
  const deltaLng = metersEast / (EARTH_RADIUS * Math.PI / 180 * Math.cos(centerGeo.lat * Math.PI / 180));
  
  return {
    lat: centerGeo.lat + deltaLat,
    lng: centerGeo.lng + deltaLng
  };
}

// Calculate distance between two geographic points in meters
export function calculateGeoDistance(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
  const lat1Rad = coord1.lat * Math.PI / 180;
  const lat2Rad = coord2.lat * Math.PI / 180;
  const deltaLatRad = (coord2.lat - coord1.lat) * Math.PI / 180;
  const deltaLngRad = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

// Calculate distance between two pixel points in meters
export function calculatePixelDistanceInMeters(
  point1: PixelCoordinates,
  point2: PixelCoordinates,
  metersPerPixel: number
): number {
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  const pixelDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return pixelDistance * metersPerPixel;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1) {
    return `${Math.round(meters * 100)} cm`;
  } else if (meters < 1000) {
    return `${Math.round(meters * 10) / 10} m`;
  } else {
    return `${Math.round(meters / 100) / 10} km`;
  }
}

// Format coordinates for display
export function formatCoordinates(coord: GeoCoordinates): string {
  return `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`;
}