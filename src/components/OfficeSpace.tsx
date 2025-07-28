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
      className={`cursor-move transition-all duration-300 ${
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
        fillOpacity={isSelected ? 0.9 : 0.7}
        stroke={isSelected ? '#FFFFFF' : '#FFFFFF'}
        strokeWidth={isSelected ? 3 : 1.5}
        strokeOpacity={isSelected ? 1 : 0.3}
        rx="6"
        ry="6"
        className="transition-all duration-300"
      />
      
      <text
        x={section.x + section.width / 2}
        y={section.y + section.height / 2}
        fill="white"
        fontSize={Math.min(16, section.width / 6, section.height / 3)}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
        className="select-none drop-shadow-sm"
      >
        {section.width < 100 ? section.name.split(' ')[0] : section.name}
      </text>
      
      {section.type && (
        <text
          x={section.x + section.width / 2}
          y={section.y + section.height / 2 + 18}
          fill="rgba(255,255,255,0.8)"
          fontSize={Math.min(13, section.width / 8, section.height / 5)}
          fontWeight="500"
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
          className="select-none capitalize drop-shadow-sm"
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
            r="6"
            fill="#FFFFFF"
            stroke={color}
            strokeWidth="4"
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