import React from 'react';
import { MusicVector } from '../types/music';
import { VECTOR_DIMENSION_KEYS, VECTOR_DIMENSIONS_META, musicVectorToArray } from '../services/vectorDb/vectorMath';

interface VectorRadarChartProps {
  primaryVector: MusicVector;
  secondaryVector?: MusicVector;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  showLabels?: boolean;
}

export const VectorRadarChart: React.FC<VectorRadarChartProps> = ({
  primaryVector,
  secondaryVector,
  primaryLabel = 'Current Vector',
  secondaryLabel = 'Target / Baseline',
  primaryColor = '#EC4899', // rose/pink
  secondaryColor = '#3B82F6', // blue
  size = 280,
  showLabels = true,
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.72;
  const numAxes = VECTOR_DIMENSION_KEYS.length;

  const primaryArr = musicVectorToArray(primaryVector);
  const secondaryArr = secondaryVector ? musicVectorToArray(secondaryVector) : null;

  // Compute (x, y) coordinate for axis i and normalized value val [0, 1]
  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = radius * Math.max(0.08, Math.min(1, val));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build polygon path string
  const buildPolygonPath = (values: number[]) => {
    return values
      .map((val, i) => {
        const { x, y } = getCoordinates(i, val);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  };

  // Concentric background grid rings (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center select-none" id="vector-radar-chart-container">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Concentric grid polygons */}
        {gridLevels.map((lvl) => {
          const ringPath = VECTOR_DIMENSION_KEYS.map((_, i) => {
            const { x, y } = getCoordinates(i, lvl);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          }).join(' ') + ' Z';

          return (
            <path
              key={`ring-${lvl}`}
              d={ringPath}
              fill="none"
              stroke="currentColor"
              className="text-neutral-800/80 stroke-1"
              strokeDasharray={lvl === 1.0 ? 'none' : '2,3'}
            />
          );
        })}

        {/* Axis lines */}
        {VECTOR_DIMENSION_KEYS.map((key, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${key}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-neutral-800 stroke-1"
            />
          );
        })}

        {/* Secondary Vector Polygon (if provided) */}
        {secondaryArr && (
          <path
            d={buildPolygonPath(secondaryArr)}
            fill={secondaryColor}
            fillOpacity={0.18}
            stroke={secondaryColor}
            strokeWidth={1.8}
            strokeDasharray="4,3"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Primary Vector Polygon */}
        <path
          d={buildPolygonPath(primaryArr)}
          fill={primaryColor}
          fillOpacity={0.25}
          stroke={primaryColor}
          strokeWidth={2.4}
          className="transition-all duration-500 ease-out"
        />

        {/* Primary Vector Vertices */}
        {primaryArr.map((val, i) => {
          const { x, y } = getCoordinates(i, val);
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={3.5}
              fill={primaryColor}
              className="transition-all duration-500 ease-out drop-shadow-sm"
            />
          );
        })}

        {/* Axis Labels */}
        {showLabels &&
          VECTOR_DIMENSION_KEYS.map((key, i) => {
            const meta = VECTOR_DIMENSIONS_META[key];
            const labelR = radius + 22;
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const lx = center + labelR * Math.cos(angle);
            const ly = center + labelR * Math.sin(angle);

            // Text alignment based on horizontal position
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.abs(Math.cos(angle)) > 0.3) {
              textAnchor = Math.cos(angle) > 0 ? 'start' : 'end';
            }

            return (
              <text
                key={`label-${key}`}
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill="currentColor"
                className="text-[10px] font-medium text-neutral-400 select-none"
              >
                {meta.label.split(' ')[0]}
              </text>
            );
          })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="font-medium text-neutral-300">{primaryLabel}</span>
        </div>
        {secondaryVector && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 inline-block border-b-2 border-dashed"
              style={{ borderColor: secondaryColor }}
            />
            <span className="font-medium text-neutral-300">{secondaryLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
