import React, { useState, useRef, useCallback } from 'react';
import { FloorData, Point, OfficeSection } from '../types';
import { findPath } from '../utils/pathfinding';
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
      if (!startPoint) {
        onPointSelect(point, 'start');
      } else if (!endPoint) {
        onPointSelect(point, 'end');
      } else {
        // Reset and set new start point
        onPointSelect(point, 'start');
      }
    }
  }, [isAddingSection, isDrawing, drawStart, startPoint, endPoint, onPointSelect, onAddSection]);

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
    <div className="relative w-full h-full bg-gray-700 rounded-lg overflow-auto">
      <svg
        ref={svgRef}
        width={Math.max(floorData.width, 800)}
        height={Math.max(floorData.height, 600)}
        viewBox={`0 0 ${floorData.width} ${floorData.height}`}
        className="cursor-crosshair min-w-full min-h-full"
        onClick={handleSVGClick}
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Background */}
        <rect width="100%" height="100%" fill="#1F2937" fillOpacity="0.5" />

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
              r="8"
              fill="#10B981"
              stroke="#065F46"
              strokeWidth="2"
              className="animate-pulse"
            />
            <text
              x={startPoint.x}
              y={startPoint.y - 15}
              fill="#10B981"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
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
              r="8"
              fill="#EF4444"
              stroke="#7F1D1D"
              strokeWidth="2"
              className="animate-pulse"
            />
            <text
              x={endPoint.x}
              y={endPoint.y - 15}
              fill="#EF4444"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
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
      <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-gray-800 bg-opacity-90 rounded-lg p-2 md:p-3 text-xs md:text-sm">
        {isAddingSection ? (
          <div className="text-emerald-400">
            <p className="font-semibold">Adding Section Mode</p>
            <p className="hidden sm:block">Click two points to create a rectangle</p>
            <p className="sm:hidden">Click twice to create</p>
          </div>
        ) : (
          <div className="text-blue-400">
            <p className="font-semibold">Navigation Mode</p>
            <p className="hidden sm:block">Click to set start and end points</p>
            <p className="sm:hidden">Click to set points</p>
          </div>
        )}
      </div>

      {/* Path info */}
      {currentPath.length > 0 && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-gray-800 bg-opacity-90 rounded-lg p-2 md:p-3 text-xs md:text-sm">
          <div className="text-emerald-400">
            <p className="font-semibold">Path Found</p>
            <p className="hidden sm:block">Distance: {Math.round(currentPath.length * 2)} units</p>
            <p className="sm:hidden">{Math.round(currentPath.length * 2)}u</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorMap;