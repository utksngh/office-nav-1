import React, { useState } from 'react';
import { Search, Target, X, MapPin } from 'lucide-react';
import { FloorData, Point, OfficeSection } from '../types';

interface MobileQuickNavigationProps {
  currentFloor: FloorData;
  startPoint: Point | null;
  endPoint: Point | null;
  onSetNavigationPoint: (point: Point, type: 'start' | 'end') => void;
  onClearPath: () => void;
}

const MobileQuickNavigation: React.FC<MobileQuickNavigationProps> = ({
  currentFloor,
  startPoint,
  endPoint,
  onSetNavigationPoint,
  onClearPath
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchType, setSearchType] = useState<'start' | 'end'>('start');

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

  // Filter sections based on search query
  const filteredSections = currentFloor.sections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (section: OfficeSection) => {
    const centerPoint: Point = {
      x: section.x + section.width / 2,
      y: section.y + section.height / 2
    };
    onSetNavigationPoint(centerPoint, searchType);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleClearStart = () => {
    // Clear only start point by setting a dummy point and then clearing all
    onClearPath();
    if (endPoint) {
      // If end point exists, restore it
      setTimeout(() => {
        onSetNavigationPoint(endPoint, 'end');
      }, 10);
    }
  };

  const handleClearEnd = () => {
    // Clear only end point by setting a dummy point and then clearing all
    onClearPath();
    if (startPoint) {
      // If start point exists, restore it
      setTimeout(() => {
        onSetNavigationPoint(startPoint, 'start');
      }, 10);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md shadow-lg">
            <Search className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Quick Navigation</h3>
        </div>
        
        {/* Status Indicator */}
        <div className="text-xs">
          {startPoint && endPoint ? (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              Route Ready
            </span>
          ) : startPoint ? (
            <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
              Set End
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-400 bg-gray-400/10 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Set Start
            </span>
          )}
        </div>
      </div>

      {/* Search Type Toggle */}
      <div className="flex bg-gray-700/80 rounded-lg p-1 shadow-inner">
        <button
          onClick={() => setSearchType('start')}
          className={`flex-1 px-3 py-2 text-xs rounded-md transition-all duration-300 font-medium flex items-center justify-center gap-1.5 ${
            searchType === 'start'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
          }`}
        >
          <div className="w-2 h-2 bg-current rounded-full"></div>
          Set Start
        </button>
        <button
          onClick={() => setSearchType('end')}
          className={`flex-1 px-3 py-2 text-xs rounded-md transition-all duration-300 font-medium flex items-center justify-center gap-1.5 ${
            searchType === 'end'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
          }`}
        >
          <Target className="w-3 h-3" />
          Set End
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search rooms for ${searchType} point...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            onBlur={() => {
              // Delay hiding results to allow for clicks
              setTimeout(() => setShowSearchResults(false), 150);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-700/80 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-inner"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSearchSelect(section)}
                  className="w-full p-3 text-left hover:bg-gray-700/70 transition-all duration-200 border-b border-gray-600/30 last:border-b-0 flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm shadow-sm border border-white/20"
                        style={{ backgroundColor: getSectionTypeColor(section.type) }}
                      />
                      <span className="font-medium text-white text-sm">
                        {section.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 capitalize ml-5">
                      {section.type} • {(section.width * currentFloor.metersPerPixel).toFixed(1)}m × {(section.height * currentFloor.metersPerPixel).toFixed(1)}m
                    </p>
                  </div>
                  <div className={`${searchType === 'start' ? 'text-emerald-400' : 'text-red-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    <Target className="w-4 h-4" />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                No rooms found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Selection Display */}
      {(startPoint || endPoint) && (
        <div className="flex gap-2">
          {startPoint && (
            <div className="flex-1 flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-medium">Start Set</span>
              </div>
              <button
                onClick={handleClearStart}
                className="p-1 text-emerald-400 hover:bg-emerald-400 hover:text-white rounded transition-all duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {endPoint && (
            <div className="flex-1 flex items-center justify-between p-2.5 bg-red-500/10 border border-red-500/20 rounded-md">
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400 font-medium">End Set</span>
              </div>
              <button
                onClick={handleClearEnd}
                className="p-1 text-red-400 hover:bg-red-400 hover:text-white rounded transition-all duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileQuickNavigation;