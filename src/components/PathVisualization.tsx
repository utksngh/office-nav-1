import React from 'react';
import { Point } from '../types';

interface PathVisualizationProps {
  path: Point[];
}

const PathVisualization: React.FC<PathVisualizationProps> = ({ path }) => {
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
        stroke="#10B981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      
      {/* Animated path overlay */}
      <path
        d={pathString}
        fill="none"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="10,10"
        className="animate-pulse"
      />
      
      {/* Path points */}
      {path.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#10B981"
          stroke="#065F46"
          strokeWidth="1"
          className="animate-pulse"
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
              points="-4,-2 4,0 -4,2"
              fill="#10B981"
              stroke="#065F46"
              strokeWidth="0.5"
            />
          </g>
        );
      })}
    </g>
  );
};

export default PathVisualization;