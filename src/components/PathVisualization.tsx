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
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-lg"
      />
      
      {/* Animated path overlay */}
      <path
        d={pathString}
        fill="none"
        stroke="#34D399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="15,15"
        className="animate-pulse drop-shadow-sm"
      />
      
      {/* Path points */}
      {path.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#10B981"
          stroke="#FFFFFF"
          strokeWidth="2"
          className="animate-pulse drop-shadow-lg"
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
              points="-6,-3 6,0 -6,3"
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth="1"
              className="drop-shadow-sm"
            />
          </g>
        );
      })}
    </g>
  );
};

export default PathVisualization;