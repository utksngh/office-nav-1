import React, { useState } from 'react';
import { FloorData, Point, OfficeSection } from '../types';
import { MapPin, Trash2, Edit3, Save, X } from 'lucide-react';

interface ControlPanelProps {
  currentFloor: FloorData;
  startPoint: Point | null;
  endPoint: Point | null;
  selectedSection: string | null;
  onSectionUpdate: (sectionId: string, updates: Partial<OfficeSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onClearPath: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentFloor,
  startPoint,
  endPoint,
  selectedSection,
  onSectionUpdate,
  onSectionDelete,
  onClearPath
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
    <aside className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Status */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Navigation
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Start Point:</span>
              <span className={startPoint ? 'text-emerald-400' : 'text-gray-500'}>
                {startPoint ? `(${Math.round(startPoint.x)}, ${Math.round(startPoint.y)})` : 'Not set'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">End Point:</span>
              <span className={endPoint ? 'text-red-400' : 'text-gray-500'}>
                {endPoint ? `(${Math.round(endPoint.x)}, ${Math.round(endPoint.y)})` : 'Not set'}
              </span>
            </div>
            
            {(startPoint || endPoint) && (
              <button
                onClick={onClearPath}
                className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 text-sm"
              >
                Clear Path
              </button>
            )}
          </div>
        </div>

        {/* Floor Sections */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">
            Floor Sections ({currentFloor.sections.length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentFloor.sections.map((section) => (
              <div
                key={section.id}
                className={`p-3 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedSection === section.id
                    ? 'bg-blue-600 border border-blue-400'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                onClick={() => {
                  // This would be handled by the parent component
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium truncate">{section.name}</h4>
                    <p className="text-xs text-gray-300 capitalize">{section.type}</p>
                    <p className="text-xs text-gray-400">
                      {section.width} × {section.height} px
                    </p>
                  </div>
                  
                  <div
                    className="w-4 h-4 rounded"
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
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Edit Section</h3>
              <div className="flex gap-1">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-1 text-emerald-400 hover:bg-emerald-400 hover:text-white rounded transition-colors duration-200"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1 text-gray-400 hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="p-1 text-blue-400 hover:bg-blue-400 hover:text-white rounded transition-colors duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSectionDelete(selectedSection)}
                      className="p-1 text-red-400 hover:bg-red-400 hover:text-white rounded transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={editData.type || ''}
                    onChange={(e) => setEditData({...editData, type: e.target.value as OfficeSection['type']})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sectionTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={editData.width || ''}
                      onChange={(e) => setEditData({...editData, width: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={editData.height || ''}
                      onChange={(e) => setEditData({...editData, height: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span>{selectedSectionData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="capitalize">{selectedSectionData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Position:</span>
                  <span>({Math.round(selectedSectionData.x)}, {Math.round(selectedSectionData.y)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span>{selectedSectionData.width} × {selectedSectionData.height}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Instructions</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>• Click on the map to set start and end points</p>
            <p>• Use the + button to add new sections</p>
            <p>• Drag sections to move them around</p>
            <p>• Click sections to select and edit them</p>
            <p>• Paths automatically avoid office spaces</p>
          </div>
        </div>
      </div>
    </aside>
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