import React from 'react';

interface StopHandleProps {
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
  border: '2px solid red',
};

const StopHandle: React.FC<StopHandleProps> = ({ top, dragging, onMouseDown, price }) => (
  <div
    style={{
      ...handleStyle,
      top: top - 8,
      background: dragging ? 'rgba(200,0,0,0.4)' : 'rgba(200,0,0,0.2)',
    }}
    onMouseDown={onMouseDown}
  >
    Stop ({price})
  </div>
);

export default StopHandle; 