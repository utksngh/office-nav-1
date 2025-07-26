export interface Point {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export interface OfficeSection {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'office' | 'meeting' | 'reception' | 'cafeteria' | 'storage' | 'department' | 'executive' | 'lounge';
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FloorData {
  id: number;
  name: string;
  width: number;
  height: number;
  centerCoordinates: {
    lat: number;
    lng: number;
  };
  metersPerPixel: number;
  sections: OfficeSection[];
}

export interface PathNode {
  x: number;
  y: number;
  g: number; // Distance from start
  h: number; // Heuristic distance to end
  f: number; // Total cost
  parent?: PathNode;
}