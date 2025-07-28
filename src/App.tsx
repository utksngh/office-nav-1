import React, { useState } from 'react';
import { Navigation, Plus, Save, Download, Upload, Settings, Check, MapPin } from 'lucide-react';
import FloorMap from './components/FloorMap';
import ControlPanel from './components/ControlPanel';
import MobileQuickNavigation from './components/MobileQuickNavigation';
import { FloorData, Point, OfficeSection } from './types';
import { pixelToGeo } from './utils/geoUtils';

// Office center coordinates (Bangalore, India)
const OFFICE_CENTER = { lat: 13.050528, lng: 77.619071 };
const METERS_PER_PIXEL = 0.1; // 10cm per pixel for detailed indoor mapping

// Sample floor data with geographic coordinates
const initialFloorData: Record<number, FloorData> = {
  1: {
    id: 1,
    name: '5th Floor',
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
    name: '6th Floor',
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
  const [floorData, setFloorData] = useState<Record<number, FloorData>>(() => {
    // Load saved data from localStorage or use initial data
    const savedData = localStorage.getItem('officeFloorData');
    return savedData ? JSON.parse(savedData) : initialFloorData;
  });
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveNotification, setSaveNotification] = useState('');
  const [mapContainerRef, setMapContainerRef] = useState<HTMLDivElement | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if user has seen instructions before
  React.useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
    if (hasSeenInstructions) {
      setShowInstructions(false);
    }
  }, []);

  const dismissInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem('hasSeenInstructions', 'true');
  };

  // Auto-save to localStorage whenever floorData changes
  React.useEffect(() => {
    localStorage.setItem('officeFloorData', JSON.stringify(floorData));
    // Only show auto-save notification if user has made changes (not on initial load)
    const hasUserMadeChanges = localStorage.getItem('hasUserMadeChanges');
    if (hasUserMadeChanges && saveNotification !== 'auto') {
      setSaveNotification('auto');
      setTimeout(() => setSaveNotification(''), 2000);
    }
  }, [floorData]);

  // Mark that user has made changes when they interact with the app
  const markUserChanges = () => {
    localStorage.setItem('hasUserMadeChanges', 'true');
  };

  const showSaveNotification = (message: string) => {
    setSaveNotification(message);
    setTimeout(() => setSaveNotification(''), 3000);
  };

  const saveLayout = () => {
    localStorage.setItem('officeFloorData', JSON.stringify(floorData));
    showSaveNotification('Layout saved successfully!');
  };

  const saveToFile = () => {
    const dataStr = JSON.stringify(floorData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `office-layout-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSaveNotification('Layout exported successfully!');
  };

  const loadFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const loadedData = JSON.parse(e.target?.result as string);
            setFloorData(loadedData);
            clearPath();
            setSelectedSection(null);
            setIsAddingSection(false);
            showSaveNotification('Layout imported successfully!');
          } catch (error) {
            showSaveNotification('Error loading file. Invalid format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const resetToDefault = () => {
    if (confirm('Are you sure you want to reset to the default layout? This will remove all your changes.')) {
      setFloorData(initialFloorData);
      localStorage.removeItem('officeFloorData');
      clearPath();
      setSelectedSection(null);
      setIsAddingSection(false);
      showSaveNotification('Layout reset to default!');
    }
  };

  const startNavigation = () => {
    if (startPoint && endPoint) {
      setIsNavigating(true);
      showSaveNotification('Navigation started!');
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    showSaveNotification('Navigation stopped');
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3)); // Max zoom 3x
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3)); // Min zoom 0.3x
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setMapTransform({ x: 0, y: 0 });
  };

  const addSection = (section: Omit<OfficeSection, 'id'>) => {
    markUserChanges();
    const newSection: OfficeSection = {
      ...section,
      id: Date.now().toString(),
      coordinates: pixelToGeo(
        { x: section.x + section.width / 2, y: section.y + section.height / 2 },
        floorData[currentFloor].centerCoordinates,
        floorData[currentFloor].metersPerPixel
      )
    };
    
    // Auto-scroll to ensure the new section is fully visible
    if (mapContainerRef) {
      const containerRect = mapContainerRef.getBoundingClientRect();
      const currentScrollLeft = mapContainerRef.scrollLeft;
      const currentScrollTop = mapContainerRef.scrollTop;
      
      // Calculate section boundaries
      const sectionLeft = newSection.x;
      const sectionRight = newSection.x + newSection.width;
      const sectionTop = newSection.y;
      const sectionBottom = newSection.y + newSection.height;
      
      // Calculate visible area boundaries
      const visibleLeft = currentScrollLeft;
      const visibleRight = currentScrollLeft + containerRect.width;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerRect.height;
      
      // Add padding around the section
      const padding = 50;
      
      let newScrollLeft = currentScrollLeft;
      let newScrollTop = currentScrollTop;
      
      // Check if section is outside visible area and adjust scroll
      if (sectionLeft - padding < visibleLeft) {
        newScrollLeft = Math.max(0, sectionLeft - padding);
      } else if (sectionRight + padding > visibleRight) {
        newScrollLeft = sectionRight + padding - containerRect.width;
      }
      
      if (sectionTop - padding < visibleTop) {
        newScrollTop = Math.max(0, sectionTop - padding);
      } else if (sectionBottom + padding > visibleBottom) {
        newScrollTop = sectionBottom + padding - containerRect.height;
      }
      
      mapContainerRef.scrollTo({
        left: newScrollLeft,
        top: newScrollTop,
        behavior: 'smooth'
      });
    }
    
    setFloorData(prev => ({
      ...prev,
      [currentFloor]: {
        ...prev[currentFloor],
        sections: [...prev[currentFloor].sections, newSection]
      }
    }));
    setIsAddingSection(false); // Exit adding mode after adding section
  };

  const updateSection = (sectionId: string, updates: Partial<OfficeSection>) => {
    markUserChanges();
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
    markUserChanges();
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
    setIsNavigating(false);
  };

  const handleFloorChange = (floor: number) => {
    markUserChanges();
    setCurrentFloor(floor);
    clearPath(); // Clear path when floor changes
    setSelectedSection(null); // Also clear selected section
    setIsAddingSection(false); // Exit section adding mode
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <header className={`bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 shadow-xl ${isMobile ? 'sticky top-0 z-30 px-3 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg`}>
              <Navigation className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-base' : 'text-lg md:text-2xl'} font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}>
                Office Navigation
              </h1>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs md:text-sm'} hidden sm:block`}>
                Intelligent pathfinding and office management
              </p>
            </div>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
            <div className={`flex bg-gray-700/80 backdrop-blur-sm rounded-lg ${isMobile ? 'p-0.5' : 'p-1'} ${isMobile ? 'text-xs' : 'text-sm'} shadow-lg`}>
              {[1, 2].map(floor => (
                <button
                  key={floor}
                  onClick={() => handleFloorChange(floor)}
                  className={`${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-2 md:px-4 md:py-2'} rounded-md transition-all duration-300 font-medium ${
                    currentFloor === floor
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <span className={`${isMobile ? 'inline' : 'hidden sm:inline'}`}>{floor === 1 ? '5th' : '6th'}</span>
                  <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>{floor === 1 ? '5th Floor' : '6th Floor'}</span>
                </button>
              ))}
            </div>
            
            {!isMobile && (
              <div className={`flex gap-1 md:gap-2`}>
                <button
                  onClick={saveLayout}
                  className={`p-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-all duration-300 shadow-lg`}
                  title="Save Layout"
                >
                  <Save className={`w-4 h-4 md:w-5 md:h-5`} />
                </button>
                
                <button
                  onClick={saveToFile}
                  className={`p-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-all duration-300 shadow-lg`}
                  title="Download Layout"
                >
                  <Download className={`w-4 h-4 md:w-5 md:h-5`} />
                </button>
                
                <button
                  onClick={loadFromFile}
                  className={`p-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-all duration-300 shadow-lg`}
                  title="Upload Layout"
                >
                  <Upload className={`w-4 h-4 md:w-5 md:h-5`} />
                </button>
                
                <button
                  onClick={() => setIsAddingSection(!isAddingSection)}
                  className={`p-2 rounded-xl transition-all duration-300 shadow-lg ${
                    isAddingSection
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white transform scale-105'
                      : 'bg-gray-700/80 backdrop-blur-sm text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                  title="Add Section"
                  onClick={() => {
                    setIsAddingSection(!isAddingSection);
                    if (isMobile) {
                      setSelectedSection(null); // Reset selection on mobile
                    }
                  }}
                >
                  <Plus className={`w-4 h-4 md:w-5 md:h-5`} />
                </button>
              </div>
            )}
            
            {isMobile && (
              <button
                onClick={() => setShowControlPanel(!showControlPanel)}
                className={`p-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all duration-300 shadow-lg`}
                title="Toggle Panel"
              >
                <Settings className={`w-5 h-5`} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`flex flex-col lg:flex-row ${isMobile ? 'h-[calc(100vh-65px)]' : 'h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]'}`}>
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
          isMobile={isMobile}
          saveLayout={saveLayout}
          saveToFile={saveToFile}
          loadFromFile={loadFromFile}
          resetToDefault={resetToDefault}
          isAddingSection={isAddingSection}
          onToggleAddingSection={() => setIsAddingSection(!isAddingSection)}
          isNavigating={isNavigating}
          onStartNavigation={startNavigation}
          onStopNavigation={stopNavigation}
          onSetNavigationPoint={(point, type) => {
            if (type === 'start') {
              setStartPoint(point);
            } else {
              setEndPoint(point);
            }
          }}
        />
        
        <main className={`flex-1 ${isMobile ? 'p-2' : 'p-3 md:p-4 lg:p-6'}`}>
          <div className={`bg-gray-800/90 backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-2xl'} shadow-2xl border border-gray-700/50 ${isMobile ? 'p-3' : 'p-4 md:p-6'} h-full flex flex-col`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg`}>
                  <MapPin className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-5 md:h-5'} text-white`} />
                </div>
                <div>
                  <h2 className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent`}>
                    {floorData[currentFloor].name}
                  </h2>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs md:text-sm'} text-gray-400`}>
                    {(floorData[currentFloor].width * floorData[currentFloor].metersPerPixel).toFixed(0)}m × {(floorData[currentFloor].height * floorData[currentFloor].metersPerPixel).toFixed(0)}m
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                {/* Zoom Controls */}
                <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} bg-gray-700/80 backdrop-blur-sm rounded-lg ${isMobile ? 'p-1' : 'p-1'} shadow-lg`}>
                  <button
                    onClick={handleZoomOut}
                    className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-300 hover:text-white hover:bg-gray-600 rounded-md transition-all duration-300 ${isMobile ? 'min-w-[36px] min-h-[36px] flex items-center justify-center' : ''}`}
                    title="Zoom Out"
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={handleResetZoom}
                    className={`${isMobile ? 'px-2 py-1.5 text-xs font-semibold min-w-[50px]' : 'px-2 py-1 text-xs'} text-gray-300 hover:text-white hover:bg-gray-600 rounded-md transition-all duration-300 font-mono ${isMobile ? 'min-h-[36px] flex items-center justify-center' : ''}`}
                    title="Reset Zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  
                  <button
                    onClick={handleZoomIn}
                    className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-300 hover:text-white hover:bg-gray-600 rounded-md transition-all duration-300 ${isMobile ? 'min-w-[36px] min-h-[36px] flex items-center justify-center' : ''}`}
                    title="Zoom In"
                  >
                    <svg className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
                
                <div className={`${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                {isNavigating ? (
                  <span className={`flex items-center gap-1.5 text-blue-400 bg-blue-400/10 ${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-1'} rounded-full`}>
                    <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-blue-400 rounded-full animate-pulse`}></div>
                    <span className="font-medium">Navigating</span>
                  </span>
                ) : startPoint && endPoint ? (
                  <span className={`flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 ${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-1'} rounded-full`}>
                    <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-emerald-400 rounded-full animate-pulse`}></div>
                    <span className="font-medium">Route Ready</span>
                  </span>
                ) : startPoint ? (
                  <span className={`flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 ${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-1'} rounded-full`}>
                    <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-yellow-400 rounded-full animate-pulse`}></div>
                    <span className="font-medium">{isMobile ? 'Set end' : 'Select destination'}</span>
                  </span>
                ) : (
                  <span className={`flex items-center gap-1.5 text-gray-400 bg-gray-400/10 ${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-1'} rounded-full`}>
                    <div className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-gray-400 rounded-full`}></div>
                    <span className="font-medium">{isMobile ? 'Set start' : 'Tap to set start'}</span>
                  </span>
                )}
                </div>
              </div>
            </div>

            <div 
              ref={setMapContainerRef}
              className={`flex-1 overflow-auto custom-scrollbar ${isMobile ? 'rounded-md' : 'rounded-xl'} border border-gray-700/50 shadow-inner relative`}
              style={isMobile ? { 
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overflowX: 'auto',
                overflowY: 'auto',
                scrollBehavior: 'smooth'
              } : {}}
            >
              
              <FloorMap
                floorData={floorData[currentFloor]}
                startPoint={startPoint}
                endPoint={endPoint}
                onPointSelect={(point, type) => {
                  if (type === 'start') setStartPoint(point);
                  else setEndPoint(point);
                }}
                onClearPath={clearPath}
                isAddingSection={isAddingSection}
                onAddSection={addSection}
                selectedSection={selectedSection}
                onSectionSelect={setSelectedSection}
                onSectionUpdate={updateSection}
                isMobile={isMobile}
                isNavigating={isNavigating}
                zoomLevel={zoomLevel}
                mapTransform={mapTransform}
                onMapTransform={setMapTransform}
                setZoomLevel={setZoomLevel}
               onZoomIn={handleZoomIn}
               onZoomOut={handleZoomOut}
               onResetZoom={handleResetZoom}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Sticky Clear Path Button */}
      {(startPoint || endPoint) && (
        <button
          onClick={clearPath}
          className={`fixed ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'} ${isMobile ? 'w-14 h-14' : 'w-12 h-12'} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 transform hover:scale-110 z-40 flex items-center justify-center group`}
          title="Clear Path"
        >
          <svg 
            className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} transition-transform duration-300 group-hover:rotate-90`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
          
          {/* Tooltip */}
          <div className={`absolute ${isMobile ? 'bottom-16 right-0' : 'bottom-14 right-0'} bg-gray-900/95 backdrop-blur-sm text-white ${isMobile ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'} rounded-lg shadow-xl border border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap transform translate-y-2 group-hover:translate-y-0`}>
            Clear Path
            <div className={`absolute top-full ${isMobile ? 'right-6' : 'right-4'} w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95`}></div>
          </div>
        </button>
      )}
      
      {/* Welcome Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className={`bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 ${isMobile ? 'w-full max-w-sm mx-2' : 'max-w-md w-full'} ${isMobile ? 'p-5' : 'p-6'}`}>
            <div className={`text-center ${isMobile ? 'mb-5' : 'mb-6'}`}>
              <div className={`${isMobile ? 'p-3' : 'p-3'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg mx-auto w-fit ${isMobile ? 'mb-3' : 'mb-4'}`}>
                <Navigation className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} text-white`} />
              </div>
              <h2 className={`${isMobile ? 'text-xl' : 'text-xl'} font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${isMobile ? 'mb-1' : 'mb-2'}`}>
                Welcome to Office Navigation!
              </h2>
              <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Your intelligent indoor navigation system
              </p>
            </div>
            
            <div className={`${isMobile ? 'space-y-4' : 'space-y-4'} ${isMobile ? 'mb-5' : 'mb-6'}`}>
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'} bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <div className={`${isMobile ? 'w-2 h-2' : 'w-2 h-2'} bg-emerald-400 rounded-full`}></div>
                </div>
                <div>
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-sm' : 'text-sm'}`}>Set Navigation Points</h3>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>Tap on the map to set your start point, then tap again for your destination</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'} bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Plus className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} text-blue-400`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-sm' : 'text-sm'}`}>Add Rooms</h3>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>Use the + button to add new rooms and areas to the floor plan</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'} bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Settings className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} text-purple-400`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-sm' : 'text-sm'}`}>Manage Floors</h3>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>Switch between floors and {isMobile ? 'tap the settings icon' : 'use the side panel'} to view room details</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'} bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <MapPin className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} text-yellow-400`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-sm' : 'text-sm'}`}>Smart Pathfinding</h3>
                  <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>The system automatically finds the shortest route while avoiding obstacles</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={dismissInstructions}
              className={`w-full ${isMobile ? 'px-5 py-3 text-base' : 'px-4 py-3'} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      
      {/* Save Notification */}
      {saveNotification && (
        <div className={`fixed ${isMobile ? 'top-3 right-3 left-3' : 'top-4 right-4'} z-50 bg-emerald-500/90 backdrop-blur-sm text-white ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'} rounded-lg shadow-2xl border border-emerald-400/50 flex items-center ${isMobile ? 'justify-center' : ''} gap-2 animate-in slide-in-from-right duration-300`}>
          <Check className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{saveNotification}</span>
        </div>
      )}
    </div>
  );
}

export default App;