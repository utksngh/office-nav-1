import { Point, OfficeSection, PathNode } from '../types';
import { calculatePixelDistanceInMeters } from './geoUtils';

// A* pathfinding algorithm with optimized path smoothing and minimal turns
export function findPath(
  start: Point,
  end: Point,
  obstacles: OfficeSection[],
  mapWidth: number,
  mapHeight: number
  metersPerPixel: number = 0.1
): Point[] {
  const gridSize = Math.max(4, Math.round(0.5 / metersPerPixel)); // 0.5 meter grid resolution
  const cols = Math.ceil(mapWidth / gridSize);
  const rows = Math.ceil(mapHeight / gridSize);

  // Convert points to grid coordinates
  const startGrid = {
    x: Math.floor(start.x / gridSize),
    y: Math.floor(start.y / gridSize)
  };
  const endGrid = {
    x: Math.floor(end.x / gridSize),
    y: Math.floor(end.y / gridSize)
  };

  // Create obstacle map with minimal buffer
  const obstacleMap = createObstacleMap(obstacles, cols, rows, gridSize);

  // Ensure start and end points are not in obstacles
  const validStart = ensureValidPoint(startGrid, obstacleMap, cols, rows);
  const validEnd = ensureValidPoint(endGrid, obstacleMap, cols, rows);

  // Try direct line first
  if (isDirectPathClear(validStart, validEnd, obstacleMap)) {
    return [start, end];
  }

  // A* algorithm optimized for shortest distance
  const path = findAStarPath(validStart, validEnd, obstacleMap, cols, rows);
  
  if (path.length === 0) {
    return findSimpleAlternativePath(start, end, obstacles, metersPerPixel);
  }

  // Convert back to world coordinates and smooth
  const worldPath = convertToWorldPath(path, gridSize, start, end);
  return optimizeForShortestPath(worldPath, obstacles, metersPerPixel);
}

function createObstacleMap(
  obstacles: OfficeSection[],
  cols: number,
  rows: number,
  gridSize: number,
  metersPerPixel: number = 0.1
): boolean[][] {
  const map: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const bufferMeters = 0.3; // 30cm buffer around obstacles
  const buffer = bufferMeters / metersPerPixel; // Convert to pixels

  for (const obstacle of obstacles) {
    const startX = Math.max(0, Math.floor((obstacle.x - buffer) / gridSize));
    const startY = Math.max(0, Math.floor((obstacle.y - buffer) / gridSize));
    const endX = Math.min(cols - 1, Math.ceil((obstacle.x + obstacle.width + buffer) / gridSize));
    const endY = Math.min(rows - 1, Math.ceil((obstacle.y + obstacle.height + buffer) / gridSize));

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
          map[y][x] = true;
        }
      }
    }
  }

  return map;
}

function ensureValidPoint(
  point: Point,
  obstacleMap: boolean[][],
  cols: number,
  rows: number
): Point {
  if (point.x >= 0 && point.x < cols && point.y >= 0 && point.y < rows && 
      !obstacleMap[point.y][point.x]) {
    return point;
  }

  // Find nearest valid point with minimal distance
  let minDistance = Infinity;
  let bestPoint = point;

  for (let radius = 1; radius <= 10; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        
        const newX = point.x + dx;
        const newY = point.y + dy;
        
        if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && 
            !obstacleMap[newY][newX]) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minDistance) {
            minDistance = distance;
            bestPoint = { x: newX, y: newY };
          }
        }
      }
    }
    if (minDistance < Infinity) break;
  }

  return bestPoint;
}

function isDirectPathClear(start: Point, end: Point, obstacleMap: boolean[][]): boolean {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const steps = Math.max(dx, dy);
  
  if (steps === 0) return true;

  const stepX = (end.x - start.x) / steps;
  const stepY = (end.y - start.y) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = Math.round(start.x + stepX * i);
    const y = Math.round(start.y + stepY * i);
    
    if (x >= 0 && x < obstacleMap[0].length && y >= 0 && y < obstacleMap.length) {
      if (obstacleMap[y][x]) return false;
    }
  }

  return true;
}

