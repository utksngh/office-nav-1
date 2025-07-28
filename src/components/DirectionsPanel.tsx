import React from 'react';
import { Point } from '../types';
import { calculatePixelDistanceInMeters, formatDistance } from '../utils/geoUtils';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp, RotateCw, MapPin, Clock } from 'lucide-react';

interface DirectionsPanelProps {
  path: Point[];
  isVisible: boolean;
  onClose: () => void;
  isMobile: boolean;
  isNavigating: boolean;
  metersPerPixel: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

interface DirectionStep {
  instruction: string;
  distance: number;
  direction: 'straight' | 'left' | 'right' | 'slight_left' | 'slight_right' | 'sharp_left' | 'sharp_right';
  point: Point;
  icon: React.ReactNode;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  path,
  isVisible,
  onClose,
  isMobile,
  isNavigating,
  metersPerPixel,
  currentStep = 0,
  onStepChange
}) => {
  const generateDirections = (): DirectionStep[] => {
    if (path.length < 2) return [];

    const directions: DirectionStep[] = [];
    
    // Start instruction
    directions.push({
      instruction: "Start your journey",
      distance: 0,
      direction: 'straight',
      point: path[0],
      icon: <MapPin className="w-4 h-4 text-emerald-500" />
    });

    // Generate turn-by-turn directions
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      
      const distance = calculatePixelDistanceInMeters(prev, current, metersPerPixel);
      const direction = calculateTurnDirection(prev, current, next);
      
      let instruction = "";
      let icon = <ArrowUp className="w-4 h-4 text-blue-500" />;
      
      switch (direction) {
        case 'straight':
          instruction = `Continue straight for ${formatDistance(distance)}`;
          icon = <ArrowUp className="w-4 h-4 text-blue-500" />;
          break;
        case 'left':
          instruction = `Turn left and continue for ${formatDistance(distance)}`;
          icon = <ArrowLeft className="w-4 h-4 text-orange-500" />;
          break;
        case 'right':
          instruction = `Turn right and continue for ${formatDistance(distance)}`;
          icon = <ArrowRight className="w-4 h-4 text-orange-500" />;
          break;
        case 'slight_left':
          instruction = `Bear left and continue for ${formatDistance(distance)}`;
          icon = <RotateCw className="w-4 h-4 text-yellow-500 transform -rotate-45" />;
          break;
        case 'slight_right':
          instruction = `Bear right and continue for ${formatDistance(distance)}`;
          icon = <RotateCw className="w-4 h-4 text-yellow-500 transform rotate-45" />;
          break;
        case 'sharp_left':
          instruction = `Make a sharp left turn and continue for ${formatDistance(distance)}`;
          icon = <ArrowLeft className="w-4 h-4 text-red-500" />;
          break;
        case 'sharp_right':
          instruction = `Make a sharp right turn and continue for ${formatDistance(distance)}`;
          icon = <ArrowRight className="w-4 h-4 text-red-500" />;
          break;
      }
      
      directions.push({
        instruction,
        distance,
        direction,
        point: current,
        icon
      });
    }

    // Final destination
    const finalDistance = calculatePixelDistanceInMeters(
      path[path.length - 2], 
      path[path.length - 1], 
      metersPerPixel
    );
    
    directions.push({
      instruction: `Arrive at your destination after ${formatDistance(finalDistance)}`,
      distance: finalDistance,
      direction: 'straight',
      point: path[path.length - 1],
      icon: <MapPin className="w-4 h-4 text-red-500" />
    });

    return directions;
  };

  const calculateTurnDirection = (prev: Point, current: Point, next: Point): DirectionStep['direction'] => {
    const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
    const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
    
    let angleDiff = angle2 - angle1;
    
    // Normalize angle to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    const degrees = Math.abs(angleDiff * 180 / Math.PI);
    
    if (degrees < 15) return 'straight';
    if (degrees < 45) return angleDiff > 0 ? 'slight_left' : 'slight_right';
    if (degrees < 135) return angleDiff > 0 ? 'left' : 'right';
    return angleDiff > 0 ? 'sharp_left' : 'sharp_right';
  };

  const directions = generateDirections();
  const totalDistance = path.length > 1 ? 
    calculatePixelDistanceInMeters(path[0], path[path.length - 1], metersPerPixel) : 0;
  const estimatedTime = Math.ceil(totalDistance / 1.4); // Assuming 1.4 m/s walking speed

  if (!isVisible || path.length < 2) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}
      
      <div className={`
        ${isMobile ? 'fixed bottom-0 left-0 right-0' : 'absolute top-4 right-4 w-80 lg:w-96'}
        ${isMobile ? 'max-h-[70vh]' : 'max-h-[calc(100vh-2rem)]'}
        bg-white/95 backdrop-blur-sm rounded-t-2xl ${isMobile ? '' : 'rounded-2xl'} 
        shadow-2xl border border-gray-300/50 z-50 overflow-hidden
        transform transition-all duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white ${isMobile ? 'p-4' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? 'p-2' : 'p-2'} bg-white/20 rounded-lg`}>
                <Navigation className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
              </div>
              <div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-lg'} font-bold`}>
                  {isNavigating ? 'Navigation Active' : 'Route Directions'}
                </h3>
                <div className={`flex items-center gap-4 ${isMobile ? 'text-sm' : 'text-sm'} text-blue-100`}>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {formatDistance(totalDistance)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{estimatedTime} sec
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`${isMobile ? 'p-2' : 'p-2'} hover:bg-white/20 rounded-lg transition-colors duration-200`}
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isNavigating && (
          <div className="bg-gray-200 h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / directions.length) * 100}%` }}
            />
          </div>
        )}

        {/* Current Step Highlight (for navigation mode) */}
        {isNavigating && directions[currentStep] && (
          <div className={`bg-gradient-to-r from-emerald-50 to-blue-50 border-l-4 border-emerald-500 ${isMobile ? 'p-4' : 'p-4'}`}>
            <div className="flex items-start gap-3">
              <div className={`${isMobile ? 'p-2' : 'p-2'} bg-emerald-500 rounded-full flex-shrink-0 mt-1`}>
                {directions[currentStep].icon}
              </div>
              <div className="flex-1">
                <p className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-800 mb-1`}>
                  Step {currentStep + 1} of {directions.length}
                </p>
                <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
                  {directions[currentStep].instruction}
                </p>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className={`flex justify-between items-center ${isMobile ? 'mt-3' : 'mt-3'}`}>
              <button
                onClick={() => onStepChange?.(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2 text-sm'} bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors duration-200 font-medium`}
              >
                Previous
              </button>
              
              <span className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-500 font-medium`}>
                {currentStep + 1} / {directions.length}
              </span>
              
              <button
                onClick={() => onStepChange?.(Math.min(directions.length - 1, currentStep + 1))}
                disabled={currentStep === directions.length - 1}
                className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-3 py-2 text-sm'} bg-blue-500 hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg transition-colors duration-200 font-medium`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Directions List */}
        <div className={`${isMobile ? 'max-h-96' : 'max-h-80'} overflow-y-auto custom-scrollbar`}>
          <div className={`${isMobile ? 'p-4' : 'p-4'} space-y-3`}>
            {directions.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${isMobile ? 'p-3' : 'p-3'} rounded-lg transition-all duration-200 cursor-pointer ${
                  isNavigating && index === currentStep
                    ? 'bg-gradient-to-r from-emerald-100 to-blue-100 border-2 border-emerald-300 shadow-md'
                    : isNavigating && index < currentStep
                    ? 'bg-gray-100 opacity-60'
                    : isNavigating && index > currentStep
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
                onClick={() => onStepChange?.(index)}
              >
                <div className={`${isMobile ? 'p-2' : 'p-2'} rounded-full flex-shrink-0 ${
                  isNavigating && index === currentStep
                    ? 'bg-emerald-500'
                    : isNavigating && index < currentStep
                    ? 'bg-gray-400'
                    : 'bg-gray-200'
                }`}>
                  {isNavigating && index < currentStep ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`${isNavigating && index === currentStep ? 'text-white' : 'text-gray-600'}`}>
                      {step.icon}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold ${
                      isNavigating && index === currentStep
                        ? 'text-emerald-700'
                        : isNavigating && index < currentStep
                        ? 'text-gray-500'
                        : 'text-blue-600'
                    }`}>
                      Step {index + 1}
                    </span>
                    {step.distance > 0 && (
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium ${
                        isNavigating && index === currentStep
                          ? 'text-emerald-600'
                          : isNavigating && index < currentStep
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}>
                        {formatDistance(step.distance)}
                      </span>
                    )}
                  </div>
                  
                  <p className={`${isMobile ? 'text-sm' : 'text-sm'} ${
                    isNavigating && index === currentStep
                      ? 'text-gray-800 font-medium'
                      : isNavigating && index < currentStep
                      ? 'text-gray-500'
                      : 'text-gray-700'
                  }`}>
                    {step.instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Summary */}
        <div className={`bg-gray-50 border-t border-gray-200 ${isMobile ? 'p-4' : 'p-4'}`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-semibold">{formatDistance(totalDistance)}</span>
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">~{estimatedTime} sec</span>
              </span>
            </div>
            <span className="text-gray-500 font-medium">
              {directions.length} steps
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default DirectionsPanel;