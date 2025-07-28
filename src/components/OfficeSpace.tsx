import React, { useState } from 'react';
import { OfficeSection } from '../types';

interface OfficeSpaceProps {
  section: OfficeSection;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<OfficeSection>) => void;
  color: string;
  zoomLevel?: number;
}

const OfficeSpace: React.FC<OfficeSpaceProps> = ({
  section,
  isSelected,
  isHighlighted = false,
  onSelect,
  onUpdate,
  color,
  zoomLevel = 1
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // For mobile, we need to handle touch events differently
    if ('ontouchstart' in window) {
      // Mobile touch handling
      setIsDragging(true);
      const rect = (event.target as Element).closest('svg')?.getBoundingClientRect();
      if (rect) {
        setDragStart({
          x: event.clientX - rect.left - section.x,
          y: event.clientY - rect.top - section.y
        });
      }
    } else {
      // Desktop mouse handling
      setIsDragging(true);
      setDragStart({
        x: event.clientX - section.x,
        y: event.clientY - section.y
      });
    }
    onSelect();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    
    let newX, newY;
    
    if ('ontouchstart' in window) {
      // Mobile touch handling
      const rect = (event.target as Element).closest('svg')?.getBoundingClientRect();
      if (rect) {
        newX = event.clientX - rect.left - dragStart.x;
        newY = event.clientY - rect.top - dragStart.y;
      } else {
        return;
      }
    } else {
      // Desktop mouse handling
      newX = event.clientX - dragStart.x;
      newY = event.clientY - dragStart.y;
    }
    
    onUpdate({ x: Math.max(0, newX), y: Math.max(0, newY) });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        let newX, newY;
        
        if ('ontouchstart' in window) {
          // For mobile, we need to find the SVG element to get proper coordinates
          const svgElement = document.querySelector('svg');
          const rect = svgElement?.getBoundingClientRect();
          if (rect) {
            newX = event.clientX - rect.left - dragStart.x;
            newY = event.clientY - rect.top - dragStart.y;
          } else {
            return;
          }
        } else {
          newX = event.clientX - dragStart.x;
          newY = event.clientY - dragStart.y;
        }
        
        onUpdate({ x: Math.max(0, newX), y: Math.max(0, newY) });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, onUpdate]);

  return (
    <g
      className={`${('ontouchstart' in window) ? 'cursor-pointer' : 'cursor-move'} transition-all duration-300 ${
        isSelected || isHighlighted ? 'drop-shadow-lg' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Highlight glow effect */}
      {isHighlighted && (
        <rect
          x={section.x - 8 / zoomLevel}
          y={section.y - 8 / zoomLevel}
          width={section.width + 16 / zoomLevel}
          height={section.height + 16 / zoomLevel}
          fill="none"
          stroke="#60A5FA"
          strokeWidth={6 / zoomLevel}
          strokeOpacity={0.6}
          rx={12 / zoomLevel}
          ry={12 / zoomLevel}
          className="animate-pulse"
          filter="blur(2px)"
        />
      )}
      
      <rect
        x={section.x}
        y={section.y}
        width={section.width}
        height={section.height}
        fill={color}
        fillOpacity={isSelected ? 0.95 : isHighlighted ? 0.9 : 0.85}
        stroke={isSelected ? '#FFFFFF' : isHighlighted ? '#60A5FA' : '#FFFFFF'}
        strokeWidth={(isSelected ? 4 : isHighlighted ? 3 : 2) / zoomLevel}
        strokeOpacity={isSelected ? 1 : isHighlighted ? 0.8 : 0.6}
        rx={8 / zoomLevel}
        ry={8 / zoomLevel}
        className={`transition-all duration-300 ${isHighlighted ? 'animate-pulse' : ''}`}
        filter={isSelected ? "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" : isHighlighted ? "drop-shadow(0 4px 8px rgba(96,165,250,0.3))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"}
      />
      
      <text
        x={section.x + section.width / 2}
        y={section.y + section.height / 2}
        fill="white"
        fontSize={Math.min(('ontouchstart' in window) ? 18 : 16, section.width / 6, section.height / 3) / zoomLevel}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
        className={`select-none drop-shadow-sm ${isHighlighted ? 'animate-pulse' : ''}`}
      >
        {section.width < 100 ? section.name.split(' ')[0] : section.name}
      </text>
      
      {section.type && (
        <text
          x={section.x + section.width / 2}
          y={section.y + section.height / 2 + 18 / zoomLevel}
          fill="rgba(255,255,255,0.8)"
          fontSize={Math.min(('ontouchstart' in window) ? 15 : 13, section.width / 8, section.height / 5) / zoomLevel}
          fontWeight="400"
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
          className={`select-none capitalize drop-shadow-sm ${isHighlighted ? 'animate-pulse' : ''}`}
        >
          {section.width < 80 ? '' : section.type}
        </text>
      )}

      {/* Resize handles for selected sections */}
      {isSelected && (
        <>
          <circle
            cx={section.x + section.width}
            cy={section.y + section.height}
            r={(('ontouchstart' in window) ? 10 : 8) / zoomLevel}
            fill="#FFFFFF"
            stroke={color}
            strokeWidth={(('ontouchstart' in window) ? 3 : 2) / zoomLevel}
            className="cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              // Handle resize logic here if needed
            }}
          />
        </>
      )}
    </g>
  );
};

export default OfficeSpace;