import React, { useState } from 'react';
import { OfficeSection } from '../types';

interface OfficeSpaceProps {
  section: OfficeSection;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<OfficeSection>) => void;
  color: string;
}

const OfficeSpace: React.FC<OfficeSpaceProps> = ({
  section,
  isSelected,
  onSelect,
  onUpdate,
  color
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: event.clientX - section.x,
      y: event.clientY - section.y
    });
    onSelect();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = event.clientX - dragStart.x;
    const newY = event.clientY - dragStart.y;
    
    onUpdate({ x: Math.max(0, newX), y: Math.max(0, newY) });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const newX = event.clientX - dragStart.x;
        const newY = event.clientY - dragStart.y;
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
      className={`cursor-move transition-all duration-200 ${
        isSelected ? 'drop-shadow-lg' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <rect
        x={section.x}
        y={section.y}
        width={section.width}
        height={section.height}
        fill={color}
        fillOpacity={isSelected ? 0.8 : 0.6}
        stroke={isSelected ? '#FFFFFF' : color}
        strokeWidth={isSelected ? 3 : 1}
        rx="4"
        ry="4"
        className="transition-all duration-200"
      />
      
      <text
        x={section.x + section.width / 2}
        y={section.y + section.height / 2}
        fill="white"
        fontSize={Math.min(12, section.width / 8, section.height / 4)}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
        className="select-none"
      >
        {section.width < 80 ? section.name.split(' ')[0] : section.name}
      </text>
      
      {section.type && (
        <text
          x={section.x + section.width / 2}
          y={section.y + section.height / 2 + 15}
          fill="rgba(255,255,255,0.7)"
          fontSize={Math.min(10, section.width / 10, section.height / 6)}
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
          className="select-none capitalize"
        >
          {section.width < 60 ? '' : section.type}
        </text>
      )}

      {/* Resize handles for selected sections */}
      {isSelected && (
        <>
          <circle
            cx={section.x + section.width}
            cy={section.y + section.height}
            r="4"
            fill="#FFFFFF"
            stroke={color}
            strokeWidth="2"
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