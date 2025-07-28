import React, { useState, useRef, useCallback } from 'react';
import { FloorData, Point, OfficeSection } from '../types';
import { findPath } from '../utils/pathfinding';
import { calculatePixelDistanceInMeters, formatDistance } from '../utils/geoUtils';
import { X } from 'lucide-react';
import OfficeSpace from './OfficeSpace';
import PathVisualization from './PathVisualization';

interface FloorMapProps {
  floorData: FloorData;
  startPoint: Point | null;
  endPoint: Point | null;
  onPointSelect: (point: Point, type: 'start' | 'end') => void;
  onClearPath: () => void;
  isAddingSection: boolean;
  onAddSection: (section: Omit<OfficeSection, 'id'>) => void;
  selectedSection: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<OfficeSection>) => void;
  isMobile: boolean;
  isNavigating: boolean;
  zoomLevel: number;
  mapTransform: { x: number; y: number };
  onMapTransform: (transform: { x: number; y: number }) => void;
  setZoomLevel: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const FloorMap: React.FC<FloorMapProps> = ({
  floorData,
  startPoint,
  endPoint,
  onPointSelect,
  onClearPath,
  isAddingSection,
  onAddSection,
  selectedSection,
  onSectionSelect,
  onSectionUpdate,
  isMobile,
  isNavigating,
  zoomLevel,
  mapTransform,
  onMapTransform,
  setZoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSectionTypeColor = (type: OfficeSection['type']) => {
    const colors = {
      office: '#3B82F6',
      meeting: '#8B5CF6',
      reception: '#10B981',
      cafeteria: '#F59E0B',
      storage: '#6B7280',
      department: '#EF4444',
      executive: '#F97316',
      lounge: '#06B6D4'
    };
    return colors[type];
  };

  // Find the nearest corner of the closest section to the clicked point
  const findNearestCorner = (clickPoint: Point): Point => {
    let nearestCorner = clickPoint;
    let minDistance = Infinity;
    const cornerThreshold = 50; // Maximum distance to consider a corner

    for (const section of floorData.sections) {
      // Calculate all four corners of the section
      const corners = [
        { x: section.x, y: section.y }, // Top-left
        { x: section.x + section.width, y: section.y }, // Top-right
        { x: section.x, y: section.y + section.height }, // Bottom-left
        { x: section.x + section.width, y: section.y + section.height } // Bottom-right
      ];

      // Find the closest corner
      for (const corner of corners) {
        const distance = Math.sqrt(
          Math.pow(corner.x - clickPoint.x, 2) + 
          Math.pow(corner.y - clickPoint.y, 2)
        );

        if (distance < minDistance && distance <= cornerThreshold) {
          minDistance = distance;
          nearestCorner = corner;
        }
      }
    }

    return nearestCorner;
  };
  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    // Adjust for zoom and transform
    const x = (event.clientX - rect.left) / zoomLevel - mapTransform.x;
    const y = (event.clientY - rect.top) / zoomLevel - mapTransform.y;
    const point: Point = { x, y };

    if (isAddingSection) {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawStart(point);
      } else {
        if (drawStart) {
          const width = Math.abs(x - drawStart.x);
          const height = Math.abs(y - drawStart.y);
          const newSection: Omit<OfficeSection, 'id'> = {
            name: `Section ${Date.now()}`,
            x: Math.min(drawStart.x, x),
            y: Math.min(drawStart.y, y),
            width,
            height,
            type: 'office'
          };
          onAddSection(newSection);
        }
        setIsDrawing(false);
        setDrawStart(null);
      }
    } else {
      // Point selection for pathfinding
      const optimizedPoint = findNearestCorner(point);
      if (!startPoint) {
        onPointSelect(optimizedPoint, 'start');
      } else if (!endPoint) {
        onPointSelect(optimizedPoint, 'end');
      } else {
        // Reset and set new start point
        onPointSelect(optimizedPoint, 'start');
      }
    }
  }, [isAddingSection, isDrawing, drawStart, startPoint, endPoint, onPointSelect, onAddSection, floorData.sections, zoomLevel, mapTransform]);

  // Calculate path when both points are set
  React.useEffect(() => {
    if (startPoint && endPoint) {
      const path = findPath(startPoint, endPoint, floorData.sections, floorData.width, floorData.height);
      setCurrentPath(path);
      
      // Auto-adjust viewport to show the entire route
      if (path.length > 0 && containerRef.current) {
        setTimeout(() => {
          adjustViewportToShowRoute(path);
        }, 100);
      }
    } else {
      setCurrentPath([]);
    }
  }, [startPoint, endPoint, floorData]);

  const adjustViewportToShowRoute = (path: Point[]) => {
    if (!containerRef.current || path.length === 0) return;

    // Calculate bounding box of the route with generous padding
    const padding = isMobile ? 120 : 150;
    let minX = Math.min(...path.map(p => p.x)) - padding;
    let maxX = Math.max(...path.map(p => p.x)) + padding;
    let minY = Math.min(...path.map(p => p.y)) - padding;
    let maxY = Math.max(...path.map(p => p.y)) + padding;

    // Ensure bounds are within map limits
    minX = Math.max(0, minX);
    maxX = Math.min(floorData.width, maxX);
    minY = Math.max(0, minY);
    maxY = Math.min(floorData.height, maxY);

    const routeWidth = maxX - minX;
    const routeHeight = maxY - minY;
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate optimal zoom level to fit the route (with reasonable limits)
    const zoomX = containerRect.width / routeWidth;
    const zoomY = containerRect.height / routeHeight;
    const optimalZoom = Math.min(zoomX, zoomY, isMobile ? 1.5 : 1.8); // Reasonable max zoom
    
    // Don't zoom in too much - maintain minimum view area
    const finalZoom = Math.max(optimalZoom, 0.5);

    // Calculate center point of the route
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate scroll position to center the route
    const scrollLeft = centerX * finalZoom - containerRect.width / 2;
    const scrollTop = centerY * finalZoom - containerRect.height / 2;

    // Apply zoom and scroll
    setZoomLevel(finalZoom);
    containerRef.current.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: 'smooth'
    });
  };
  // Calculate the scaled dimensions
  const scaledWidth = floorData.width * zoomLevel;
  const scaledHeight = floorData.height * zoomLevel;
  const minWidth = isMobile ? Math.max(window.innerWidth * 1.2, 1000) : 800;
  const minHeight = isMobile ? Math.max(window.innerHeight * 0.8, 700) : 600;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 ${isMobile ? 'rounded-lg' : 'rounded-xl'} overflow-auto`}
      style={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        touchAction: 'pan-x pan-y'
      }}
    >
      <svg
        ref={svgRef}
        width={Math.max(scaledWidth, minWidth)}
        height={Math.max(scaledHeight, minHeight)}
        viewBox={`0 0 ${floorData.width} ${floorData.height}`}
        className={`${isMobile ? 'cursor-pointer touch-manipulation' : 'cursor-crosshair'} block`}
        onClick={handleSVGClick}
        style={{
          width: `${Math.max(scaledWidth, minWidth)}px`,
          height: `${Math.max(scaledHeight, minHeight)}px`,
          transformOrigin: '0 0',
          touchAction: 'pan-x pan-y',
          overflowX: 'auto',
          overflowY: 'auto'
        }}
      >
        {/* Grid */}
        <defs>
          {/* Fine grid pattern */}
          <pattern id="fineGrid" width={10 / zoomLevel} height={10 / zoomLevel} patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#4B5563" strokeWidth="0.3" opacity="0.3"/>
          </pattern>
          
          {/* Major grid pattern */}
          <pattern id="majorGrid" width={50 / zoomLevel} height={50 / zoomLevel} patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#6B7280" strokeWidth="0.8" opacity="0.6"/>
            <rect width="50" height="50" fill="url(#fineGrid)"/>
          </pattern>
          
          {/* Professional floor texture */}
          <pattern id="floorTexture" width={100 / zoomLevel} height={100 / zoomLevel} patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="#F3F4F6" opacity="0.05"/>
            <circle cx="25" cy="25" r="1" fill="#E5E7EB" opacity="0.1"/>
            <circle cx="75" cy="75" r="1" fill="#E5E7EB" opacity="0.1"/>
          </pattern>
          
          {/* Gradient definitions */}
          <linearGradient id="startGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="1"/>
            <stop offset="100%" stopColor="#065F46" stopOpacity="0.8"/>
          </linearGradient>
          
          <linearGradient id="endGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="1"/>
            <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.8"/>
          </linearGradient>
        </defs>
        
        {/* Professional floor background */}
        <rect width="100%" height="100%" fill="#1F2937" />
        <rect width="100%" height="100%" fill="url(#majorGrid)" />
        <rect width="100%" height="100%" fill="url(#floorTexture)" />

        {/* Floor plan border */}
        <rect 
          x="2" 
          y="2" 
          width={floorData.width - 4} 
          height={floorData.height - 4} 
          fill="none" 
          stroke="#9CA3AF" 
          strokeWidth="3" 
          strokeDasharray="10,5"
          opacity="0.8"
        />

        {/* Office Sections */}
        {floorData.sections.map((section) => (
          <OfficeSpace
            key={section.id}
            section={section}
            isSelected={selectedSection === section.id}
            onSelect={() => onSectionSelect(section.id)}
            onUpdate={(updates) => onSectionUpdate(section.id, updates)}
            color={getSectionTypeColor(section.type)}
            zoomLevel={zoomLevel}
          />
        ))}

        {/* Corner indicators for better UX */}
        {floorData.sections.map((section) => (
          <g key={`corners-${section.id}`}>
            {[
              { x: section.x, y: section.y },
              { x: section.x + section.width, y: section.y },
              { x: section.x, y: section.y + section.height },
              { x: section.x + section.width, y: section.y + section.height }
            ].map((corner, index) => (
              <circle
                key={index}
                cx={corner.x}
                cy={corner.y}
                r={(isMobile ? 4 : 1.5) / zoomLevel}
                fill="#3B82F6"
                fillOpacity={isMobile ? "0.8" : "0.5"}
                className="pointer-events-none"
                stroke="#FFFFFF"
                strokeWidth={0.5 / zoomLevel}
              />
            ))}
          </g>
        ))}
        {/* Path Visualization */}
        {currentPath.length > 0 && (
          <PathVisualization path={currentPath} isMobile={isMobile} isNavigating={isNavigating} zoomLevel={zoomLevel} />
        )}

        {/* Start Point */}
        {startPoint && (
          <g>
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={(isMobile ? 20 : 10) / zoomLevel}
              fill="url(#startGradient)"
              stroke="#FFFFFF"
              strokeWidth={(isMobile ? 5 : 3) / zoomLevel}
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
            />
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={(isMobile ? 10 : 5) / zoomLevel}
              fill="#FFFFFF"
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
            />
            <text
              x={startPoint.x}
              y={startPoint.y - (isMobile ? 32 : 18) / zoomLevel}
              fill="#10B981"
              fontSize={(isMobile ? 18 : 12) / zoomLevel}
              fontWeight="bold"
              textAnchor="middle"
              className="drop-shadow-sm"
            >
              START
            </text>
          </g>
        )}

        {/* End Point */}
        {endPoint && (
          <g>
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r={(isMobile ? 20 : 10) / zoomLevel}
              fill="url(#endGradient)"
              stroke="#FFFFFF"
              strokeWidth={(isMobile ? 5 : 3) / zoomLevel}
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
            />
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r={(isMobile ? 10 : 5) / zoomLevel}
              fill="#FFFFFF"
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
            />
            <text
              x={endPoint.x}
              y={endPoint.y - (isMobile ? 32 : 18) / zoomLevel}
              fill="#EF4444"
              fontSize={(isMobile ? 18 : 12) / zoomLevel}
              fontWeight="bold"
              textAnchor="middle"
              className="drop-shadow-sm"
            >
              END
            </text>
          </g>
        )}

        {/* Drawing preview */}
        {isDrawing && drawStart && (
          <rect
            x={drawStart.x}
            y={drawStart.y}
            width="0"
            height="0"
            fill="#10B981"
            fillOpacity="0.3"
            stroke="#10B981"
            strokeWidth={2 / zoomLevel}
            strokeDasharray="5,5"
          />
        )}
      </svg>

    </div>
  );
};

export default FloorMap;