function findAStarPath(
  start: Point,
  end: Point,
  obstacleMap: boolean[][],
  cols: number,
  rows: number
): Point[] {
  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, Point>();

  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: euclideanDistance(start, end),
    f: 0
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Find node with lowest f score
    let current = openSet[0];
    let currentIndex = 0;
    
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < current.f) {
        current = openSet[i];
        currentIndex = i;
      }
    }

    openSet.splice(currentIndex, 1);
    const currentKey = `${current.x},${current.y}`;
    closedSet.add(currentKey);

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }

    // Get all valid neighbors
    const neighbors = getAllNeighbors(current, cols, rows);
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      if (closedSet.has(neighborKey) || 
          (obstacleMap[neighbor.y] && obstacleMap[neighbor.y][neighbor.x])) {
        continue;
      }

      const moveCost = euclideanDistance(current, neighbor);
      const tentativeG = current.g + moveCost;
      
      const existingNode = openSet.find(node => 
        node.x === neighbor.x && node.y === neighbor.y
      );

      if (!existingNode) {
        const newNode: PathNode = {
          x: neighbor.x,
          y: neighbor.y,
          g: tentativeG,
          h: euclideanDistance(neighbor, end),
          f: 0
        };
        newNode.f = newNode.g + newNode.h;
        openSet.push(newNode);
        cameFrom.set(neighborKey, current);
      } else if (tentativeG < existingNode.g) {
        existingNode.g = tentativeG;
        existingNode.f = existingNode.g + existingNode.h;
        cameFrom.set(neighborKey, current);
      }
    }
  }

  return [];
}

function getAllNeighbors(current: Point, cols: number, rows: number): Point[] {
  const allNeighbors = [
    { x: current.x - 1, y: current.y },     // Left
    { x: current.x + 1, y: current.y },     // Right
    { x: current.x, y: current.y - 1 },     // Up
    { x: current.x, y: current.y + 1 },     // Down
    { x: current.x - 1, y: current.y - 1 }, // Up-Left
    { x: current.x + 1, y: current.y - 1 }, // Up-Right
    { x: current.x - 1, y: current.y + 1 }, // Down-Left
    { x: current.x + 1, y: current.y + 1 }  // Down-Right
  ];

  return allNeighbors.filter(n => 
    n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows
  );
}

function euclideanDistance(a: Point, b: Point): number {
  // True Euclidean distance for shortest paths
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.sqrt(dx * dx + dy * dy);
}

function reconstructPath(cameFrom: Map<string, Point>, current: Point): Point[] {
  const path: Point[] = [current];
  let currentKey = `${current.x},${current.y}`;

  while (cameFrom.has(currentKey)) {
    const prev = cameFrom.get(currentKey)!;
    path.unshift(prev);
    currentKey = `${prev.x},${prev.y}`;
  }

  return path;
}

function convertToWorldPath(gridPath: Point[], gridSize: number, originalStart: Point, originalEnd: Point): Point[] {
  if (gridPath.length === 0) return [];

  const worldPath = gridPath.map(point => ({
    x: point.x * gridSize + gridSize / 2,
    y: point.y * gridSize + gridSize / 2
  }));

  // Use original coordinates for start and end
  if (worldPath.length > 0) {
    worldPath[0] = originalStart;
    worldPath[worldPath.length - 1] = originalEnd;
  }

  return worldPath;
}

function optimizeForShortestPath(path: Point[], obstacles: OfficeSection[], metersPerPixel: number = 0.1): Point[] {
  if (path.length <= 2) return path;

  const optimized: Point[] = [path[0]];
  let currentIndex = 0;

  while (currentIndex < path.length - 1) {
    let farthestIndex = currentIndex + 1;
    
    // Find the farthest point we can reach directly (greedy approach for shortest path)
    for (let i = path.length - 1; i > currentIndex + 1; i--) {
      if (isPathClearOfObstacles(path[currentIndex], path[i], obstacles, metersPerPixel)) {
        farthestIndex = i;
        break;
      }
    }
    
    // If we couldn't skip ahead, try the next closest points
    if (farthestIndex === currentIndex + 1) {
      for (let i = currentIndex + 2; i < path.length; i++) {
        if (isPathClearOfObstacles(path[currentIndex], path[i], obstacles, metersPerPixel)) {
          farthestIndex = i;
        } else {
          break;
        }
      }
    }
    
    optimized.push(path[farthestIndex]);
    currentIndex = farthestIndex;
  }

  // Additional optimization: try to connect non-adjacent points
  return furtherOptimizePath(optimized, obstacles, metersPerPixel);
}

