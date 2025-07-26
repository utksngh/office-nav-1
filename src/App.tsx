import React, { useState } from 'react';
import { Navigation, MapPin, Plus, Settings } from 'lucide-react';
import FloorMap from './components/FloorMap';
import ControlPanel from './components/ControlPanel';
import { FloorData, Point, OfficeSection } from './types';
import { pixelToGeo } from './utils/geoUtils';

// Office center coordinates (Bangalore, India)
const OFFICE_CENTER = { lat: 13.050528, lng: 77.619071 };
const METERS_PER_PIXEL = 0.1; // 10cm per pixel for detailed indoor mapping

// Sample floor data with geographic coordinates
const initialFloorData: Record<number, FloorData> = {
  1: {
    id: 1,
    name: 'Ground Floor',
    width: 1000, // 100 meters wide
    height: 800, // 80 meters tall
    centerCoordinates: OFFICE_CENTER,
    metersPerPixel: METERS_PER_PIXEL,
    sections: [
      { 
        id: '1', name: 'Reception', x: 100, y: 100, width: 200, height: 120, type: 'reception',
        coordinates: pixelToGeo({ x: 200, y: 160 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '2', name: 'Conference Room A', x: 350, y: 100, width: 250, height: 150, type: 'meeting',
        coordinates: pixelToGeo({ x: 475, y: 175 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '3', name: 'Office 101', x: 650, y: 100, width: 150, height: 120, type: 'office',
        coordinates: pixelToGeo({ x: 725, y: 160 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '4', name: 'Cafeteria', x: 100, y: 300, width: 220, height: 180, type: 'cafeteria',
        coordinates: pixelToGeo({ x: 210, y: 390 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '5', name: 'IT Department', x: 380, y: 320, width: 200, height: 160, type: 'department',
        coordinates: pixelToGeo({ x: 480, y: 400 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '6', name: 'Storage', x: 650, y: 300, width: 120, height: 100, type: 'storage',
        coordinates: pixelToGeo({ x: 710, y: 350 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '7', name: 'Office 102', x: 820, y: 100, width: 150, height: 120, type: 'office',
        coordinates: pixelToGeo({ x: 895, y: 160 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '8', name: 'Meeting Room B', x: 650, y: 500, width: 180, height: 120, type: 'meeting',
        coordinates: pixelToGeo({ x: 740, y: 560 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
    ]
  },
  2: {
    id: 2,
    name: 'First Floor',
    width: 1000,
    height: 800,
    centerCoordinates: OFFICE_CENTER,
    metersPerPixel: METERS_PER_PIXEL,
    sections: [
      { 
        id: '9', name: 'CEO Office', x: 100, y: 100, width: 250, height: 180, type: 'executive',
        coordinates: pixelToGeo({ x: 225, y: 190 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '10', name: 'HR Department', x: 400, y: 100, width: 220, height: 150, type: 'department',
        coordinates: pixelToGeo({ x: 510, y: 175 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '11', name: 'Finance', x: 670, y: 100, width: 200, height: 150, type: 'department',
        coordinates: pixelToGeo({ x: 770, y: 175 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '12', name: 'Board Room', x: 200, y: 350, width: 300, height: 220, type: 'meeting',
        coordinates: pixelToGeo({ x: 350, y: 460 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '13', name: 'Executive Lounge', x: 550, y: 400, width: 250, height: 120, type: 'lounge',
        coordinates: pixelToGeo({ x: 675, y: 460 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
      { 
        id: '14', name: 'Archive', x: 100, y: 450, width: 100, height: 150, type: 'storage',
        coordinates: pixelToGeo({ x: 150, y: 525 }, OFFICE_CENTER, METERS_PER_PIXEL)
      },
    ]
  }
};

function App() {
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [floorData, setFloorData] = useState<Record<number, FloorData>>(initialFloorData);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);

  const addSection = (section: Omit<OfficeSection, 'id'>) => {
    const newSection: OfficeSection = {
      ...section,
      id: Date.now().toString(),
      coordinates: pixelToGeo(
        { x: section.x + section.width / 2, y: section.y + section.height / 2 },
        floorData[currentFloor].centerCoordinates,
        floorData[currentFloor].metersPerPixel
      )
    };
    
    setFloorData(prev => ({
      ...prev,
      [currentFloor]: {
        ...prev[currentFloor],
        sections: [...prev[currentFloor].sections, newSection]
      }
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<OfficeSection>) => {
    const updatedSection = { ...updates };
    
    // Update coordinates if position or size changed
    if (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined) {
      const currentSection = floorData[currentFloor].sections.find(s => s.id === sectionId);
      if (currentSection) {
        const centerX = (updates.x ?? currentSection.x) + (updates.width ?? currentSection.width) / 2;
        const centerY = (updates.y ?? currentSection.y) + (updates.height ?? currentSection.height) / 2;
        updatedSection.coordinates = pixelToGeo(
          { x: centerX, y: centerY },
          floorData[currentFloor].centerCoordinates,
          floorData[currentFloor].metersPerPixel
        );
      }
    }
    
    setFloorData(prev => ({
      ...prev,
      [currentFloor]: {
        ...prev[currentFloor],
        sections: prev[currentFloor].sections.map(section =>
          section.id === sectionId ? { ...section, ...updatedSection } : section
        )
      }
    }));
  };

  const deleteSection = (sectionId: string) => {
    setFloorData(prev => ({
      ...prev,
      [currentFloor]: {
        ...prev[currentFloor],
        sections: prev[currentFloor].sections.filter(section => section.id !== sectionId)
      }
    }));
  };

  const clearPath = () => {
    setStartPoint(null);
    setEndPoint(null);
  };

  const handleFloorChange = (floor: number) => {
    setCurrentFloor(floor);
    clearPath(); // Clear path when floor changes
    setSelectedSection(null); // Also clear selected section
    setIsAddingSection(false); // Exit section adding mode
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            <div>
              <h1 className="text-lg md:text-2xl font-bold">Office Navigation</h1>
              <p className="text-gray-400 text-xs md:text-sm hidden sm:block">Intelligent pathfinding and office management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-700 rounded-lg p-1 text-sm">
              {[1, 2].map(floor => (
                <button
                  key={floor}
                  onClick={() => handleFloorChange(floor)}
                  className={`px-2 py-1 md:px-4 md:py-2 rounded-md transition-all duration-200 ${
                    currentFloor === floor
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <span className="hidden sm:inline">Floor </span>{floor}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1 md:gap-2">
              <button
                onClick={() => setShowControlPanel(!showControlPanel)}
                className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all duration-200 md:hidden"
                title="Toggle Panel"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsAddingSection(!isAddingSection)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isAddingSection
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title="Add Section"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <button
                onClick={clearPath}
                className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all duration-200"
                title="Clear Path"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
        <ControlPanel
          currentFloor={floorData[currentFloor]}
          startPoint={startPoint}
          endPoint={endPoint}
          selectedSection={selectedSection}
          onSectionUpdate={updateSection}
          onSectionDelete={deleteSection}
          onClearPath={clearPath}
          isVisible={showControlPanel}
          onClose={() => setShowControlPanel(false)}
        />
        
        <main className="flex-1 p-3 md:p-6">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-3 md:p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">{floorData[currentFloor].name}</h2>
                  <p className="text-xs text-gray-400">
                    {(floorData[currentFloor].width * floorData[currentFloor].metersPerPixel).toFixed(0)}m × {(floorData[currentFloor].height * floorData[currentFloor].metersPerPixel).toFixed(0)}m
                  </p>
                </div>
              </div>
              
              <div className="text-xs md:text-sm text-gray-400">
                {startPoint && endPoint ? (
                  <span className="text-emerald-400">
                    <span className="hidden sm:inline">✓ Route ready</span><span className="sm:hidden">✓</span>
                  </span>
                ) : startPoint ? (
                  <span className="text-yellow-400">Select destination</span>
                ) : (
                  <span>Tap to set start</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-lg">
              <FloorMap
                floorData={floorData[currentFloor]}
                startPoint={startPoint}
                endPoint={endPoint}
                onPointSelect={(point, type) => {
                  if (type === 'start') setStartPoint(point);
                  else setEndPoint(point);
                }}
                isAddingSection={isAddingSection}
                onAddSection={addSection}
                selectedSection={selectedSection}
                onSectionSelect={setSelectedSection}
                onSectionUpdate={updateSection}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;