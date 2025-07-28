import React, { useState, useEffect } from 'react';
import { FloorData, Point, OfficeSection } from './types';
import FloorMap from './components/FloorMap';
import ControlPanel from './components/ControlPanel';
import DirectionsPanel from './components/DirectionsPanel';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Sample floor data
  const [floorData] = useState<FloorData>({
    id: 1,
    name: "Ground Floor",
    width: 1000,
    height: 800,
    centerCoordinates: {
      lat: 40.7128,
      lng: -74.0060
    },
    metersPerPixel: 0.1,
    sections: [
      {
        id: '1',
        name: 'Reception',
        x: 50,
        y: 50,
        width: 150,
        height: 100,
        type: 'reception',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      {
        id: '2',
        name: 'Conference Room A',
        x: 250,
        y: 50,
        width: 200,
        height: 150,
        type: 'meeting',
        coordinates: { lat: 40.7129, lng: -74.0059 }
      },
      {
        id: '3',
        name: 'Office 101',
        x: 500,
        y: 50,
        width: 120,
        height: 100,
        type: 'office',
        coordinates: { lat: 40.7130, lng: -74.0058 }
      },
      {
        id: '4',
        name: 'Cafeteria',
        x: 50,
        y: 200,
        width: 300,
        height: 150,
        type: 'cafeteria',
        coordinates: { lat: 40.7127, lng: -74.0061 }
      },
      {
        id: '5',
        name: 'Storage',
        x: 400,
        y: 200,
        width: 100,
        height: 80,
        type: 'storage',
        coordinates: { lat: 40.7129, lng: -74.0057 }
      },
      {
        id: '6',
        name: 'Executive Office',
        x: 650,
        y: 200,
        width: 180,
        height: 120,
        type: 'executive',
        coordinates: { lat: 40.7131, lng: -74.0056 }
      }
    ]
  });

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePointSelect = (point: Point, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartPoint(point);
      if (endPoint) {
        setEndPoint(null);
      }
    } else {
      setEndPoint(point);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    const section = floorData.sections.find(s => s.id === sectionId);
    if (section) {
      const centerPoint: Point = {
        x: section.x + section.width / 2,
        y: section.y + section.height / 2
      };
      
      if (!startPoint) {
        setStartPoint(centerPoint);
      } else if (!endPoint) {
        setEndPoint(centerPoint);
      } else {
        setStartPoint(centerPoint);
        setEndPoint(null);
      }
    }
  };

  const handleClearPath = () => {
    setStartPoint(null);
    setEndPoint(null);
    setIsNavigating(false);
    setCurrentPath([]);
  };

  const handleAddSection = (section: Omit<OfficeSection, 'id'>) => {
    // Implementation for adding new sections would go here
    console.log('Adding section:', section);
  };

  const handleSectionUpdate = (sectionId: string, updates: Partial<OfficeSection>) => {
    // Implementation for updating sections would go here
    console.log('Updating section:', sectionId, updates);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setMapTransform({ x: 0, y: 0 });
  };

  const handlePathUpdate = (path: Point[]) => {
    setCurrentPath(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            🏢 Office Navigator
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Navigate through your office space with precision and ease
          </p>
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-6'} h-[calc(100vh-200px)]`}>
          {/* Control Panel */}
          <div className={`${isMobile ? 'order-2' : 'col-span-1'}`}>
            <ControlPanel
              startPoint={startPoint}
              endPoint={endPoint}
              onClearPath={handleClearPath}
              isAddingSection={isAddingSection}
              onToggleAddingSection={() => setIsAddingSection(!isAddingSection)}
              selectedSection={selectedSection}
              onSectionSelect={setSelectedSection}
              sections={floorData.sections}
              isMobile={isMobile}
              isNavigating={isNavigating}
              onToggleNavigation={() => setIsNavigating(!isNavigating)}
              onSectionSelectForNavigation={handleSectionSelect}
            />
          </div>

          {/* Floor Map */}
          <div className={`${isMobile ? 'order-1' : 'col-span-2'}`}>
            <FloorMap
              floorData={floorData}
              startPoint={startPoint}
              endPoint={endPoint}
              onPointSelect={handlePointSelect}
              onClearPath={handleClearPath}
              isAddingSection={isAddingSection}
              onAddSection={handleAddSection}
              selectedSection={selectedSection}
              onSectionSelect={setSelectedSection}
              onSectionUpdate={handleSectionUpdate}
              isMobile={isMobile}
              isNavigating={isNavigating}
              zoomLevel={zoomLevel}
              mapTransform={mapTransform}
              onMapTransform={setMapTransform}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              onPathUpdate={handlePathUpdate}
            />
          </div>

          {/* Directions Panel */}
          <div className={`${isMobile ? 'order-3' : 'col-span-1'}`}>
            <DirectionsPanel
              startPoint={startPoint}
              endPoint={endPoint}
              path={currentPath}
              floorData={floorData}
              isNavigating={isNavigating}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;