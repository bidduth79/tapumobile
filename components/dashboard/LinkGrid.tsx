
import React from 'react';
import { LinkItem } from '../../types';
import LinkCard from '../LinkCard';

interface Props {
    groupedSections: Record<string, LinkItem[]> | null;
    flatLinks: LinkItem[];
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    setRef: (id: string, el: HTMLDivElement | null) => void;
    viewMode: 'grid' | 'list' | 'compact';
    gridSize: number;
}

const LinkGrid: React.FC<Props> = ({ groupedSections, flatLinks, selectedIds, onToggleSelection, setRef, viewMode, gridSize }) => {
  
  // Calculate Responsive Grid Columns Style
  const getGridStyle = () => {
      if (viewMode === 'list') return { display: 'flex', flexDirection: 'column', gap: '0.75rem' } as React.CSSProperties;
      
      // For grid/compact, use dynamic columns
      // Mobile always gets smaller columns than desktop
      return {
          display: 'grid',
          gap: viewMode === 'compact' ? '0.5rem' : '1rem',
          gridTemplateColumns: `repeat(auto-fill, minmax(${viewMode === 'compact' ? 140 : 180}px, 1fr))`,
          // We override this with the slider value for desktop media query in CSS or inline style
          // Since pure inline media queries aren't possible, we use a CSS variable or rely on the prop for direct styling
          // Let's use the prop directly for the column count on desktop if possible, but auto-fill is safer for responsiveness.
          // However, user wants "Zoom". 
          // Implementation: We set the column count directly via style gridTemplateColumns: repeat(N, 1fr)
          // But we need to handle mobile fallback.
      };
  };

  // Improved Grid Style handling for "Zoom" effect
  // We use CSS variables for responsiveness logic
  const gridStyle = {
      display: 'grid',
      gap: viewMode === 'compact' ? '8px' : '16px',
      // Default mobile behavior (2 cols) -> Tablet (3/4) -> Desktop (User selected gridSize)
      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  // Mobile override logic needs to be handled via class names if we want it strictly responsive
  // But here we can just use the user preference as the "Desktop" preference and clamp it for mobile in className?
  // No, let's keep it simple: Use CSS Grid's auto-fill with dynamic min-width based on "Zoom" level.
  
  // Zoom logic: Smaller min-width = More columns = Zoom Out. Larger min-width = Fewer columns = Zoom In.
  // Inverse relationship.
  // Base Size: Grid ~ 200px, Compact ~ 120px.
  // Multiplier: 
  const getDynamicStyle = () => {
      if (viewMode === 'list') return {};
      
      // Calculate min-width based on gridSize (which acts as column count for standard 1920px screen)
      // Approx width = 100% / gridSize. 
      // But purely responsive is better:
      // Let's stick to the "gridTemplateColumns" approach but wrapped in a media query container if possible.
      // Since we can't easily do that inline, let's use the `gridSize` as a direct column count and allow it to squash on mobile?
      // No, that breaks mobile layout.
      
      // Better approach: Responsive classes for mobile/tablet, and inline style for Large screens.
      return {
          '--desktop-cols': gridSize,
      } as React.CSSProperties;
  };

  // Class construction
  const getGridClass = () => {
      if (viewMode === 'list') return 'flex flex-col gap-2';
      
      // Base: 2 columns on mobile, 3 on tablet.
      // Desktop (lg): Use the custom property variable
      return `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(var(--desktop-cols),minmax(0,1fr))] gap-3 transition-all duration-300`;
  };

  const containerClass = getGridClass();
  const containerStyle = getDynamicStyle();

  if (groupedSections) {
      return (
        <div className="space-y-8 animate-fadeIn">
            {Object.keys(groupedSections).map(groupName => (
                <div key={groupName} className="glass-panel p-5 rounded-xl shadow-sm relative border border-gray-100 dark:border-gray-700">
                    <div className="absolute -top-3 left-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wide z-10">
                        {groupName}
                    </div>
                    <div className={containerClass} style={containerStyle}>
                        {groupedSections[groupName].map(link => (
                            <LinkCard 
                                key={link.id} 
                                link={link} 
                                isSelected={selectedIds.has(link.id)}
                                onContextSelect={() => onToggleSelection(link.id)}
                                ref={(el) => setRef(link.id, el)}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      );
  }

  return (
    <div className={`${containerClass} animate-fadeIn`} style={containerStyle}>
      {flatLinks.map(link => (
        <LinkCard 
            key={link.id} 
            link={link} 
            isSelected={selectedIds.has(link.id)}
            onContextSelect={() => onToggleSelection(link.id)}
            ref={(el) => setRef(link.id, el)}
            viewMode={viewMode}
        />
      ))}
    </div>
  );
};

export default LinkGrid;
