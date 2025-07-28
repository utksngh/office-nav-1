import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
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
    inputRef.current?.focus();
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
    <div ref={searchRef} className={`relative ${isMobile ? 'w-full' : 'w-full max-w-md'} z-10`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-gray-400`} />
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
          placeholder={isMobile ? "Search rooms..." : "Search rooms and areas..."}
          className={`w-full ${isMobile ? 'pl-10 pr-10 py-3 text-base' : 'pl-9 pr-9 py-2.5 text-sm'} bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg`}
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredSections.length > 0 && (
        <div className={`absolute top-full ${isMobile ? 'left-0 right-0' : 'left-0 right-0'} ${isMobile ? 'mt-2' : 'mt-1'} bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl z-[60] ${isMobile ? 'max-h-80' : 'max-h-64'} overflow-y-auto custom-scrollbar`}>
          {filteredSections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => handleSectionSelect(section)}
              className={`w-full ${isMobile ? 'p-4' : 'p-3'} text-left hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-700/30 last:border-b-0 ${
                index === highlightedIndex ? 'bg-blue-500/20 border-blue-400/30' : ''
              } ${
                selectedSection === section.id ? 'bg-blue-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} rounded-lg shadow-sm border border-white/20 flex-shrink-0`}
                      style={{ backgroundColor: getSectionTypeColor(section.type) }}
                    />
                    <div>
                      <h4 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-sm'}`}>
                        {section.name}
                      </h4>
                      <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-300 capitalize`}>
                        {section.type}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
                  {selectedSection === section.id && (
                    <div className={`${isMobile ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-blue-400 rounded-full animate-pulse`} />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm && filteredSections.length === 0 && (
        <div className={`absolute top-full ${isMobile ? 'left-0 right-0' : 'left-0 right-0'} ${isMobile ? 'mt-2' : 'mt-1'} bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl z-[60]`}>
          <div className={`${isMobile ? 'p-4' : 'p-3'} text-center text-gray-400`}>
            <Search className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} mx-auto mb-2 opacity-50`} />
            <p className={`${isMobile ? 'text-base' : 'text-sm'}`}>No rooms found</p>
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;