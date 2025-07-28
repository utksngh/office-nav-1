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
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

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
    } else {
      setCurrentPath([]);
    }
  }, [startPoint, endPoint, floorData]);

  // Calculate the scaled dimensions
  const scaledWidth = floorData.width * zoomLevel;
  const scaledHeight = floorData.height * zoomLevel;
  const minWidth = isMobile ? Math.max(window.innerWidth * 1.2, 1000) : 800;
  const minHeight = isMobile ? Math.max(window.innerHeight * 0.8, 700) : 600;

  return (
    <div className={`relative w-full h-full bg-gray-50 ${isMobile ? 'rounded-2xl' : 'rounded-3xl'} overflow-auto border border-gray-200`}>
      <svg
        ref={svgRef}
        width={Math.max(scaledWidth, minWidth)}
        height={Math.max(scaledHeight, minHeight)}
        viewBox={`0 0 ${floorData.width} ${floorData.height}`}
        className={`${isMobile ? 'cursor-pointer touch-manipulation' : 'cursor-crosshair'} ${isMobile ? 'w-full h-full' : 'min-w-full min-h-full'}`}
        onClick={handleSVGClick}
        style={{
          minWidth: `${Math.max(scaledWidth, minWidth)}px`,
          minHeight: `${Math.max(scaledHeight, minHeight)}px`,
          transform: `scale(${zoomLevel}) translate(${mapTransform.x}px, ${mapTransform.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* Grid */}
        <defs>
          {/* Fine grid pattern */}
          <pattern id="fineGrid" width={20 / zoomLevel} height={20 / zoomLevel} patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.8"/>
          </pattern>
          
          {/* Major grid pattern */}
          <pattern id="majorGrid" width={100 / zoomLevel} height={100 / zoomLevel} patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#D1D5DB" strokeWidth="1" opacity="0.8"/>
            <rect width="50" height="50" fill="url(#fineGrid)"/>
          </pattern>
          
          {/* Professional floor texture */}
          <pattern id="floorTexture" width={200 / zoomLevel} height={200 / zoomLevel} patternUnits="userSpaceOnUse">
            <rect width="200" height="200" fill="#FFFFFF" opacity="0.8"/>
            <circle cx="50" cy="50" r="2" fill="#F3F4F6" opacity="0.5"/>
            <circle cx="150" cy="150" r="2" fill="#F3F4F6" opacity="0.5"/>
          </pattern>
          
          {/* Gradient definitions */}
          <defs>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
            </filter>
          </defs>
        </defs>
        
        {/* Professional floor background */}
        <rect width="100%" height="100%" fill="#FFFFFF" />
        <rect width="100%" height="100%" fill="url(#majorGrid)" />
        <rect width="100%" height="100%" fill="url(#floorTexture)" />

        {/* Floor plan border */}
        <rect 
          x="2" 
          y="2" 
          width={floorData.width - 4} 
          height={floorData.height - 4} 
          fill="none" 
          stroke="#6B7280" 
          strokeWidth="4" 
          strokeDasharray="15,8"
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
                r={(isMobile ? 6 : 3) / zoomLevel}
                fill="#6B7280"
                fillOpacity={isMobile ? "0.8" : "0.6"}
                className="pointer-events-none"
                stroke="#FFFFFF"
                strokeWidth={1 / zoomLevel}
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
              r={(isMobile ? 24 : 14) / zoomLevel}
              fill="#00B29E"
              stroke="#FFFFFF"
              strokeWidth={(isMobile ? 6 : 4) / zoomLevel}
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
              filter="url(#softShadow)"
            />
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={(isMobile ? 12 : 7) / zoomLevel}
              fill="#FFFFFF"
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
            />
            <text
              x={startPoint.x}
              y={startPoint.y - (isMobile ? 38 : 24) / zoomLevel}
              fill="#374151"
              fontSize={(isMobile ? 22 : 16) / zoomLevel}
              fontWeight="900"
              textAnchor="middle"
              className="drop-shadow-sm"
              style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
              r={(isMobile ? 24 : 14) / zoomLevel}
              fill="#FA5A5A"
              stroke="#FFFFFF"
              strokeWidth={(isMobile ? 6 : 4) / zoomLevel}
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
              filter="url(#softShadow)"
            />
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r={(isMobile ? 12 : 7) / zoomLevel}
              fill="#FFFFFF"
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
            />
            <text
              x={endPoint.x}
              y={endPoint.y - (isMobile ? 38 : 24) / zoomLevel}
              fill="#374151"
              fontSize={(isMobile ? 22 : 16) / zoomLevel}
              fontWeight="900"
              textAnchor="middle"
              className="drop-shadow-sm"
              style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
            fill="#6B7280"
            fillOpacity="0.3"
            stroke="#6B7280"
            strokeWidth={2 / zoomLevel}
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Instructions */}
      <div className={`absolute ${isMobile ? 'top-3 left-3' : 'top-6 left-6'} bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-2xl' : 'rounded-2xl'} ${isMobile ? 'p-4' : 'p-5'} ${isMobile ? 'text-sm' : 'text-sm md:text-base'} shadow-lg border border-gray-100 ${isMobile ? 'max-w-[180px]' : ''}`}>
        {isNavigating ? (
          <div className="text-gray-700">
            <p className={`font-black flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-gray-600 rounded-full animate-pulse`}></div>
              🧭 Navigating
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-2'} text-gray-700 font-medium`}>
              Following route
            </p>
          </div>
        ) : isAddingSection ? (
          <div className="text-gray-700">
            <p className={`font-black flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-gray-600 rounded-full animate-pulse`}></div>
              {isMobile ? 'Adding Room' : 'Adding Section Mode'}
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-2'} text-gray-700 font-medium`}>
              {isMobile ? 'Tap twice' : 'Click two points to create a rectangle'}
            </p>
          </div>
        ) : (
          <div className="text-gray-700">
            <p className={`font-black flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-gray-600 rounded-full animate-pulse`}></div>
              {isMobile ? 'Navigation' : 'Navigation Mode'}
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-2'} text-gray-700 font-medium`}>
              {isMobile ? 'Tap to set' : 'Click near corners for optimal paths'}
            </p>
          </div>
        )}
      </div>

      {/* Path info */}
      {currentPath.length > 0 && (
        <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-6 right-6'} bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-2xl' : 'rounded-2xl'} ${isMobile ? 'p-4' : 'p-5'} ${isMobile ? 'text-sm' : 'text-sm md:text-base'} ${isMobile ? 'min-w-[120px]' : 'min-w-[140px]'} shadow-lg border border-gray-100`}>
          <div className="text-gray-700">
            <p className={`font-black flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-gray-600 rounded-full animate-pulse`}></div>
              {isNavigating ? '🧭 Active' : 'Route Ready'}
            </p>
            {startPoint && endPoint && (
              <>
                <p className={`${isMobile ? 'mt-2' : 'mt-2'} font-bold text-lg`}>
                  {formatDistance(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel))}
                </p>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600 font-medium ${isMobile ? 'mt-1' : 'mt-1'}`}>
                  ~{Math.ceil(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel) / 1.4)} sec
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile Reset Selection Button */}
      {isMobile && selectedSection && !isAddingSection && (
        <button
          onClick={() => onSectionSelect(null)}
          className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-3xl shadow-2xl border-2 border-white backdrop-blur-sm transition-all duration-300 transform hover:scale-110 z-50 min-w-[56px] min-h-[56px] flex items-center justify-center"
          style={{ zIndex: 1000 }}
        >
          <X className="w-6 h-6" />
        </button>
      )}
      
      {/* Mobile Zoom Controls - Alternative Position */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-40">
          <button
            onClick={onZoomIn}
            className="p-3 bg-white/95 backdrop-blur-sm text-gray-600 rounded-3xl shadow-lg border border-gray-100 transition-all duration-300 transform hover:scale-105 min-w-[56px] min-h-[56px] flex items-center justify-center"
            title="Zoom In"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          
          <button
            onClick={onResetZoom}
            className="px-3 py-2 bg-white/95 backdrop-blur-sm text-gray-600 rounded-3xl shadow-lg border border-gray-100 transition-all duration-300 transform hover:scale-105 min-w-[56px] min-h-[44px] flex items-center justify-center font-mono text-sm font-bold"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          
          <button
            onClick={onZoomOut}
            className="p-3 bg-white/95 backdrop-blur-sm text-gray-600 rounded-3xl shadow-lg border border-gray-100 transition-all duration-300 transform hover:scale-105 min-w-[56px] min-h-[56px] flex items-center justify-center"
            title="Zoom Out"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FloorMap;