import React, { useState } from 'react';
import { Navigation, Plus, Save, Download, Upload, Settings, Check, MapPin, Menu } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      <header className={`bg-white border-b border-gray-200 shadow-sm ${isMobile ? 'sticky top-0 z-30 px-4 py-4' : 'px-8 py-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl shadow-lg`}>
              <Navigation className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6 md:w-7 md:h-7'} text-white`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl md:text-4xl'} font-black text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                Office Navigation
              </h1>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm md:text-base'} hidden sm:block font-medium`}>
                Intelligent pathfinding and office management
              </p>
            </div>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
            <div className={`flex bg-gray-100 rounded-2xl ${isMobile ? 'p-1' : 'p-1.5'} ${isMobile ? 'text-sm' : 'text-base'} shadow-sm border border-gray-200`}>
              {[1, 2].map(floor => (
                <button
                  key={floor}
                  onClick={() => handleFloorChange(floor)}
                  className={`${isMobile ? 'px-4 py-2' : 'px-5 py-2.5 md:px-6 md:py-3'} rounded-xl transition-all duration-300 font-bold ${
                    currentFloor === floor
                      ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
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
                  className={`p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 shadow-sm border border-gray-200`}
                  title="Save Layout"
                >
                  <Save className={`w-5 h-5 md:w-6 md:h-6`} />
                </button>
                
                <button
                  onClick={saveToFile}
                  className={`p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 shadow-sm border border-gray-200`}
                  title="Download Layout"
                >
                  <Download className={`w-5 h-5 md:w-6 md:h-6`} />
                </button>
                
                <button
                  onClick={loadFromFile}
                  className={`p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 shadow-sm border border-gray-200`}
                  title="Upload Layout"
                >
                  <Upload className={`w-5 h-5 md:w-6 md:h-6`} />
                </button>
                
                <button
                  onClick={() => setIsAddingSection(!isAddingSection)}
                  className={`p-3 rounded-2xl transition-all duration-300 shadow-sm border ${
                    isAddingSection
                      ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white transform scale-105 border-teal-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border-gray-200'
                  }`}
                  title="Add Section"
                  onClick={() => {
                    setIsAddingSection(!isAddingSection);
                    if (isMobile) {
                      setSelectedSection(null); // Reset selection on mobile
                    }
                  }}
                >
                  <Plus className={`w-5 h-5 md:w-6 md:h-6`} />
                </button>
              </div>
            )}
            
            {isMobile && (
              <button
                onClick={() => setShowControlPanel(!showControlPanel)}
                className={`p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 shadow-sm border border-gray-200`}
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
        />
        
        <main className={`flex-1 ${isMobile ? 'p-2' : 'p-3 md:p-4 lg:p-6'}`}>
          <div className={`bg-white ${isMobile ? 'rounded-2xl' : 'rounded-3xl'} shadow-lg border border-gray-200 ${isMobile ? 'p-4' : 'p-6 md:p-8'} h-full flex flex-col`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4 md:mb-6'}`}>
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl shadow-md`}>
                  <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} />
                </div>
                <div>
                  <h2 className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'} font-black text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                    {floorData[currentFloor].name}
                  </h2>
                  <p className={`${isMobile ? 'text-sm' : 'text-sm md:text-base'} text-gray-600 font-medium`}>
                    {(floorData[currentFloor].width * floorData[currentFloor].metersPerPixel).toFixed(0)}m × {(floorData[currentFloor].height * floorData[currentFloor].metersPerPixel).toFixed(0)}m
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                {/* Zoom Controls */}
                <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} bg-gray-100 rounded-2xl ${isMobile ? 'p-1' : 'p-1.5'} shadow-sm border border-gray-200`}>
                  <button
                    onClick={handleZoomOut}
                    className={`${isMobile ? 'p-2.5' : 'p-2'} text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-300 ${isMobile ? 'min-w-[40px] min-h-[40px] flex items-center justify-center' : ''}`}
                    title="Zoom Out"
                  >
                    <svg className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={handleResetZoom}
                    className={`${isMobile ? 'px-3 py-2 text-sm font-bold min-w-[60px]' : 'px-3 py-1.5 text-sm'} text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-300 font-mono ${isMobile ? 'min-h-[40px] flex items-center justify-center' : ''}`}
                    title="Reset Zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  
                  <button
                    onClick={handleZoomIn}
                    className={`${isMobile ? 'p-2.5' : 'p-2'} text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-300 ${isMobile ? 'min-w-[40px] min-h-[40px] flex items-center justify-center' : ''}`}
                    title="Zoom In"
                  >
                    <svg className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
                
                <div className={`${isMobile ? 'text-xs' : 'text-xs md:text-sm'}`}>
                {isNavigating ? (
                  <span className={`flex items-center gap-2 text-purple-600 bg-purple-100 ${isMobile ? 'px-4 py-2' : 'px-4 py-2'} rounded-full border border-purple-200`}>
                    <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-purple-500 rounded-full animate-pulse`}></div>
                    <span className="font-bold">Navigating</span>
                  </span>
                ) : startPoint && endPoint ? (
                  <span className={`flex items-center gap-2 text-teal-600 bg-teal-100 ${isMobile ? 'px-4 py-2' : 'px-4 py-2'} rounded-full border border-teal-200`}>
                    <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-teal-500 rounded-full animate-pulse`}></div>
                    <span className="font-bold">Route Ready</span>
                  </span>
                ) : startPoint ? (
                  <span className={`flex items-center gap-2 text-yellow-600 bg-yellow-100 ${isMobile ? 'px-4 py-2' : 'px-4 py-2'} rounded-full border border-yellow-200`}>
                    <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-yellow-500 rounded-full animate-pulse`}></div>
                    <span className="font-bold">{isMobile ? 'Set end' : 'Select destination'}</span>
                  </span>
                ) : (
                  <span className={`flex items-center gap-2 text-gray-600 bg-gray-100 ${isMobile ? 'px-4 py-2' : 'px-4 py-2'} rounded-full border border-gray-200`}>
                    <div className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-gray-500 rounded-full`}></div>
                    <span className="font-bold">{isMobile ? 'Set start' : 'Tap to set start'}</span>
                  </span>
                )}
                </div>
              </div>
            </div>

            <div 
              ref={setMapContainerRef}
              className={`flex-1 overflow-auto ${isMobile ? 'rounded-2xl' : 'rounded-3xl'} border border-gray-200 shadow-inner bg-gray-50`}
              style={isMobile ? { 
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
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
               onZoomIn={handleZoomIn}
               onZoomOut={handleZoomOut}
               onResetZoom={handleResetZoom}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Welcome Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl shadow-2xl border border-gray-200 ${isMobile ? 'w-full max-w-sm mx-2' : 'max-w-lg w-full'} ${isMobile ? 'p-6' : 'p-8'}`}>
            <div className={`text-center ${isMobile ? 'mb-5' : 'mb-6'}`}>
              <div className={`${isMobile ? 'p-4' : 'p-4'} bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl shadow-lg mx-auto w-fit ${isMobile ? 'mb-4' : 'mb-6'}`}>
                <Navigation className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-white`} />
              </div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                Welcome to Office Navigation!
              </h2>
              <p className={`text-gray-600 ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>
                Your intelligent indoor navigation system
              </p>
            </div>
            
            <div className={`${isMobile ? 'space-y-4' : 'space-y-4'} ${isMobile ? 'mb-5' : 'mb-6'}`}>
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <div className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'} bg-teal-500 rounded-full`}></div>
                </div>
                <div>
                  <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-base'}`}>Set Navigation Points</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Tap on the map to set your start point, then tap again for your destination</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Plus className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-purple-500`} />
                </div>
                <div>
                  <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-base'}`}>Add Rooms</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Use the + button to add new rooms and areas to the floor plan</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} bg-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Settings className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-yellow-600`} />
                </div>
                <div>
                  <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-base'}`}>Manage Floors</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Switch between floors and {isMobile ? 'tap the settings icon' : 'use the side panel'} to view room details</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isMobile ? 'gap-2.5' : 'gap-3'}`}>
                <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-red-500`} />
                </div>
                <div>
                  <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-base'}`}>Smart Pathfinding</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>The system automatically finds the shortest route while avoiding obstacles</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={dismissInstructions}
              className={`w-full ${isMobile ? 'px-6 py-4 text-lg' : 'px-6 py-4 text-lg'} bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-2xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      
      {/* Save Notification */}
      {saveNotification && (
        <div className={`fixed ${isMobile ? 'top-4 right-4 left-4' : 'top-6 right-6'} z-50 bg-teal-500 text-white ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} rounded-2xl shadow-2xl border border-teal-400 flex items-center ${isMobile ? 'justify-center' : ''} gap-3 animate-in slide-in-from-right duration-300`}>
          <Check className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
          <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{saveNotification}</span>
        </div>
      )}
    </div>
  );
}

export default App;