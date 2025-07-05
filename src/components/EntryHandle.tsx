import React from 'react';

interface EntryHandleProps {
  top: number;
  dragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  price: number;
}

const handleStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '16px',
  borderRadius: '4px',
  cursor: 'ns-resize',
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 600,
  pointerEvents: 'auto',
  userSelect: 'none',
  border: '2px solid green',
};

const EntryHandle: React.FC<EntryHandleProps> = ({ top, dragging, onMouseDown, price }) => (
  <div
    style={{
      ...handleStyle,
      top: top - 8,
      background: dragging ? 'rgba(0,128,0,0.4)' : 'rgba(0,128,0,0.2)',
    }}
    onMouseDown={onMouseDown}
  >
    Entry ({price})
  </div>
);

export default EntryHandle; 