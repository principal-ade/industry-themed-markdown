import { Theme, theme as defaultTheme } from '@principal-ade/industry-theme';
import React, { useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

import { IndustryMermaidDiagram } from './IndustryMermaidDiagram';

type AnimationType =
  | 'linear'
  | 'easeOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInQuint'
  | 'easeOutQuint'
  | 'easeInOutQuint';

interface IndustryZoomableMermaidDiagramProps {
  code: string;
  id: string;
  theme?: Theme;
  fitStrategy?: 'contain' | 'width' | 'height';
  padding?: number;
}

export function IndustryZoomableMermaidDiagram({
  code,
  id,
  theme: themeOverride,
  fitStrategy = 'contain',
  padding = 0.9, // Use 90% of available space to leave some breathing room
}: IndustryZoomableMermaidDiagramProps) {
  // Get theme from context or use override
  const theme = themeOverride ?? defaultTheme;

  const [calculatedScale, setCalculatedScale] = useState(1); // Start at 1, will be recalculated
  const [hasInitialized, setHasInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const transformRef = useRef<{
    centerView: (scale?: number, animationTime?: number, animationType?: AnimationType) => void;
    instance: { transformState: { scale: number } };
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !diagramRef.current) return;

    // Function to calculate optimal scale
    const calculateOptimalScale = () => {
      const container = containerRef.current;
      const diagram = diagramRef.current;

      if (!container || !diagram) return;

      // Find the SVG element that mermaid creates
      const svg = diagram.querySelector('svg');
      if (!svg) {
        // If no SVG yet, try again shortly
        setTimeout(calculateOptimalScale, 100);
        return;
      }

      // Get the SVG's intrinsic size
      let svgWidth: number, svgHeight: number;

      // First try viewBox for accurate intrinsic dimensions
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        const [, , width, height] = viewBox.split(' ').map(Number);
        svgWidth = width;
        svgHeight = height;
      } else {
        // Then try explicit dimensions
        const explicitWidth = svg.getAttribute('width');
        const explicitHeight = svg.getAttribute('height');

        if (explicitWidth && explicitHeight) {
          svgWidth = parseFloat(explicitWidth);
          svgHeight = parseFloat(explicitHeight);
        } else {
          // Fallback to actual rendered size
          const svgRect = svg.getBoundingClientRect();
          svgWidth = svgRect.width;
          svgHeight = svgRect.height;
        }
      }

      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (svgWidth <= 0 || svgHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
        return; // Invalid dimensions, skip
      }

      // Calculate optimal scale based on fit strategy
      let scale = 1;
      switch (fitStrategy) {
        case 'width':
          scale = (containerWidth * padding) / svgWidth;
          break;
        case 'height':
          scale = (containerHeight * padding) / svgHeight;
          break;
        case 'contain':
        default:
          // Fit entire diagram in view
          scale = Math.min(
            (containerWidth * padding) / svgWidth,
            (containerHeight * padding) / svgHeight,
          );
          break;
      }

      // Cap the scale to reasonable bounds
      scale = Math.min(Math.max(scale, 0.3), 3); // Between 30% and 300%

      setCalculatedScale(scale);
      setHasInitialized(true);
      setIsCalculating(false);
    };

    // Set up ResizeObserver to recalculate when container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateOptimalScale();
    });

    resizeObserver.observe(containerRef.current);

    // Initial calculation after a short delay to ensure mermaid has rendered
    setTimeout(calculateOptimalScale, 100);
    // Recalculate again after a longer delay to be sure
    setTimeout(calculateOptimalScale, 500);

    return () => {
      resizeObserver.disconnect();
    };
  }, [code, fitStrategy, padding]); // Recalculate when these change

  // Apply the calculated scale once it's ready
  useEffect(() => {
    if (hasInitialized && transformRef.current) {
      const { centerView } = transformRef.current;
      // Apply the calculated scale
      centerView(calculatedScale, 0, 'easeOut');
    }
  }, [hasInitialized, calculatedScale]);
  const buttonStyle: React.CSSProperties = {
    padding: `${theme.space[1]}px ${theme.space[2]}px`,
    marginRight: theme.space[2],
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii[1],
    fontSize: theme.fontSizes[2],
    fontWeight: theme.fontWeights.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: theme.fonts.body,
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = theme.colors.background;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: theme.colors.background,
      }}
    >
      <TransformWrapper
        limitToBounds={true}
        doubleClick={{ disabled: true }}
        minScale={0.1}
        maxScale={10}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        centerOnInit={true}
        centerZoomedOut={true}
        alignmentAnimation={{ disabled: true }}
        zoomAnimation={{ disabled: false, size: 0.2 }}
      >
        {({ centerView, instance }) => {
          // Store the transform instance for use in useEffect
          transformRef.current = { centerView, instance };
          return (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: theme.space[3],
                  right: theme.space[3],
                  zIndex: 10,
                  display: 'flex',
                  gap: theme.space[2],
                }}
              >
                <button
                  onClick={() => {
                    // Reset to initial calculated scale and center
                    centerView(calculatedScale, 200, 'easeOut');
                  }}
                  style={buttonStyle}
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                  title="Reset view"
                >
                  ⟲
                </button>
                {isCalculating && (
                  <span
                    style={{
                      padding: `${theme.space[1]}px ${theme.space[2]}px`,
                      fontSize: theme.fontSizes[1],
                      color: theme.colors.textMuted,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    Optimizing view...
                  </span>
                )}
              </div>
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: theme.colors.background,
                  overflow: 'hidden', // Contain the content
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  ref={diagramRef}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <IndustryMermaidDiagram code={code} id={id} isModalMode={true} theme={theme} />
                </div>
              </TransformComponent>
            </>
          );
        }}
      </TransformWrapper>
    </div>
  );
}
