import React, { useState, useRef, useCallback } from 'react';
import { FloorData, Point, OfficeSection } from '../types';
import { findPath } from '../utils/pathfinding';
import { calculatePixelDistanceInMeters, formatDistance } from '../utils/geoUtils';
import OfficeSpace from './OfficeSpace';
import PathVisualization from './PathVisualization';

interface FloorMapProps {
  floorData: FloorData;
  startPoint: Point | null;
  endPoint: Point | null;
  onPointSelect: (point: Point, type: 'start' | 'end') => void;
  isAddingSection: boolean;
  onAddSection: (section: Omit<OfficeSection, 'id'>) => void;
  selectedSection: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<OfficeSection>) => void;
  isMobile: boolean;
}

const FloorMap: React.FC<FloorMapProps> = ({
  floorData,
  startPoint,
  endPoint,
  onPointSelect,
  isAddingSection,
  onAddSection,
  selectedSection,
  onSectionSelect,
  onSectionUpdate
  isMobile
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
    <div className="relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl overflow-auto">
      <svg
        ref={svgRef}
        width={Math.max(floorData.width, isMobile ? 600 : 800)}
        height={Math.max(floorData.height, isMobile ? 400 : 600)}
        viewBox={`0 0 ${floorData.width} ${floorData.height}`}
        className={`cursor-crosshair min-w-full min-h-full ${isMobile ? 'touch-manipulation' : ''}`}
        onClick={handleSVGClick}
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width={isMobile ? "30" : "20"} height={isMobile ? "30" : "20"} patternUnits="userSpaceOnUse">
            <path d={`M ${isMobile ? "30" : "20"} 0 L 0 0 0 ${isMobile ? "30" : "20"}`} fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.4"/>
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
        
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Background */}
        <rect width="100%" height="100%" fill="#1F2937" fillOpacity="0.6" />

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
                r={isMobile ? "3" : "2"}
                fill="#10B981"
                fillOpacity="0.6"
                className="pointer-events-none"
              />
            ))}
          </g>
        ))}
        {/* Path Visualization */}
        {currentPath.length > 0 && (
          <PathVisualization path={currentPath} />
        )}

        {/* Start Point */}
        {startPoint && (
          <g>
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={isMobile ? "12" : "10"}
              fill="url(#startGradient)"
              stroke="#FFFFFF"
              strokeWidth="3"
              className="animate-pulse drop-shadow-lg"
            />
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r={isMobile ? "6" : "5"}
              fill="#FFFFFF"
              className="animate-pulse"
            />
            <text
              x={startPoint.x}
              y={startPoint.y - (isMobile ? 20 : 18)}
              fill="#10B981"
              fontSize={isMobile ? "14" : "12"}
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
              r={isMobile ? "12" : "10"}
              fill="url(#endGradient)"
              stroke="#FFFFFF"
              strokeWidth="3"
              className="animate-pulse drop-shadow-lg"
            />
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r={isMobile ? "6" : "5"}
              fill="#FFFFFF"
              className="animate-pulse"
            />
            <text
              x={endPoint.x}
              y={endPoint.y - (isMobile ? 20 : 18)}
              fill="#EF4444"
              fontSize={isMobile ? "14" : "12"}
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
      <div className={`absolute ${isMobile ? 'top-2 left-2' : 'top-4 left-4'} bg-gray-800/95 backdrop-blur-sm rounded-xl p-3 text-xs md:text-sm shadow-xl border border-gray-700/50`}>
        {isAddingSection ? (
          <div className="text-emerald-400">
            <p className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              Adding Section Mode
            </p>
            <p className={isMobile ? 'text-xs mt-1' : 'mt-1'}>
              {isMobile ? 'Tap twice to create' : 'Click two points to create a rectangle'}
            </p>
          </div>
        ) : (
          <div className="text-blue-400">
            <p className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Navigation Mode
            </p>
            <p className={isMobile ? 'text-xs mt-1' : 'mt-1'}>
              {isMobile ? 'Tap to set points' : 'Click near corners for optimal paths'}
            </p>
          </div>
        )}
      </div>

      {/* Path info */}
      {currentPath.length > 0 && (
        <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} bg-gray-800/95 backdrop-blur-sm rounded-xl p-3 text-xs md:text-sm min-w-[120px] shadow-xl border border-gray-700/50`}>
          <div className="text-emerald-400">
            <p className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              Route Ready
            </p>
            {startPoint && endPoint && (
              <>
                <p className="mt-1 font-medium">
                  {isMobile ? '' : 'Distance: '}{formatDistance(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel))}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {isMobile ? '~' : 'Walking time: ~'}{Math.ceil(calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel) / 1.4)} sec
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorMap;