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
  onSectionSelect: (sectionId: string | null) => void;
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
  onSectionSelect,
}) => {
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
        ${isMobile ? 'w-full max-w-[85vw]' : 'w-80 lg:w-96'} 
        bg-white border-r border-gray-200 
        ${isMobile ? 'p-4' : 'p-4 lg:p-6'} overflow-y-auto z-50 shadow-2xl
        transform transition-all duration-300 ease-in-out
        ${isVisible || !isMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-2xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
      <div className={`${isMobile ? 'space-y-4' : 'space-y-4 lg:space-y-6'}`}>
        {/* Navigation Controls */}
        <div className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl ${isMobile ? 'p-5' : 'p-5'} border border-purple-200 shadow-sm`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-lg lg:text-xl'} font-black ${isMobile ? 'mb-4' : 'mb-4'} flex items-center gap-3 text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            <div className={`${isMobile ? 'p-2' : 'p-2'} bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl`}>
              <Navigation className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-white`} />
            </div>
            Navigation Control
          </h3>
          
          {startPoint && endPoint ? (
            <div className={`${isMobile ? 'p-4' : 'p-4'} bg-teal-100 border border-teal-200 rounded-2xl text-center`}>
              <p className={`text-teal-600 ${isMobile ? 'text-base' : 'text-base'} font-bold`}>
                ✅ Route is ready for navigation!
              </p>
            </div>
          ) : (
            <div className={`${isMobile ? 'p-4' : 'p-4'} bg-yellow-100 border border-yellow-200 rounded-2xl text-center`}>
              <p className={`text-yellow-600 ${isMobile ? 'text-base' : 'text-base'} font-bold`}>
                {!startPoint ? 'Set start point on map' : 'Set destination on map'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl ${isMobile ? 'p-5' : 'p-5'} border border-gray-200 shadow-sm`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-lg lg:text-xl'} font-black ${isMobile ? 'mb-4' : 'mb-4'} text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            Quick Actions
          </h3>
          
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-3'}`}>
            <button
              onClick={() => {
                onToggleAddingSection();
                if (isMobile && selectedSection) {
                  // Reset selection when toggling add mode on mobile
                  onSectionSelect(null);
                }
              }}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-4 py-3 text-sm'} rounded-2xl transition-all duration-300 font-bold shadow-sm ${
                isAddingSection
                  ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white transform scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Plus className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mx-auto mb-1`} />
              Add Room
            </button>
            
            <button
              onClick={saveLayout}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-4 py-3 text-sm'} bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 rounded-2xl transition-all duration-300 font-bold shadow-sm`}
            >
              <Save className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mx-auto mb-1`} />
              Save
            </button>
            
            <button
              onClick={saveToFile}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-4 py-3 text-sm'} bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 rounded-2xl transition-all duration-300 font-bold shadow-sm`}
            >
              <Download className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mx-auto mb-1`} />
              Export
            </button>
            
            <button
              onClick={loadFromFile}
              className={`${isMobile ? 'px-4 py-3 text-sm' : 'px-4 py-3 text-sm'} bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 rounded-2xl transition-all duration-300 font-bold shadow-sm`}
            >
              <Upload className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mx-auto mb-1`} />
              Import
            </button>
          </div>
        </div>

        {/* Navigation Status */}
        <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl ${isMobile ? 'p-5' : 'p-5'} border border-blue-200 shadow-sm`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-lg lg:text-xl'} font-black ${isMobile ? 'mb-4' : 'mb-4'} text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            Route Status
          </h3>
          
          <div className={`${isMobile ? 'space-y-3' : 'space-y-3'} ${isMobile ? 'text-base' : 'text-base'}`}>
            <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-2xl border border-gray-200`}>
              <span className="text-gray-600 font-medium">Start Point:</span>
              <span className={`font-bold ${startPoint ? 'text-teal-600' : 'text-gray-500'}`}>
                {startPoint ? 
                  `${Math.round(startPoint.x * currentFloor.metersPerPixel * 10) / 10}m, ${Math.round(startPoint.y * currentFloor.metersPerPixel * 10) / 10}m` : 
                  'Not set'
                }
              </span>
            </div>
            
            <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-2xl border border-gray-200`}>
              <span className="text-gray-600 font-medium">End Point:</span>
              <span className={`font-bold ${endPoint ? 'text-red-500' : 'text-gray-500'}`}>
                {endPoint ? 
                  `${Math.round(endPoint.x * currentFloor.metersPerPixel * 10) / 10}m, ${Math.round(endPoint.y * currentFloor.metersPerPixel * 10) / 10}m` : 
                  'Not set'
                }
              </span>
            </div>
            
            {startPoint && endPoint && (
              <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-purple-100 border border-purple-200 rounded-2xl`}>
                <span className="text-gray-600 font-medium">Distance:</span>
                <span className="text-purple-600 font-black text-lg">
                  {formatDistance(calculatePixelDistanceInMeters(startPoint, endPoint, currentFloor.metersPerPixel))}
                </span>
              </div>
            )}
            
            {(startPoint || endPoint) && (
              <button
                onClick={onClearPath}
                className={`w-full ${isMobile ? 'mt-4 px-5 py-3 text-base' : 'mt-4 px-5 py-3 text-base'} bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-2xl transition-all duration-300 font-bold shadow-sm hover:shadow-md transform hover:scale-105`}
              >
                Clear Path
              </button>
            )}
          </div>
        </div>

        {/* Floor Sections */}
        <div className={`bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl ${isMobile ? 'p-5' : 'p-5'} border border-yellow-200 shadow-sm`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-lg lg:text-xl'} font-black ${isMobile ? 'mb-4' : 'mb-4'} flex items-center justify-between text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            <span>Rooms & Areas</span>
            <span className={`${isMobile ? 'text-sm' : 'text-sm'} bg-yellow-200 text-yellow-700 ${isMobile ? 'px-3 py-1.5' : 'px-3 py-1.5'} rounded-full font-bold`}>
              {currentFloor.sections.length}
            </span>
          </h3>
          
          <div className={`${isMobile ? 'space-y-3' : 'space-y-3'} ${isMobile ? 'max-h-64' : 'max-h-64 lg:max-h-96'} overflow-y-auto custom-scrollbar`}>
            {currentFloor.sections.map((section) => (
              <div
                key={section.id}
                className={`${isMobile ? 'p-4' : 'p-4'} rounded-2xl cursor-pointer transition-all duration-300 border ${
                  selectedSection === section.id
                    ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSectionSelect(section.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold truncate text-gray-900">{section.name}</h4>
                    <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600 capitalize font-medium`}>{section.type}</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-500 font-medium`}>
                      {(section.width * currentFloor.metersPerPixel).toFixed(1)}m × {(section.height * currentFloor.metersPerPixel).toFixed(1)}m
                    </p>
                  </div>
                  
                  <div
                    className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} rounded-xl shadow-sm border border-white`}
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
          <div className={`bg-gradient-to-br from-red-50 to-red-100 rounded-2xl ${isMobile ? 'p-5' : 'p-5'} border border-red-200 shadow-sm`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-5'}`}>
              <h3 className={`${isMobile ? 'text-lg' : 'text-lg lg:text-xl'} font-black text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Room Details</h3>
              <div className={`flex ${isMobile ? 'gap-2' : 'gap-2'}`}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className={`${isMobile ? 'p-2.5' : 'p-2.5'} text-teal-600 hover:bg-teal-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm border border-teal-200`}
                    >
                      <Save className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
                    </button>
                    <button
                      onClick={handleCancel}
                      className={`${isMobile ? 'p-2.5' : 'p-2.5'} text-gray-600 hover:bg-gray-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm border border-gray-200`}
                    >
                      <X className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className={`${isMobile ? 'p-2.5' : 'p-2.5'} text-purple-600 hover:bg-purple-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm border border-purple-200`}
                    >
                      <Edit3 className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
                    </button>
                    <button
                      onClick={() => onSectionDelete(selectedSection)}
                      className={`${isMobile ? 'p-2.5' : 'p-2.5'} text-red-600 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm border border-red-200`}
                    >
                      <Trash2 className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className={`${isMobile ? 'space-y-4' : 'space-y-4'}`}>
                <div>
                  <label className={`block ${isMobile ? 'text-base' : 'text-base'} font-bold text-gray-700 ${isMobile ? 'mb-2' : 'mb-2'}`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-3'} bg-white border border-gray-300 rounded-2xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium`}
                  />
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-base' : 'text-base'} font-bold text-gray-700 ${isMobile ? 'mb-2' : 'mb-2'}`}>
                    Type
                  </label>
                  <select
                    value={editData.type || ''}
                    onChange={(e) => setEditData({...editData, type: e.target.value as OfficeSection['type']})}
                    className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-3'} bg-white border border-gray-300 rounded-2xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium`}
                  >
                    {sectionTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-3'}`}>
                  <div>
                    <label className={`block ${isMobile ? 'text-base' : 'text-base'} font-bold text-gray-700 ${isMobile ? 'mb-2' : 'mb-2'}`}>
                      Width (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editData.width ? (editData.width * currentFloor.metersPerPixel).toFixed(1) : ''}
                      onChange={(e) => setEditData({...editData, width: Number(e.target.value) / currentFloor.metersPerPixel})}
                      className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-3'} bg-white border border-gray-300 rounded-2xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium`}
                    />
                  </div>
                  <div>
                    <label className={`block ${isMobile ? 'text-base' : 'text-base'} font-bold text-gray-700 ${isMobile ? 'mb-2' : 'mb-2'}`}>
                      Height (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editData.height ? (editData.height * currentFloor.metersPerPixel).toFixed(1) : ''}
                      onChange={(e) => setEditData({...editData, height: Number(e.target.value) / currentFloor.metersPerPixel})}
                      className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-3'} bg-white border border-gray-300 rounded-2xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${isMobile ? 'space-y-3' : 'space-y-3'} ${isMobile ? 'text-base' : 'text-base'}`}>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-2xl border border-gray-200`}>
                  <span className="text-gray-600 font-medium">Name:</span>
                  <span className="font-bold text-gray-900">{selectedSectionData.name}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-2xl border border-gray-200`}>
                  <span className="text-gray-600 font-medium">Type:</span>
                  <span className="capitalize font-bold text-gray-900">{selectedSectionData.type}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-2xl border border-gray-200`}>
                  <span className="text-gray-600 font-medium">Coordinates:</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-mono text-purple-600 font-bold`}>{formatCoordinates(selectedSectionData.coordinates)}</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-white rounded-2xl border border-gray-200`}>
                  <span className="text-gray-600 font-medium">Size:</span>
                  <span className="font-bold text-gray-900">{(selectedSectionData.width * currentFloor.metersPerPixel).toFixed(1)}m × {(selectedSectionData.height * currentFloor.metersPerPixel).toFixed(1)}m</span>
                </div>
                <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-3'} bg-teal-100 border border-teal-200 rounded-2xl`}>
                  <span className="text-gray-600 font-medium">Area:</span>
                  <span className="font-black text-teal-600 text-lg">{((selectedSectionData.width * selectedSectionData.height * currentFloor.metersPerPixel * currentFloor.metersPerPixel)).toFixed(1)} m²</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl ${isMobile ? 'p-5' : 'p-5'} border border-gray-200 shadow-sm`}>
          <h3 className={`${isMobile ? 'text-lg' : 'text-lg lg:text-xl'} font-black ${isMobile ? 'mb-4' : 'mb-4'} text-gray-900`} style={{ fontFamily: '"Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>Instructions</h3>
          <div className={`${isMobile ? 'text-base' : 'text-base'} text-gray-700 ${isMobile ? 'space-y-2' : 'space-y-3'} font-medium`}>
            <p>• Tap map to set navigation points</p>
            <p>• {isMobile ? 'Use floating zoom buttons' : 'Use zoom controls to adjust view'}</p>
            <p>• Use + button to add new rooms</p>
            <p>• Drag rooms to reposition them</p>
            <p>• Tap rooms to view details</p>
            <p>• Routes automatically avoid obstacles</p>
            <p>• All measurements in meters</p>
            {isMobile && <p>• Pinch to zoom, swipe to navigate</p>}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

const getSectionTypeColor = (type: OfficeSection['type']) => {
  const colors = {
    office: '#8B5CF6',      // Purple
    meeting: '#FDB913',     // Warm Yellow
    reception: '#00B29E',   // Aqua Teal
    cafeteria: '#FA5A5A',   // Coral Red
    storage: '#D7C8F6',     // Light Lavender
    department: '#3B82F6',  // Blue
    executive: '#F97316',   // Orange
    lounge: '#06B6D4'       // Cyan
  };
  return colors[type];
};

export default ControlPanel;