
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { useParams } from 'react-router-dom';
import { LinkItem } from '../types';
import InfographicDashboard from './InfographicDashboard';
import YouTubeFeed from './dashboard/YouTubeFeed';
import FavoritesPanel from './dashboard/FavoritesPanel';
import ControlBar from './dashboard/ControlBar';
import LinkGrid from './dashboard/LinkGrid';
import EmptyState from './dashboard/EmptyState';

declare global {
  interface Window {
    Swal: any;
  }
}

const Dashboard: React.FC = () => {
  const { links, user, openLink, searchQuery, seedDatabase, t } = useApp();
  const { category, subCategory, childCategory } = useParams();
  
  // Refs for navigation
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [focusIndex, setFocusIndex] = useState(-1);

  // Multi-selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- VIEW MODE & ZOOM SETTINGS (Persisted) ---
  const [viewMode, setViewModeState] = useState<'grid' | 'list' | 'compact'>(() => {
      const saved = localStorage.getItem('pref_view_mode');
      return (saved === 'grid' || saved === 'list' || saved === 'compact') ? saved : 'grid';
  });

  const [gridSize, setGridSizeState] = useState<number>(() => {
      const saved = localStorage.getItem('pref_grid_size');
      return saved ? parseInt(saved) : 5; // Default 5 columns
  });

  const setViewMode = (mode: 'grid' | 'list' | 'compact') => {
      setViewModeState(mode);
      localStorage.setItem('pref_view_mode', mode);
      // Reset grid size to sensible defaults when switching modes
      if (mode === 'grid') setGridSize(5);
      if (mode === 'compact') setGridSize(8);
  };

  const setGridSize = (size: number) => {
      setGridSizeState(size);
      localStorage.setItem('pref_grid_size', size.toString());
  };

  // --- Contextual Favorites Logic ---
  const favorites = useMemo(() => {
    if (!category) return links.filter(l => l.isFavorite);
    return links.filter(l => l.isFavorite && l.category === category);
  }, [links, category]);

  // Filter links based on URL params AND search query
  const filteredLinks = useMemo(() => {
    let result = links;

    // Search Filter (Global)
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(lowerQ) || 
        l.url.toLowerCase().includes(lowerQ)
      );
    } else {
      if (!category) {
         result = result.sort((a,b) => a.order - b.order); 
      } else {
         result = result.filter(link => {
            if (link.category !== category) return false;
            if (subCategory && link.subCategory !== subCategory) return false;
            if (childCategory && link.childCategory !== childCategory) return false;
            return true;
         });
      }
    }
    return result;
  }, [links, category, subCategory, childCategory, searchQuery]);

  // Reset focus and selection when query/category changes
  useEffect(() => {
    setFocusIndex(-1);
    setSelectedIds(new Set());
  }, [searchQuery, category, subCategory, childCategory]);

  // Toggle Selection on Right Click
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  // Generic Open Function
  const confirmAndOpen = (items: LinkItem[]) => {
      if (items.length === 0) return;

      const executeOpen = () => {
        items.forEach(link => {
            openLink(link);
        });
        setSelectedIds(new Set()); 
      };

      if (items.length > 5) {
        if (window.Swal) {
          window.Swal.fire({
            title: 'সতর্কতা',
            text: `আপনি একসাথে ${items.length} টি ট্যাব খুলতে যাচ্ছেন। এটি ব্রাউজার স্লো করতে পারে।`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0ea5e9',
            cancelButtonColor: '#d33',
            confirmButtonText: 'চালিয়ে যান',
            cancelButtonText: 'বাতিল',
          }).then((result: any) => {
            if (result.isConfirmed) {
              executeOpen();
            }
          });
        } else {
            if (window.confirm(`আপনি ${items.length} টি ট্যাব একসাথে খুলতে যাচ্ছেন। নিশ্চিত?`)) executeOpen();
        }
      } else {
          executeOpen();
      }
  };

  const openSelected = () => {
      const linksToOpen = links.filter(l => selectedIds.has(l.id));
      confirmAndOpen(linksToOpen);
  };

  // Global Key Listener for Ctrl + Enter
  useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.key === 'Enter') {
              if (selectedIds.size > 0) {
                  e.preventDefault();
                  openSelected();
              }
          }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedIds, links]);


  const getBreadcrumb = () => {
    if (selectedIds.size > 0) return `${t('selected')}: ${selectedIds.size} টি`;
    if (searchQuery) return `${t('search_result')}: "${searchQuery}"`;
    if (!category) return t('dashboard');
    return `${t(category)} ${subCategory ? '/ ' + t(subCategory) : ''} ${childCategory ? '/ ' + t(childCategory) : ''}`;
  };

  const handleSeed = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে আপনি ডাটাবেসে ডিফল্ট পেপার লিস্ট আপলোড করতে চান?")) {
        seedDatabase();
    }
  };

  // --- Grouping Logic for "All" Views ---
  const groupedSections = useMemo(() => {
    if (searchQuery || !category || subCategory) return null;

    const groups: Record<string, LinkItem[]> = {};
    
    filteredLinks.forEach(link => {
        const sub = link.subCategory || 'General';
        const child = link.childCategory ? ` - ${link.childCategory}` : '';
        const key = `${sub.toUpperCase()}${child.toUpperCase()}`;
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(link);
    });

    return groups;
  }, [filteredLinks, category, subCategory, searchQuery]);


  // --- SPECIAL VIEW FOR YOUTUBE UPDATES ---
  if (category === 'talkshow' && subCategory === 'latest_updates') {
      return <YouTubeFeed />;
  }

  // --- STANDARD DASHBOARD VIEW ---

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* SHOW INFOGRAPHIC DASHBOARD ONLY ON HOME ROUTE (NO CATEGORY SELECTED) */}
      {!category && !searchQuery && (
          <InfographicDashboard />
      )}

      {/* --- FAVORITE PANEL (TOP) --- */}
      {!searchQuery && (
          <FavoritesPanel 
            favorites={favorites} 
            category={category} 
            selectedIds={selectedIds} 
            onToggleSelection={toggleSelection} 
          />
      )}

      {/* --- HEADER / BREADCRUMB / VIEW CONTROLS --- */}
      <ControlBar 
        breadcrumb={getBreadcrumb()}
        totalItems={filteredLinks.length}
        selectedCount={selectedIds.size}
        searchQuery={searchQuery}
        onCancelSelection={() => setSelectedIds(new Set())}
        onOpenSelected={openSelected}
        onOpenAll={() => confirmAndOpen(filteredLinks)}
        hasFilteredLinks={filteredLinks.length > 0}
        // View Props
        viewMode={viewMode}
        setViewMode={setViewMode}
        gridSize={gridSize}
        setGridSize={setGridSize}
      />

      {/* --- CONTENT AREA --- */}
      {filteredLinks.length === 0 ? (
        <EmptyState 
            onSeed={handleSeed}
            isAdmin={user?.role === 'admin'}
            isEmpty={links.length === 0}
        />
      ) : (
        <LinkGrid 
            groupedSections={groupedSections}
            flatLinks={filteredLinks}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            setRef={(id, el) => {
                if (el) cardRefs.current.set(id, el);
                else cardRefs.current.delete(id);
            }}
            viewMode={viewMode}
            gridSize={gridSize}
        />
      )}
    </div>
  );
};

export default Dashboard;
