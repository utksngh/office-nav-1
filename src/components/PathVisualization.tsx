import React from 'react';
import { Point } from '../types';

interface PathVisualizationProps {
  path: Point[];
  isMobile?: boolean;
  isNavigating?: boolean;
  zoomLevel?: number;
}

const PathVisualization: React.FC<PathVisualizationProps> = ({ path, isMobile = false, isNavigating = false, zoomLevel = 1 }) => {
  if (path.length < 2) return null;

  const pathString = path.reduce((acc, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${acc} ${command} ${point.x} ${point.y}`;
  }, '');

  return (
    <g>
      {/* Path line */}
      <path
        d={pathString}
        fill="none"
        stroke={isNavigating ? "#3B82F6" : "#10B981"}
        strokeWidth={(isMobile ? 10 : 6) / zoomLevel}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`drop-shadow-lg ${isNavigating ? 'animate-pulse' : ''}`}
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        }}
      />
      
      {/* Animated path overlay */}
      <path
        d={pathString}
        fill="none"
        stroke={isNavigating ? "#60A5FA" : "#34D399"}
        strokeWidth={(isMobile ? 5 : 3) / zoomLevel}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${(isMobile ? 25 : 15) / zoomLevel},${(isMobile ? 25 : 15) / zoomLevel}`}
        className={`drop-shadow-sm`}
        style={isNavigating ? {
          animation: 'dash 2s linear infinite',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        } : {}}
      />
      
      {/* Add CSS animation for moving dashes when navigating */}
      {isNavigating && (
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: ${-(isMobile ? 50 : 30)};
              }
            }
          `}
        </style>
      )}
      
      {/* Route glow effect */}
      <path
        d={pathString}
        fill="none"
        stroke={isNavigating ? "#3B82F6" : "#10B981"}
        strokeWidth={(isMobile ? 20 : 12) / zoomLevel}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.1"
        className="animate-pulse"
      />
      
      {/* Path points */}
      {path.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={(isMobile ? 8 : 4) / zoomLevel}
          fill={isNavigating ? "#3B82F6" : "#10B981"}
          stroke="#FFFFFF"
          strokeWidth={(isMobile ? 4 : 2) / zoomLevel}
          className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'}`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
      ))}
      
      {/* Direction arrows */}
      {path.map((point, index) => {
        if (index === 0 || index === path.length - 1) return null;
        
        const prev = path[index - 1];
        const next = path[index + 1];
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        
        return (
          <g key={`arrow-${index}`} transform={`translate(${point.x}, ${point.y}) rotate(${angle * 180 / Math.PI})`}>
            <polygon
              points={isMobile ? `${-10/zoomLevel},${-5/zoomLevel} ${10/zoomLevel},0 ${-10/zoomLevel},${5/zoomLevel}` : `${-6/zoomLevel},${-3/zoomLevel} ${6/zoomLevel},0 ${-6/zoomLevel},${3/zoomLevel}`}
              fill={isNavigating ? "#3B82F6" : "#10B981"}
              stroke="#FFFFFF"
              strokeWidth={(isMobile ? 3 : 1) / zoomLevel}
              className={`${isNavigating ? 'animate-pulse' : ''}`}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
          </g>
        );
      })}
    </g>
  );
};

export default PathVisualization;