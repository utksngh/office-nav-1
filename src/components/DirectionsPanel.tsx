import React from 'react';
import { FloorData, Point } from '../types';
import { getLandmarksNear, getLandmarksAlongPath } from '../utils/pathfinding';
import { calculatePixelDistanceInMeters, formatDistance } from '../utils/geoUtils';
import { Navigation, MapPin, Clock, Route } from 'lucide-react';

interface DirectionsPanelProps {
  startPoint: Point | null;
  endPoint: Point | null;
  path: Point[];
  floorData: FloorData;
  isNavigating: boolean;
  isMobile: boolean;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  startPoint,
  endPoint,
  path,
  floorData,
  isNavigating,
  isMobile
}) => {
  if (!startPoint || !endPoint || path.length === 0) {
    return (
      <div className={`bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'} shadow-xl border border-gray-300/50 h-full`}>
        <div className="flex items-center gap-3 mb-4">
          <Navigation className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>Directions</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className={`${isMobile ? 'text-sm' : 'text-base'}`}>
            Set start and end points to see navigation directions
          </p>
        </div>
      </div>
    );
  }

  // Generate turn-by-turn directions
  const generateDirections = () => {
    if (path.length < 2) return [];
    
    const directions = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      
      const distance = calculatePixelDistanceInMeters(current, next, floorData.metersPerPixel);
      const nearLandmarks = getLandmarksNear(current, floorData.sections, 60);
      const passingLandmarks = getLandmarksAlongPath(current, next, floorData.sections);
      
      let instruction = '';
      if (i === 0) {
        instruction = 'Start your journey';
      } else if (i === path.length - 2) {
        instruction = 'Arrive at destination';
      } else {
        // Determine direction
        const prev = path[i - 1];
        const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
        const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
        const angleDiff = angle2 - angle1;
        
        if (Math.abs(angleDiff) < 0.3) {
          instruction = 'Continue straight';
        } else if (angleDiff > 0) {
          instruction = 'Turn right';
        } else {
          instruction = 'Turn left';
        }
        
        // Add landmark context
        if (nearLandmarks.length > 0) {
          instruction += ` at ${nearLandmarks[0].name}`;
        }
      }
      
      directions.push({
        step: i + 1,
        instruction,
        distance: formatDistance(distance),
        nearLandmarks: nearLandmarks.slice(0, isMobile ? 2 : 3),
        passingLandmarks: passingLandmarks.slice(0, isMobile ? 2 : 3).filter(
          landmark => !nearLandmarks.some(near => near.id === landmark.id)
        )
      });
    }
    
    return directions;
  };

  const directions = generateDirections();
  const totalDistance = startPoint && endPoint ? 
    calculatePixelDistanceInMeters(startPoint, endPoint, floorData.metersPerPixel) : 0;
  const estimatedTime = Math.ceil(totalDistance / 1.4); // Average walking speed 1.4 m/s

  return (
    <div className={`bg-white/95 backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'} shadow-xl border border-gray-300/50 h-full overflow-auto`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Navigation className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${isNavigating ? 'text-blue-600' : 'text-emerald-600'}`} />
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>
          {isNavigating ? '🧭 Active Navigation' : 'Route Directions'}
        </h3>
      </div>

      {/* Route Summary */}
      <div className={`bg-gradient-to-r ${isNavigating ? 'from-blue-50 to-blue-100' : 'from-emerald-50 to-emerald-100'} ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-3' : 'p-4'} mb-6`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Route className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isNavigating ? 'text-blue-600' : 'text-emerald-600'}`} />
            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold ${isNavigating ? 'text-blue-800' : 'text-emerald-800'}`}>
              {formatDistance(totalDistance)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} />
            <span className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-700`}>
              ~{estimatedTime}s
            </span>
          </div>
        </div>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
          {directions.length} steps • Walking directions
        </p>
      </div>

      {/* Step-by-step directions */}
      <div className="space-y-4">
        {directions.map((direction, index) => (
          <div
            key={index}
            className={`${isMobile ? 'p-3' : 'p-4'} border ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${
              isNavigating && index === 0
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-gray-50'
            } transition-all duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${isMobile ? 'rounded-md' : 'rounded-lg'} ${
                isNavigating && index === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white'
              } flex items-center justify-center ${isMobile ? 'text-xs' : 'text-sm'} font-bold flex-shrink-0`}>
                {direction.step}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-800 mb-1`}>
                  {direction.instruction}
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                  Continue for {direction.distance}
                </p>
                
                {/* Near landmarks */}
                {direction.nearLandmarks.length > 0 && (
                  <div className="mb-2">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-700 mb-1`}>
                      📍 Near:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {direction.nearLandmarks.map((landmark, idx) => (
                        <span
                          key={idx}
                          className={`${isMobile ? 'text-xs' : 'text-sm'} px-2 py-1 bg-blue-100 text-blue-800 rounded-full`}
                        >
                          {landmark.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Passing landmarks */}
                {direction.passingLandmarks.length > 0 && (
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-emerald-700 mb-1`}>
                      🚶 Passing:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {direction.passingLandmarks.map((landmark, idx) => (
                        <span
                          key={idx}
                          className={`${isMobile ? 'text-xs' : 'text-sm'} px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full`}
                        >
                          {landmark.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DirectionsPanel;