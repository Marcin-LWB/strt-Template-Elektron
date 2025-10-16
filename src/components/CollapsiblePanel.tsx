import { useState } from 'react';
import './CollapsiblePanel.css';

interface CollapsiblePanelProps {
  title: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: React.ReactNode;
}

/**
 * Komponent zwijalnej belki/panelu
 */
export default function CollapsiblePanel({ 
  title, 
  defaultExpanded = true,
  expanded: controlledExpanded,
  onExpandedChange,
  children 
}: CollapsiblePanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  
  // Use controlled value if provided, otherwise use internal state
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleToggle = () => {
    const newExpanded = !expanded;
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  return (
    <div className={`collapsible-panel ${expanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="panel-header" 
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle();
          }
        }}
      >
        <h2 className="panel-title">
          <span className="panel-icon">{expanded ? '▼' : '▶'}</span>
          {title}
        </h2>
      </div>
      
      {expanded && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
}
