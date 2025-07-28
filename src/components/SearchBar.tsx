import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, ArrowLeft } from 'lucide-react';
import { OfficeSection } from '../types';

interface SearchBarProps {
  sections: OfficeSection[];
  onSectionSelect: (sectionId: string) => void;
  onSectionHighlight: (sectionId: string | null) => void;
  selectedSection: string | null;
  isMobile: boolean;
  onAutoScroll?: (sectionId: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  sections,
  onSectionSelect,
  onSectionHighlight,
  selectedSection,
  isMobile,
  onAutoScroll
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSections, setFilteredSections] = useState<OfficeSection[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter sections based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = sections.filter(section =>
        section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSections(filtered);
      setHighlightedIndex(-1);
      setIsOpen(true);
    } else {
      setFilteredSections([]);
      setIsOpen(false);
      onSectionHighlight(null);
    }
  }, [searchTerm, sections, onSectionHighlight]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSections.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSections.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSections.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSections.length) {
          handleSectionSelect(filteredSections[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Update highlight when keyboard navigation changes
  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredSections.length) {
      onSectionHighlight(filteredSections[highlightedIndex].id);
    }
  }, [highlightedIndex, filteredSections, onSectionHighlight]);

  const handleSectionSelect = (section: OfficeSection) => {
    onSectionSelect(section.id);
    onAutoScroll?.(section.id);
    setSearchTerm(section.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSectionHighlight(null);
    if (isMobile) {
      setIsMobileSearchActive(false);
    }
    inputRef.current?.focus();
  };

  const activateMobileSearch = () => {
    if (isMobile) {
      setIsMobileSearchActive(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const deactivateMobileSearch = () => {
    if (isMobile) {
      setIsMobileSearchActive(false);
      setSearchTerm('');
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSectionHighlight(null);
    }
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

  return (
    <>
      {/* Mobile Search Overlay */}
      {isMobile && isMobileSearchActive && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-[70] flex flex-col">
          {/* Mobile Search Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
            <button
              onClick={deactivateMobileSearch}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search rooms and areas..."
                className="w-full pl-4 pr-10 py-3 text-base bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Search Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredSections.length > 0 ? (
              <div className="space-y-3">
                {filteredSections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      handleSectionSelect(section);
                      deactivateMobileSearch();
                    }}
                    className={`w-full p-4 text-left bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 rounded-xl border border-gray-700/30 ${
                      index === highlightedIndex ? 'bg-blue-500/20 border-blue-400/30' : ''
                    } ${
                      selectedSection === section.id ? 'bg-blue-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-lg shadow-sm border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: getSectionTypeColor(section.type) }}
                          />
                          <div>
                            <h4 className="font-semibold text-white text-base">
                              {section.name}
                            </h4>
                            <p className="text-sm text-gray-300 capitalize">
                              {section.type}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {selectedSection === section.id && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">No rooms found</p>
                <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">Start typing to search</p>
                <p className="text-gray-500 text-sm mt-2">Find rooms, offices, and areas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Search or Mobile Search Icon */}
      <div ref={searchRef} className={`relative ${isMobile ? 'w-auto' : 'w-full max-w-md'} z-10`}>
        {isMobile && !isMobileSearchActive ? (
          /* Mobile Search Icon */
          <button
            onClick={activateMobileSearch}
            className="p-2.5 bg-gray-700/80 backdrop-blur-sm text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-all duration-300 shadow-lg"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : !isMobile ? (
          /* Desktop Search Bar */
          <>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredSections.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search rooms and areas..."
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg"
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredSections.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl z-[60] max-h-64 overflow-y-auto custom-scrollbar">
          {filteredSections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleSectionSelect(section)}
              className={`w-full p-3 text-left hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-700/30 last:border-b-0 ${
                index === highlightedIndex ? 'bg-blue-500/20 border-blue-400/30' : ''
              } ${
                selectedSection === section.id ? 'bg-blue-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-lg shadow-sm border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: getSectionTypeColor(section.type) }}
                    />
                    <div>
                      <h4 className="font-semibold text-white text-sm">
                        {section.name}
                      </h4>
                      <p className="text-xs text-gray-300 capitalize">
                        {section.type}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {selectedSection === section.id && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm && filteredSections.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl z-[60]">
          <div className="p-3 text-center text-gray-400">
            <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rooms found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        </div>
      )}
          </>
        ) : null}
      </div>
    </>
    </div>
  );
};

export default SearchBar;