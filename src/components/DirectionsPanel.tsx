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
  onPathUpdate: (path: Point[]) => void;
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
  onResetZoom,
  onPathUpdate
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

    if (isAddingSection) {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawStart(point);
      } else {
        if (drawStart) {
          const width = Math.abs(x - drawStart.x);
          const height = Math.abs(y - drawStart.y);
          const newSection: Omit<OfficeSection, 'id'> = {
      const nearby = findNearbyLandmarks(checkPoint, 50);
            x: Math.min(drawStart.x, x),
            y: Math.min(drawStart.y, y),
            width,
            height,
            type: 'office'
        if (!passing.includes(landmark) && !excludeNearby.includes(landmark)) {
          onAddSection(newSection);
        }
        setIsDrawing(false);
        setDrawStart(null);
      }
    } else {
      // Point selection for pathfinding
      // Use exact clicked point - no snapping or optimization
      if (!startPoint) {
        onPointSelect(point, 'start');
      } else if (!endPoint) {
        onPointSelect(point, 'end');
      } else {
        // Reset and set new start point
        onPointSelect(point, 'start');
      }
    }
  }, [isAddingSection, isDrawing, drawStart, startPoint, endPoint, onPointSelect, onAddSection, zoomLevel, mapTransform]);

  // Calculate path when both points are set
  React.useEffect(() => {
    if (startPoint && endPoint) {
      const path = findPath(startPoint, endPoint, floorData.sections, floorData.width, floorData.height);
      setCurrentPath(path);
      onPathUpdate(path);
    } else {
      setCurrentPath([]);
      onPathUpdate([]);
    }
  }, [startPoint, endPoint, floorData, onPathUpdate]);

  // Calculate the scaled dimensions
  const scaledWidth = floorData.width * zoomLevel;
  const scaledHeight = floorData.height * zoomLevel;
  const minWidth = isMobile ? Math.max(window.innerWidth * 1.2, 1000) : 800;
  const minHeight = isMobile ? Math.max(window.innerHeight * 0.8, 700) : 600;

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 ${isMobile ? 'rounded-lg' : 'rounded-xl'} overflow-auto`}>
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
        {/* Corner indicators - only show when adding sections */}
        {isAddingSection && floorData.sections.map((section) => (
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
                r={(isMobile ? 3 : 1) / zoomLevel}
                fill="#3B82F6"
                fillOpacity="0.6"
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

      {/* Instructions */}
      <div className={`absolute ${isMobile ? 'top-2 left-2' : 'top-4 left-4'} bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-2.5' : 'p-3'} ${isMobile ? 'text-xs' : 'text-xs md:text-sm'} shadow-xl border border-gray-300/50 ${isMobile ? 'max-w-[160px]' : ''}`}>
        {isNavigating ? (
          <div className="text-blue-600">
            <p className={`font-bold flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-blue-600 rounded-full animate-pulse`}></div>
              🧭 Navigating
            </p>
            <p className={`${isMobile ? 'mt-1' : 'mt-1'} text-gray-700`}>
              Following route
            </p>
          </div>
        ) : isAddingSection ? (
          <div className="text-emerald-600">
            <p className={`font-bold flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-emerald-600 rounded-full animate-pulse`}></div>
              {isMobile ? 'Adding Room' : 'Adding Section Mode'}
            </p>
            <p className={`${isMobile ? 'mt-1' : 'mt-1'} text-gray-700`}>
              {isMobile ? 'Tap twice' : 'Click two points to create a rectangle'}
            </p>
          </div>
        ) : (
          <div className="text-blue-600">
            <p className={`font-bold flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-blue-600 rounded-full animate-pulse`}></div>
              {isMobile ? 'Navigation' : 'Navigation Mode'}
            </p>
            <p className={`${isMobile ? 'mt-1' : 'mt-1'} text-gray-700`}>
              {isMobile ? 'Tap to set' : 'Click near corners for optimal paths'}
            </p>
          </div>
        )}
      </div>

      {/* Path info */}
      {currentPath.length > 0 && (
        <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-2.5' : 'p-3'} ${isMobile ? 'text-xs' : 'text-xs md:text-sm'} ${isMobile ? 'min-w-[100px]' : 'min-w-[120px]'} shadow-xl border border-gray-300/50`}>
          <div className={`${isNavigating ? 'text-blue-600' : 'text-emerald-600'}`}>
            <p className={`font-bold flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${isNavigating ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full animate-pulse`}></div>
              {isNavigating ? '🧭 Active' : 'Route Ready'}
            </p>
            {startPoint && endPoint && (
              <>
                <p className={`${isMobile ? 'mt-1' : 'mt-1'} font-medium`}>
                  {formatDistance(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel))}
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
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
          className="fixed bottom-4 right-4 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 transform hover:scale-110 z-50 min-w-[48px] min-h-[48px] flex items-center justify-center"
          style={{ zIndex: 1000 }}
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      {/* Mobile Zoom Controls - Alternative Position */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-40">
          <button
            onClick={onZoomIn}
            className="p-2.5 bg-gray-800/90 backdrop-blur-sm text-white rounded-full shadow-2xl border border-gray-600/50 transition-all duration-300 transform hover:scale-110 min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          
          <button
            onClick={onResetZoom}
            className="px-2.5 py-1.5 bg-gray-800/90 backdrop-blur-sm text-white rounded-full shadow-2xl border border-gray-600/50 transition-all duration-300 transform hover:scale-110 min-w-[48px] min-h-[36px] flex items-center justify-center font-mono text-xs font-semibold"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          
          <button
            onClick={onZoomOut}
            className="p-2.5 bg-gray-800/90 backdrop-blur-sm text-white rounded-full shadow-2xl border border-gray-600/50 transition-all duration-300 transform hover:scale-110 min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FloorMap;