function furtherOptimizePath(path: Point[], obstacles: OfficeSection[], metersPerPixel: number = 0.1): Point[] {
  if (path.length <= 2) return path;
  
  const result: Point[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    let canSkip = false;
    
    // Try to connect the last point in result directly to points further ahead
    for (let j = path.length - 1; j > i; j--) {
      if (isPathClearOfObstacles(result[result.length - 1], path[j], obstacles, metersPerPixel)) {
        // We can skip to this point
        if (j === path.length - 1) {
          result.push(path[j]);
          return result;
        }
        i = j - 1; // Skip ahead
        canSkip = true;
        break;
      }
    }
    
    if (!canSkip) {
      result.push(path[i]);
    }
  }
  
  // Ensure we include the end point
  if (result[result.length - 1] !== path[path.length - 1]) {
    result.push(path[path.length - 1]);
  }
  
  return result;
}

function isPathClearOfObstacles(start: Point, end: Point, obstacles: OfficeSection[], metersPerPixel: number = 0.1): boolean {
  const bufferMeters = 0.4; // 40cm minimum clearance
  const buffer = bufferMeters / metersPerPixel; // Convert to pixels
  
  for (const obstacle of obstacles) {
    if (lineIntersectsRectangle(
      start, end,
      obstacle.x - buffer, obstacle.y - buffer,
      obstacle.width + 2 * buffer, obstacle.height + 2 * buffer
    )) {
      return false;
    }
  }
  
  return true;
}

function lineIntersectsRectangle(
  lineStart: Point, lineEnd: Point,
  rectX: number, rectY: number,
  rectWidth: number, rectHeight: number
): boolean {
  // Check if line intersects with any edge of the rectangle
  const rectRight = rectX + rectWidth;
  const rectBottom = rectY + rectHeight;
  
  return (
    lineIntersectsLine(lineStart, lineEnd, {x: rectX, y: rectY}, {x: rectRight, y: rectY}) ||
    lineIntersectsLine(lineStart, lineEnd, {x: rectRight, y: rectY}, {x: rectRight, y: rectBottom}) ||
    lineIntersectsLine(lineStart, lineEnd, {x: rectRight, y: rectBottom}, {x: rectX, y: rectBottom}) ||
    lineIntersectsLine(lineStart, lineEnd, {x: rectX, y: rectBottom}, {x: rectX, y: rectY}) ||
    pointInRectangle(lineStart, rectX, rectY, rectWidth, rectHeight) ||
    pointInRectangle(lineEnd, rectX, rectY, rectWidth, rectHeight)
  );
}

function lineIntersectsLine(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-10) return false;
  
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function pointInRectangle(point: Point, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean {
  return point.x >= rectX && point.x <= rectX + rectWidth &&
         point.y >= rectY && point.y <= rectY + rectHeight;
}

function findSimpleAlternativePath(start: Point, end: Point, obstacles: OfficeSection[], metersPerPixel: number = 0.1): Point[] {
  // Create a simple path that goes around obstacles
  const waypoints: Point[] = [start];
  
  // Find the most direct path around major obstacles
  const directObstacles = obstacles.filter(obstacle => {
    return lineIntersectsRectangle(start, end, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
  
  if (directObstacles.length > 0) {
    const obstacle = directObstacles[0]; // Handle the first blocking obstacle
    const bufferMeters = 1.0; // 1 meter buffer for alternative path
    const buffer = bufferMeters / metersPerPixel;
    
    // Determine which corner to go around based on shortest path
    const corners = [
      { x: obstacle.x - buffer, y: obstacle.y - buffer }, // Top-left
      { x: obstacle.x + obstacle.width + buffer, y: obstacle.y - buffer }, // Top-right
      { x: obstacle.x - buffer, y: obstacle.y + obstacle.height + buffer }, // Bottom-left
      { x: obstacle.x + obstacle.width + buffer, y: obstacle.y + obstacle.height + buffer } // Bottom-right
    ];
    
    // Choose the corner that gives the shortest total path
    let bestCorner = corners[0];
    let shortestDistance = Infinity;
    
    for (const corner of corners) {
      const totalDistance = 
        Math.sqrt(Math.pow(corner.x - start.x, 2) + Math.pow(corner.y - start.y, 2)) +
        Math.sqrt(Math.pow(end.x - corner.x, 2) + Math.pow(end.y - corner.y, 2));
      
      if (totalDistance < shortestDistance) {
        shortestDistance = totalDistance;
        bestCorner = corner;
      }
    }
    
    waypoints.push(bestCorner);
  }
  
  waypoints.push(end);
  return waypoints;
}