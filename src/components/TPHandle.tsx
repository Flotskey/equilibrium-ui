import React from 'react';

interface TPHandleProps {
  top: number;
  dragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  price: number;
  color?: string;
}

const handleStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  width: '100%',
  height: '16px',
  borderRadius: '4px',
  cursor: 'ns-resize',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '12px',
  pointerEvents: 'auto',
  userSelect: 'none',
};

const TPHandle: React.FC<TPHandleProps> = ({ top, dragging, onMouseDown, price }) => (
  <div
    style={{
      ...handleStyle,
      top: top - 8,
      cursor: dragging ? 'grabbing' : 'grab',
    }}
    onMouseDown={onMouseDown}
  />
);

export default TPHandle; 