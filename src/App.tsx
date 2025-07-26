import React, { useState } from 'react';
import { Navigation, MapPin, Plus, Settings } from 'lucide-react';
import FloorMap from './components/FloorMap';
import ControlPanel from './components/ControlPanel';
import { FloorData, Point, OfficeSection } from './types';

// Sample floor data
const initialFloorData: Record<number, FloorData> = {
  1: {
    id: 1,
    name: 'Ground Floor',
    width: 800,
    height: 600,
    sections: [
      { id: '1', name: 'Reception', x: 50, y: 50, width: 150, height: 100, type: 'reception' },
      { id: '2', name: 'Conference Room A', x: 250, y: 50, width: 200, height: 120, type: 'meeting' },
      { id: '3', name: 'Office 101', x: 500, y: 50, width: 120, height: 100, type: 'office' },
      { id: '4', name: 'Cafeteria', x: 50, y: 200, width: 180, height: 150, type: 'cafeteria' },
      { id: '5', name: 'IT Department', x: 280, y: 220, width: 160, height: 130, type: 'department' },
      { id: '6', name: 'Storage', x: 500, y: 200, width: 100, height: 80, type: 'storage' },
      { id: '7', name: 'Office 102', x: 650, y: 50, width: 120, height: 100, type: 'office' },
      { id: '8', name: 'Meeting Room B', x: 500, y: 350, width: 150, height: 100, type: 'meeting' },
    ]
  },
  2: {
    id: 2,
    name: 'First Floor',
    width: 800,
    height: 600,
    sections: [
      { id: '9', name: 'CEO Office', x: 50, y: 50, width: 200, height: 150, type: 'executive' },
      { id: '10', name: 'HR Department', x: 300, y: 50, width: 180, height: 120, type: 'department' },
      { id: '11', name: 'Finance', x: 520, y: 50, width: 160, height: 120, type: 'department' },
      { id: '12', name: 'Board Room', x: 150, y: 250, width: 250, height: 180, type: 'meeting' },
      { id: '13', name: 'Executive Lounge', x: 450, y: 300, width: 200, height: 100, type: 'lounge' },
      { id: '14', name: 'Archive', x: 50, y: 350, width: 80, height: 120, type: 'storage' },
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

  const addSection = (section: Omit<OfficeSection, 'id'>) => {
    const newSection: OfficeSection = {
      ...section,
      id: Date.now().toString()
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
    setFloorData(prev => ({
      ...prev,
      [currentFloor]: {
        ...prev[currentFloor],
        sections: prev[currentFloor].sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Office Navigation System</h1>
              <p className="text-gray-400">Intelligent pathfinding and office management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-700 rounded-lg p-1">
              {[1, 2].map(floor => (
                <button
                  key={floor}
                  onClick={() => setCurrentFloor(floor)}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    currentFloor === floor
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  Floor {floor}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingSection(!isAddingSection)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isAddingSection
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title="Add Section"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button
                onClick={clearPath}
                className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all duration-200"
                title="Clear Path"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        <ControlPanel
          currentFloor={floorData[currentFloor]}
          startPoint={startPoint}
          endPoint={endPoint}
          selectedSection={selectedSection}
          onSectionUpdate={updateSection}
          onSectionDelete={deleteSection}
          onClearPath={clearPath}
        />
        
        <main className="flex-1 p-6">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold">{floorData[currentFloor].name}</h2>
              </div>
              
              <div className="text-sm text-gray-400">
                {startPoint && endPoint ? (
                  <span className="text-emerald-400">✓ Path calculated</span>
                ) : startPoint ? (
                  <span className="text-yellow-400">Select destination</span>
                ) : (
                  <span>Click to set start point</span>
                )}
              </div>
            </div>

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
        </main>
      </div>
    </div>
  );
}

export default App;