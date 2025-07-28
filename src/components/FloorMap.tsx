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
  isNavigating
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
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
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
  }, [isAddingSection, isDrawing, drawStart, startPoint, endPoint, onPointSelect, onAddSection, floorData.sections]);

  // Calculate path when both points are set
  React.useEffect(() => {
    if (startPoint && endPoint) {
      const path = findPath(startPoint, endPoint, floorData.sections, floorData.width, floorData.height);
      setCurrentPath(path);
    } else {
      setCurrentPath([]);
    }
  }, [startPoint, endPoint, floorData]);

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'overflow-auto' : 'overflow-auto'} ${isMobile ? 'touch-pan-x touch-pan-y' : 'touch-pan-x touch-pan-y'}`}>
      <svg
        ref={svgRef}
        width={Math.max(floorData.width, isMobile ? Math.max(window.innerWidth * 1.2, 1000) : 800)}
        height={Math.max(floorData.height, isMobile ? Math.max(window.innerHeight * 0.8, 700) : 600)}
        viewBox={`0 0 ${floorData.width} ${floorData.height}`}
        className={`${isMobile ? 'cursor-pointer touch-manipulation' : 'cursor-crosshair'} ${isMobile ? 'w-full h-full' : 'min-w-full min-h-full'}`}
        onClick={handleSVGClick}
        style={isMobile ? { 
          minWidth: `${Math.max(floorData.width, Math.max(window.innerWidth * 1.2, 1000))}px`,
          minHeight: `${Math.max(floorData.height, Math.max(window.innerHeight * 0.8, 700))}px`
        } : {}}
      >
        {/* Grid */}
        <defs>
          {/* Fine grid pattern */}
          <pattern id="fineGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#4B5563" strokeWidth="0.3" opacity="0.3"/>
          </pattern>
          
          {/* Major grid pattern */}
          <pattern id="majorGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#6B7280" strokeWidth="0.8" opacity="0.6"/>
            <rect width="50" height="50" fill="url(#fineGrid)"/>
          </pattern>
          
          {/* Professional floor texture */}
          <pattern id="floorTexture" width="100" height="100" patternUnits="userSpaceOnUse">
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
                r={isMobile ? "4" : "1.5"}
                fill="#3B82F6"
                fillOpacity={isMobile ? "0.8" : "0.5"}
                className="pointer-events-none"
                stroke="#FFFFFF"
                strokeWidth="0.5"
              />
            ))}
          </g>
        ))}
        {/* Path Visualization */}
        {currentPath.length > 0 && (
          <PathVisualization path={currentPath} isMobile={isMobile} isNavigating={isNavigating} />
        )}

        {/* Start Point */}
        {startPoint && (
          <g>
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={isMobile ? "20" : "10"}
              fill="url(#startGradient)"
              stroke="#FFFFFF"
              strokeWidth={isMobile ? "5" : "3"}
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
            />
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={isMobile ? "10" : "5"}
              fill="#FFFFFF"
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
            />
            <text
              x={startPoint.x}
              y={startPoint.y - (isMobile ? 32 : 18)}
              fill="#10B981"
              fontSize={isMobile ? "18" : "12"}
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
              r={isMobile ? "20" : "10"}
              fill="url(#endGradient)"
              stroke="#FFFFFF"
              strokeWidth={isMobile ? "5" : "3"}
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
            />
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r={isMobile ? "10" : "5"}
              fill="#FFFFFF"
              className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
            />
            <text
              x={endPoint.x}
              y={endPoint.y - (isMobile ? 32 : 18)}
              fill="#EF4444"
              fontSize={isMobile ? "18" : "12"}
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
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Instructions */}
      <div className={`absolute ${isMobile ? 'top-3 left-3' : 'top-4 left-4'} bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-xl' : 'rounded-xl'} ${isMobile ? 'p-3' : 'p-3'} ${isMobile ? 'text-sm' : 'text-xs md:text-sm'} shadow-xl border border-gray-300/50 ${isMobile ? 'max-w-[160px]' : ''}`}>
        {isNavigating ? (
          <div className="text-blue-600">
            <p className={`font-bold flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2 h-2'} bg-blue-600 rounded-full animate-pulse`}></div>
              🧭 Navigating
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-1'} text-gray-700`}>
              {isMobile ? 'Following route' : 'Following the optimal route'}
            </p>
          </div>
        ) : isAddingSection ? (
          <div className="text-emerald-600">
            <p className={`font-bold flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2 h-2'} bg-emerald-600 rounded-full animate-pulse`}></div>
              Adding Section Mode
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-1'} text-gray-700`}>
              {isMobile ? 'Tap twice to create' : 'Click two points to create a rectangle'}
            </p>
          </div>
        ) : (
          <div className="text-blue-600">
            <p className={`font-bold flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2 h-2'} bg-blue-600 rounded-full animate-pulse`}></div>
              Navigation Mode
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-1'} text-gray-700`}>
              {isMobile ? 'Tap to set points' : 'Click near corners for optimal paths'}
            </p>
            {isMobile && (
              <p className={`${isMobile ? 'mt-1 text-xs' : 'mt-1'} text-gray-500`}>
                Swipe to navigate
              </p>
            )}
          </div>
        )}
      </div>

      {/* Path info */}
      {currentPath.length > 0 && (
        <div className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-xl' : 'rounded-xl'} ${isMobile ? 'p-3' : 'p-3'} ${isMobile ? 'text-sm' : 'text-xs md:text-sm'} ${isMobile ? 'min-w-[120px]' : 'min-w-[120px]'} shadow-xl border border-gray-300/50`}>
          <div className={`${isNavigating ? 'text-blue-600' : 'text-emerald-600'}`}>
            <p className={`font-bold flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              <div className={`${isMobile ? 'w-2 h-2' : 'w-2 h-2'} ${isNavigating ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full animate-pulse`}></div>
              {isNavigating ? '🧭 Active' : 'Route Ready'}
            </p>
            {startPoint && endPoint && (
              <>
                <p className={`${isMobile ? 'mt-2' : 'mt-1'} font-medium`}>
                  {isMobile ? '' : 'Distance: '}{formatDistance(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel))}
                </p>
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 ${isMobile ? 'mt-1' : 'mt-1'}`}>
                  {isMobile ? '~' : 'Walking time: ~'}{Math.ceil(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel) / 1.4)} sec
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile Reset Selection Button */}
      {isMobile && selectedSection && (
        <button
          onClick={() => onSectionSelect(null)}
          className="fixed bottom-6 right-6 p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 transform hover:scale-110 z-50"
          style={{ zIndex: 1000 }}
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default FloorMap;