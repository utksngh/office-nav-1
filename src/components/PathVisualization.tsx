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
        stroke={isNavigating ? "#374151" : "#00B29E"}
        strokeWidth={(isMobile ? 12 : 8) / zoomLevel}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`drop-shadow-lg ${isNavigating ? 'animate-pulse' : ''}`}
      />
      
      {/* Animated path overlay */}
      <path
        d={pathString}
        fill="none"
        stroke={isNavigating ? "#6B7280" : "#5EEAD4"}
        strokeWidth={(isMobile ? 6 : 4) / zoomLevel}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${(isMobile ? 30 : 20) / zoomLevel},${(isMobile ? 30 : 20) / zoomLevel}`}
        className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-sm`}
        style={isNavigating ? {
          animation: 'dash 2s linear infinite'
        } : {}}
      />
      
      {/* Add CSS animation for moving dashes when navigating */}
      {isNavigating && (
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -50;
              }
            }
          `}
        </style>
      )}
      
      {/* Path points */}
      {path.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={(isMobile ? 10 : 6) / zoomLevel}
          fill={isNavigating ? "#374151" : "#00B29E"}
          stroke="#FFFFFF"
          strokeWidth={(isMobile ? 5 : 3) / zoomLevel}
          className={`${isNavigating ? 'animate-bounce' : 'animate-pulse'} drop-shadow-lg`}
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
              points={isMobile ? `${-12/zoomLevel},${-6/zoomLevel} ${12/zoomLevel},0 ${-12/zoomLevel},${6/zoomLevel}` : `${-8/zoomLevel},${-4/zoomLevel} ${8/zoomLevel},0 ${-8/zoomLevel},${4/zoomLevel}`}
              fill={isNavigating ? "#374151" : "#00B29E"}
              stroke="#FFFFFF"
              strokeWidth={(isMobile ? 4 : 2) / zoomLevel}
              className={`drop-shadow-sm ${isNavigating ? 'animate-pulse' : ''}`}
            />
          </g>
        );
      })}
    </g>
  );
};

export default PathVisualization;