import { Point, OfficeSection } from '../types';

// A* pathfinding algorithm implementation
interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost
  parent: Node | null;
}

// Calculate distance between two points
function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Check if a point is inside any obstacle (office section)
function isPointInObstacle(point: Point, obstacles: OfficeSection[], buffer: number = 25): boolean {
  for (const obstacle of obstacles) {
    if (
      point.x >= obstacle.x - buffer &&
      point.x <= obstacle.x + obstacle.width + buffer &&
      point.y >= obstacle.y - buffer &&
      point.y <= obstacle.y + obstacle.height + buffer
    ) {
      return true;
    }
  }
  return false;
}

// Check if a line segment intersects with any obstacle
function lineIntersectsObstacle(start: Point, end: Point, obstacles: OfficeSection[], buffer: number = 25): boolean {
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  const stepSize = Math.max(1, Math.floor(steps / 10));
  
  for (let i = 0; i <= steps; i += stepSize) {
    const t = i / steps;
    const point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    };
    
    if (isPointInObstacle(point, obstacles, buffer)) {
      return true;
    }
  }
  return false;
}

// Get neighbors for A* algorithm
function getNeighbors(node: Node, gridSize: number, width: number, height: number, obstacles: OfficeSection[]): Node[] {
  const neighbors: Node[] = [];
  const directions = [
    { x: 0, y: -gridSize }, // Up
    { x: gridSize, y: 0 },  // Right
    { x: 0, y: gridSize },  // Down
    { x: -gridSize, y: 0 }, // Left
    { x: gridSize, y: -gridSize }, // Up-Right
    { x: gridSize, y: gridSize },  // Down-Right
    { x: -gridSize, y: gridSize }, // Down-Left
    { x: -gridSize, y: -gridSize } // Up-Left
  ];

  for (const dir of directions) {
    const newX = node.x + dir.x;
    const newY = node.y + dir.y;

    // Check bounds
    if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
      continue;
    }

    const newPoint = { x: newX, y: newY };
    
    // Check if point is in obstacle
    if (isPointInObstacle(newPoint, obstacles, 25)) {
      continue;
    }

    // Check if path to this point intersects obstacle
    if (lineIntersectsObstacle({ x: node.x, y: node.y }, newPoint, obstacles, 25)) {
      continue;
    }

    neighbors.push({
      x: newX,
      y: newY,
      g: 0,
      h: 0,
      f: 0,
      parent: null
    });
  }

  return neighbors;
}

// A* pathfinding algorithm
export function findPath(start: Point, end: Point, obstacles: OfficeSection[], width: number, height: number): Point[] {
  const gridSize = 5; // 0.5m grid resolution
  
  // Snap start and end to grid
  const startNode: Node = {
    x: Math.round(start.x / gridSize) * gridSize,
    y: Math.round(start.y / gridSize) * gridSize,
    g: 0,
    h: distance(start, end),
    f: distance(start, end),
    parent: null
  };

  const endNode: Node = {
    x: Math.round(end.x / gridSize) * gridSize,
    y: Math.round(end.y / gridSize) * gridSize,
    g: 0,
    h: 0,
    f: 0,
    parent: null
  };

  // If start or end is in obstacle, try to find nearest free point
  if (isPointInObstacle(startNode, obstacles)) {
    // Find nearest free point for start
    let found = false;
    for (let radius = gridSize; radius <= 100 && !found; radius += gridSize) {
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const testPoint = {
          x: startNode.x + Math.cos(rad) * radius,
          y: startNode.y + Math.sin(rad) * radius
        };
        if (!isPointInObstacle(testPoint, obstacles) && testPoint.x >= 0 && testPoint.x < width && testPoint.y >= 0 && testPoint.y < height) {
          startNode.x = testPoint.x;
          startNode.y = testPoint.y;
          found = true;
          break;
        }
      }
    }
  }

  if (isPointInObstacle(endNode, obstacles)) {
    // Find nearest free point for end
    let found = false;
    for (let radius = gridSize; radius <= 100 && !found; radius += gridSize) {
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const testPoint = {
          x: endNode.x + Math.cos(rad) * radius,
          y: endNode.y + Math.sin(rad) * radius
        };
        if (!isPointInObstacle(testPoint, obstacles) && testPoint.x >= 0 && testPoint.x < width && testPoint.y >= 0 && testPoint.y < height) {
          endNode.x = testPoint.x;
          endNode.y = testPoint.y;
          found = true;
          break;
        }
      }
    }
  }

  const openSet: Node[] = [startNode];
  const closedSet: Set<string> = new Set();

  while (openSet.length > 0) {
    // Find node with lowest f score
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openSet.splice(currentIndex, 1)[0];
    const currentKey = `${current.x},${current.y}`;
    closedSet.add(currentKey);

    // Check if we reached the end
    if (Math.abs(current.x - endNode.x) < gridSize && Math.abs(current.y - endNode.y) < gridSize) {
      // Reconstruct path
      const path: Point[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      
      // Add original start and end points
      if (path.length > 0) {
        path[0] = start;
        path[path.length - 1] = end;
      }
      
      return path;
    }

    // Get neighbors
    const neighbors = getNeighbors(current, gridSize, width, height, obstacles);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      if (closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeG = current.g + distance(current, neighbor);

      // Check if this neighbor is already in open set
      const existingIndex = openSet.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
      
      if (existingIndex === -1) {
        // New node
        neighbor.g = tentativeG;
        neighbor.h = distance(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        openSet.push(neighbor);
      } else if (tentativeG < openSet[existingIndex].g) {
        // Better path to existing node
        openSet[existingIndex].g = tentativeG;
        openSet[existingIndex].f = tentativeG + openSet[existingIndex].h;
        openSet[existingIndex].parent = current;
      }
    }
  }

  // No path found, return direct line
  return [start, end];
}

// Get landmarks near a point
export function getLandmarksNear(point: Point, sections: OfficeSection[], radius: number = 60): OfficeSection[] {
  return sections.filter(section => {
    const centerX = section.x + section.width / 2;
    const centerY = section.y + section.height / 2;
    const dist = distance(point, { x: centerX, y: centerY });
    return dist <= radius;
  });
}

// Get landmarks along a path segment
export function getLandmarksAlongPath(start: Point, end: Point, sections: OfficeSection[], radius: number = 40): OfficeSection[] {
  const landmarks: OfficeSection[] = [];
  const steps = 10;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    };
    
    const nearbyLandmarks = getLandmarksNear(point, sections, radius);
    for (const landmark of nearbyLandmarks) {
      if (!landmarks.find(l => l.id === landmark.id)) {
        landmarks.push(landmark);
      }
    }
  }
  
  return landmarks;
}