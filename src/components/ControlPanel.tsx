import React, { useState } from 'react';
import { FloorData, Point, OfficeSection } from '../types';
import { MapPin, Trash2, Edit3, Save, X, Plus, Navigation, Download, Upload } from 'lucide-react';
import { formatDistance, formatCoordinates, calculatePixelDistanceInMeters } from '../utils/geoUtils';

interface ControlPanelProps {
  currentFloor: FloorData;
  startPoint: Point | null;
  endPoint: Point | null;
  selectedSection: string | null;
  onSectionUpdate: (sectionId: string, updates: Partial<OfficeSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onClearPath: () => void;
  isVisible: boolean;
  onClose: () => void;
  isMobile: boolean;
  saveLayout: () => void;
  saveToFile: () => void;
  loadFromFile: () => void;
  resetToDefault: () => void;
  isAddingSection: boolean;
  onToggleAddingSection: () => void;
  isNavigating: boolean;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentFloor,
  startPoint,
  endPoint,
  selectedSection,
  onSectionUpdate,
  onSectionDelete,
  onClearPath,
  isVisible,
  onClose,
  isMobile,
  saveLayout,
  saveToFile,
  loadFromFile,
  resetToDefault,
  isAddingSection,
  onToggleAddingSection,
  isNavigating,
  onStartNavigation,
  onStopNavigation,
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<OfficeSection>>({});

  const selectedSectionData = selectedSection 
    ? currentFloor.sections.find(s => s.id === selectedSection)
    : null;

  const handleEdit = () => {
    if (selectedSectionData) {
      setEditData(selectedSectionData);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (selectedSection && editData) {
      onSectionUpdate(selectedSection, editData);
      setIsEditing(false);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const sectionTypes: OfficeSection['type'][] = [
    'office', 'meeting', 'reception', 'cafeteria', 
    'storage', 'department', 'executive', 'lounge'
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isVisible && isMobile && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        ${isMobile ? 'fixed' : 'relative'} ${isMobile ? 'top-0 left-0' : ''} h-full 
        ${isMobile ? 'w-full max-w-[90vw]' : 'w-80 lg:w-96'} 
        bg-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 
        ${isMobile ? 'p-5' : 'p-4 lg:p-6'} overflow-y-auto z-50 shadow-2xl
        transform transition-all duration-300 ease-in-out
        ${isVisible || !isMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 text-gray-400 hover:text-white bg-gray-700/50 rounded-xl backdrop-blur-sm transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
      <div className={`${isMobile ? 'space-y-6' : 'space-y-4 lg:space-y-6'}`}>
        {/* Navigation Controls */}
        <div className={`bg-gradient-to-br from-gray-700/80 to-gray-700/60 backdrop-blur-sm rounded-xl ${isMobile ? 'p-5' : 'p-4'} border border-gray-600/30 shadow-lg`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-base lg:text-lg'} font-bold ${isMobile ? 'mb-4' : 'mb-3'} flex items-center gap-2`}>
            <div className={`${isMobile ? 'p-2' : 'p-1.5'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg`}>
              <Navigation className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
            </div>
            Navigation Control
          </h3>
          
          {startPoint && endPoint ? (
            <div className={`${isMobile ? 'p-4' : 'p-3'} bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center`}>
              <p className={`text-emerald-400 ${isMobile ? 'text-base' : 'text-sm'} font-medium`}>
                ✅ Route is ready for navigation!
              </p>
            </div>
          ) : (
            <div className={`${isMobile ? 'p-4' : 'p-3'} bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center`}>
              <p className={`text-yellow-400 ${isMobile ? 'text-base' : 'text-sm'} font-medium`}>
                {!startPoint ? 'Set start point on map' : 'Set destination on map'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`bg-gradient-to-br from-gray-700/80 to-gray-700/60 backdrop-blur-sm rounded-xl ${isMobile ? 'p-5' : 'p-4'} border border-gray-600/30 shadow-lg`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-base lg:text-lg'} font-bold ${isMobile ? 'mb-4' : 'mb-3'}`}>
            Quick Actions
          </h3>
          
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-2'}`}>
            <button
              onClick={onToggleAddingSection}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-3 py-2.5 text-xs'} rounded-xl transition-all duration-300 font-medium shadow-lg ${
                isAddingSection
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white transform scale-105'
                  : 'bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 hover:text-white'
              }`}
              onClick={() => {
                onToggleAddingSection();
                if (isMobile && selectedSection) {
                  // Reset selection when toggling add mode on mobile
                  onSectionSelect(null);
                }
              }}
            >
              <Plus className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mx-auto mb-1`} />
              Add Room
            </button>
            
            <button
              onClick={saveLayout}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-3 py-2.5 text-xs'} bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-lg`}
            >
              <Save className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mx-auto mb-1`} />
              Save
            </button>
            
            <button
              onClick={saveToFile}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-3 py-2.5 text-xs'} bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-lg`}
            >
              <Download className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mx-auto mb-1`} />
              Export
            </button>
            
            <button
              onClick={loadFromFile}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-3 py-2.5 text-xs'} bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 hover:text-white rounded-xl transition-all duration-300 font-medium shadow-lg`}
            >
              <Upload className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mx-auto mb-1`} />
              Import
            </button>
          </div>
        </div>

        {/* Navigation Status */}
        <div className={`bg-gradient-to-br from-gray-700/80 to-gray-700/60 backdrop-blur-sm rounded-xl ${isMobile ? 'p-5' : 'p-4'} border border-gray-600/30 shadow-lg`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-base lg:text-lg'} font-bold ${isMobile ? 'mb-4' : 'mb-3'}`}>
            Route Status
          </h3>
          
          <div className={`${isMobile ? 'space-y-4' : 'space-y-3'} ${isMobile ? 'text-base' : 'text-sm'}`}>
            <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-gray-600/30 rounded-lg`}>
              <span className="text-gray-400">Start Point:</span>
              <span className={`font-medium ${startPoint ? 'text-emerald-400' : 'text-gray-500'}`}>
                {startPoint ? 
                  `${Math.round(startPoint.x * currentFloor.metersPerPixel * 10) / 10}m, ${Math.round(startPoint.y * currentFloor.metersPerPixel * 10) / 10}m` : 
                  'Not set'
                }
              </span>
            </div>
            
            <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-gray-600/30 rounded-lg`}>
              <span className="text-gray-400">End Point:</span>
              <span className={`font-medium ${endPoint ? 'text-red-400' : 'text-gray-500'}`}>
                {endPoint ? 
                  `${Math.round(endPoint.x * currentFloor.metersPerPixel * 10) / 10}m, ${Math.round(endPoint.y * currentFloor.metersPerPixel * 10) / 10}m` : 
                  'Not set'
                }
              </span>
            </div>
            
            {startPoint && endPoint && (
              <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-blue-500/10 border border-blue-500/20 rounded-lg`}>
                <span className="text-gray-400">Distance:</span>
                <span className="text-blue-400 font-bold">
                  {formatDistance(calculatePixelDistanceInMeters(startPoint, endPoint, currentFloor.metersPerPixel))}
                </span>
              </div>
            )}
            
            {(startPoint || endPoint) && (
              <button
                onClick={onClearPath}
                className={`w-full ${isMobile ? 'mt-4 px-5 py-3.5 text-base' : 'mt-3 px-4 py-2.5 text-sm'} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                Clear Path
              </button>
            )}
          </div>
        </div>

        {/* Floor Sections */}
        <div className={`bg-gradient-to-br from-gray-700/80 to-gray-700/60 backdrop-blur-sm rounded-xl ${isMobile ? 'p-5' : 'p-4'} border border-gray-600/30 shadow-lg`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-base lg:text-lg'} font-bold ${isMobile ? 'mb-4' : 'mb-3'} flex items-center justify-between`}>
            <span>Rooms & Areas</span>
            <span className={`${isMobile ? 'text-sm' : 'text-xs'} bg-blue-500/20 text-blue-400 ${isMobile ? 'px-3 py-1.5' : 'px-2 py-1'} rounded-full`}>
              {currentFloor.sections.length}
            </span>
          </h3>
          
          <div className={`${isMobile ? 'space-y-3' : 'space-y-2'} ${isMobile ? 'max-h-80' : 'max-h-64 lg:max-h-96'} overflow-y-auto custom-scrollbar`}>
            {currentFloor.sections.map((section) => (
              <div
                key={section.id}
                className={`${isMobile ? 'p-4' : 'p-3'} rounded-xl cursor-pointer transition-all duration-300 border ${
                  selectedSection === section.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/50 shadow-lg'
                    : 'bg-gray-600/50 hover:bg-gray-600/70 border-gray-500/30 hover:border-gray-400/50'
                }`}
                onClick={() => {}}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold truncate text-white">{section.name}</h4>
                    <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-300 capitalize font-medium`}>{section.type}</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-400`}>
                      {(section.width * currentFloor.metersPerPixel).toFixed(1)}m × {(section.height * currentFloor.metersPerPixel).toFixed(1)}m
                    </p>
                  </div>
                  
                  <div
                    className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded-lg shadow-sm border border-white/20`}
                    style={{
                      backgroundColor: getSectionTypeColor(section.type)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Editor */}
        {selectedSectionData && (
          <div className={`bg-gradient-to-br from-gray-700/80 to-gray-700/60 backdrop-blur-sm rounded-xl ${isMobile ? 'p-5' : 'p-4'} border border-gray-600/30 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${isMobile ? 'text-lg' : 'text-base lg:text-lg'} font-bold`}>Room Details</h3>
              <div className={`flex ${isMobile ? 'gap-2' : 'gap-1'}`}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className={`${isMobile ? 'p-2.5' : 'p-2'} text-emerald-400 hover:bg-emerald-400 hover:text-white rounded-lg transition-all duration-300 shadow-sm`}
                    >
                      <Save className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </button>
                    <button
                      onClick={handleCancel}
                      className={`${isMobile ? 'p-2.5' : 'p-2'} text-gray-400 hover:bg-gray-600 hover:text-white rounded-lg transition-all duration-300 shadow-sm`}
                    >
                      <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className={`${isMobile ? 'p-2.5' : 'p-2'} text-blue-400 hover:bg-blue-400 hover:text-white rounded-lg transition-all duration-300 shadow-sm`}
                    >
                      <Edit3 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </button>
                    <button
                      onClick={() => onSectionDelete(selectedSection)}
                      className={`${isMobile ? 'p-2.5' : 'p-2'} text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-all duration-300 shadow-sm`}
                    >
                      <Trash2 className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className={`${isMobile ? 'space-y-4' : 'space-y-3'}`}>
                <div>
                  <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-300 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className={`w-full ${isMobile ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5'} bg-gray-600/80 border border-gray-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  />
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-300 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                    Type
                  </label>
                  <select
                    value={editData.type || ''}
                    onChange={(e) => setEditData({...editData, type: e.target.value as OfficeSection['type']})}
                    className={`w-full ${isMobile ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5'} bg-gray-600/80 border border-gray-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  >
                    {sectionTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-2'}`}>
                  <div>
                    <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-300 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                      Width (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editData.width ? (editData.width * currentFloor.metersPerPixel).toFixed(1) : ''}
                      onChange={(e) => setEditData({...editData, width: Number(e.target.value) / currentFloor.metersPerPixel})}
                      className={`w-full ${isMobile ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5'} bg-gray-600/80 border border-gray-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    />
                  </div>
                  <div>
                    <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-semibold text-gray-300 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                      Height (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editData.height ? (editData.height * currentFloor.metersPerPixel).toFixed(1) : ''}
                      onChange={(e) => setEditData({...editData, height: Number(e.target.value) / currentFloor.metersPerPixel})}
                      className={`w-full ${isMobile ? 'px-4 py-3.5 text-base' : 'px-3 py-2.5'} bg-gray-600/80 border border-gray-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${isMobile ? 'space-y-4' : 'space-y-3'} ${isMobile ? 'text-base' : 'text-sm'}`}>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-gray-600/30 rounded-lg`}>
                  <span className="text-gray-400">Name:</span>
                  <span className="font-medium text-white">{selectedSectionData.name}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-gray-600/30 rounded-lg`}>
                  <span className="text-gray-400">Type:</span>
                  <span className="capitalize font-medium text-white">{selectedSectionData.type}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-gray-600/30 rounded-lg`}>
                  <span className="text-gray-400">Coordinates:</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-mono text-blue-400`}>{formatCoordinates(selectedSectionData.coordinates)}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-gray-600/30 rounded-lg`}>
                  <span className="text-gray-400">Size:</span>
                  <span className="font-medium text-white">{(selectedSectionData.width * currentFloor.metersPerPixel).toFixed(1)}m × {(selectedSectionData.height * currentFloor.metersPerPixel).toFixed(1)}m</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-2'} bg-emerald-500/10 border border-emerald-500/20 rounded-lg`}>
                  <span className="text-gray-400">Area:</span>
                  <span className="font-bold text-emerald-400">{((selectedSectionData.width * selectedSectionData.height * currentFloor.metersPerPixel * currentFloor.metersPerPixel)).toFixed(1)} m²</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className={`bg-gradient-to-br from-gray-700/80 to-gray-700/60 backdrop-blur-sm rounded-xl ${isMobile ? 'p-5' : 'p-4'} border border-gray-600/30 shadow-lg`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-base lg:text-lg'} font-bold ${isMobile ? 'mb-4' : 'mb-3'}`}>Instructions</h3>
          <div className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-300 ${isMobile ? 'space-y-3' : 'space-y-2.5'}`}>
            <p>• {isMobile ? 'Tap map to set navigation points' : 'Tap map to set navigation points'}</p>
            <p>• {isMobile ? 'Use + button to add new rooms' : 'Use + button to add new rooms'}</p>
            <p>• {isMobile ? 'Drag rooms to reposition them' : 'Drag rooms to reposition them'}</p>
            <p>• {isMobile ? 'Tap rooms to view details' : 'Tap rooms to view details'}</p>
            <p>• {isMobile ? 'Routes automatically avoid obstacles' : 'Routes automatically avoid obstacles'}</p>
            <p>• {isMobile ? 'All measurements in meters' : 'All measurements in meters'}</p>
            {isMobile && <p>• Swipe left/right to navigate the map</p>}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

const getSectionTypeColor = (type: OfficeSection['type']) => {
  const colors = {
    office: '#3B82F6',
    meeting: '#8B5CF6',
    reception: '#10B981',
    cafeteria: '#F59E0B',
    storage: '#6B7280',
    department: '#EF4444',
    executive: '#F97316',
    lounge: '#06B6D4'
  };
  return colors[type];
};

export default ControlPanel;