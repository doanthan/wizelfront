import React from 'react';

const DividerBlock = ({ block }) => {
  const {
    dividerStyle = 'two-tone',
    dividerColor = '#E5E7EB',
    dividerColorTop = '#6366F1',
    dividerColorBottom = '#FFFFFF',
    dividerHeight = 100,
    dividerWidth = 100,
    padding = 0
  } = block;

  const generateSVG = () => {
    const width = 600; // Max email width
    const actualWidth = (width * dividerWidth) / 100;
    const height = dividerHeight;

    switch (dividerStyle) {
      case 'two-tone':
        // Simple straight split divider
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <rect x="0" y="0" width={actualWidth} height={height / 2} fill={dividerColorTop} />
            <rect x="0" y={height / 2} width={actualWidth} height={height / 2} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-wave':
        // Wave divider with two colors
        const waveHeight = height / 6;
        const midPoint = height / 2;
        const amplitude = waveHeight;
        const frequency = 4;

        // Generate wave path
        const topWavePath = [];
        const bottomWavePath = [];
        const steps = 100;

        for (let i = 0; i <= steps; i++) {
          const x = (actualWidth / steps) * i;
          const wave = Math.sin((i / steps) * Math.PI * 2 * frequency) * amplitude;
          const y = midPoint + wave;

          if (i === 0) {
            topWavePath.push(`M0,0 L0,${y}`);
            bottomWavePath.push(`M0,${y}`);
          } else {
            topWavePath.push(`L${x},${y}`);
            bottomWavePath.push(`L${x},${y}`);
          }
        }

        topWavePath.push(`L${actualWidth},0 Z`);
        bottomWavePath.push(`L${actualWidth},${height} L0,${height} Z`);

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d={topWavePath.join(' ')} fill={dividerColorTop} />
            <path d={bottomWavePath.join(' ')} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-light-wave':
        // Light wave divider with gentle curves
        const lightWaveAmplitude = height * 0.08; // Gentler wave (8% of height)
        const lightWaveFreq = 2; // Fewer waves for a softer look
        const lightMidPoint = height / 2;

        // Generate gentle wave path
        const lightTopWavePath = [];
        const lightBottomWavePath = [];
        const lightSteps = 100;

        for (let i = 0; i <= lightSteps; i++) {
          const x = (actualWidth / lightSteps) * i;
          const wave = Math.sin((i / lightSteps) * Math.PI * 2 * lightWaveFreq) * lightWaveAmplitude;
          const y = lightMidPoint + wave;

          if (i === 0) {
            lightTopWavePath.push(`M0,0 L0,${y}`);
            lightBottomWavePath.push(`M0,${y}`);
          } else {
            lightTopWavePath.push(`L${x},${y}`);
            lightBottomWavePath.push(`L${x},${y}`);
          }
        }

        lightTopWavePath.push(`L${actualWidth},0 Z`);
        lightBottomWavePath.push(`L${actualWidth},${height} L0,${height} Z`);

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d={lightTopWavePath.join(' ')} fill={dividerColorTop} />
            <path d={lightBottomWavePath.join(' ')} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-curve':
        // Smooth curve divider
        const curveDepth = height * 0.3;
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path
              d={`M0,0 L0,${height/2 - curveDepth} Q${actualWidth/2},${height/2 + curveDepth} ${actualWidth},${height/2 - curveDepth} L${actualWidth},0 Z`}
              fill={dividerColorTop}
            />
            <path
              d={`M0,${height/2 - curveDepth} Q${actualWidth/2},${height/2 + curveDepth} ${actualWidth},${height/2 - curveDepth} L${actualWidth},${height} L0,${height} Z`}
              fill={dividerColorBottom}
            />
          </svg>
        );

      case 'two-tone-slant':
        // Diagonal slant divider
        const slantOffset = height * 0.15;
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <polygon
              points={`0,0 ${actualWidth},0 ${actualWidth},${height/2 + slantOffset} 0,${height/2 - slantOffset}`}
              fill={dividerColorTop}
            />
            <polygon
              points={`0,${height/2 - slantOffset} ${actualWidth},${height/2 + slantOffset} ${actualWidth},${height} 0,${height}`}
              fill={dividerColorBottom}
            />
          </svg>
        );

      case 'two-tone-zigzag':
        // Zigzag divider with two colors
        const zigzagSegments = 20;
        const zigzagSegmentWidth = actualWidth / zigzagSegments;
        const zigzagAmplitude = height * 0.15;
        const midY = height / 2;

        // Generate zigzag path points
        const topZigzagPath = [`M0,0`];
        const bottomZigzagPath = [];

        for (let i = 0; i <= zigzagSegments; i++) {
          const x = i * zigzagSegmentWidth;
          const y = midY + (i % 2 === 0 ? -zigzagAmplitude : zigzagAmplitude);

          if (i === 0) {
            topZigzagPath.push(`L0,${y}`);
            bottomZigzagPath.push(`M0,${y}`);
          } else {
            topZigzagPath.push(`L${x},${y}`);
            bottomZigzagPath.push(`L${x},${y}`);
          }
        }

        topZigzagPath.push(`L${actualWidth},0 Z`);
        bottomZigzagPath.push(`L${actualWidth},${height} L0,${height} Z`);

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d={topZigzagPath.join(' ')} fill={dividerColorTop} />
            <path d={bottomZigzagPath.join(' ')} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-light-zigzag':
        // Light zigzag divider with gentler angles
        const lightZigzagSegments = 30; // More segments = smaller, gentler zigzags
        const lightZigzagSegmentWidth = actualWidth / lightZigzagSegments;
        const lightZigzagAmplitude = height * 0.06; // Much gentler amplitude (6% vs 15%)
        const lightMidY = height / 2;

        // Generate gentle zigzag path points
        const lightTopZigzagPath = [`M0,0`];
        const lightBottomZigzagPath = [];

        for (let i = 0; i <= lightZigzagSegments; i++) {
          const x = i * lightZigzagSegmentWidth;
          const y = lightMidY + (i % 2 === 0 ? -lightZigzagAmplitude : lightZigzagAmplitude);

          if (i === 0) {
            lightTopZigzagPath.push(`L0,${y}`);
            lightBottomZigzagPath.push(`M0,${y}`);
          } else {
            lightTopZigzagPath.push(`L${x},${y}`);
            lightBottomZigzagPath.push(`L${x},${y}`);
          }
        }

        lightTopZigzagPath.push(`L${actualWidth},0 Z`);
        lightBottomZigzagPath.push(`L${actualWidth},${height} L0,${height} Z`);

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d={lightTopZigzagPath.join(' ')} fill={dividerColorTop} />
            <path d={lightBottomZigzagPath.join(' ')} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-paint':
        // Paint stroke effect with rough top edge (like torn paper)
        const brushSteps = 300;
        const brushTransition = height * 0.35; // Position of the rough edge
        const brushTopPath = [];
        const brushBottomPath = [];

        // Generate rough edge (left to right)
        for (let i = 0; i <= brushSteps; i++) {
          const x = (actualWidth / brushSteps) * i;
          // Multiple sine/cosine waves create organic, irregular edge
          const roughness =
            Math.sin(i * 0.3) * (height * 0.15) +
            Math.sin(i * 0.9) * (height * 0.08) +
            Math.cos(i * 2.1) * (height * 0.05) +
            Math.sin(i * 4.2) * (height * 0.03) +
            Math.cos(i * 7.8) * (height * 0.02) +
            Math.sin(i * 12.5) * (height * 0.01);
          const y = brushTransition + roughness;

          if (i === 0) {
            // Top section path (dark area above rough edge)
            brushTopPath.push(`M0,0 L0,${y}`);
            // Bottom section path (light area below rough edge)
            brushBottomPath.push(`M0,${y}`);
          } else {
            brushTopPath.push(`L${x},${y}`);
            brushBottomPath.push(`L${x},${y}`);
          }
        }

        // Complete top path (close at top)
        brushTopPath.push(`L${actualWidth},0 Z`);

        // Complete bottom path (close at bottom)
        brushBottomPath.push(`L${actualWidth},${height} L0,${height} Z`);

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d={brushTopPath.join(' ')} fill={dividerColorTop} />
            <path d={brushBottomPath.join(' ')} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-drip':
        // Drip/paint drip divider
        const dripMidY = height / 2;
        const numDrips = 8;
        const dripWidth = actualWidth / numDrips;
        const dripTopPath = [`M0,0`];
        const dripBottomPath = [];

        for (let i = 0; i <= numDrips; i++) {
          const x = i * dripWidth;

          if (i === 0) {
            dripTopPath.push(`L0,${dripMidY}`);
            dripBottomPath.push(`M0,${dripMidY}`);
          } else {
            // Create drip peaks that alternate
            const dripDepth = (i % 2 === 0) ? height * 0.15 : height * 0.08;
            const peakX = x - dripWidth / 2;
            const y = dripMidY + dripDepth;

            // Curve down into drip
            dripTopPath.push(`Q${peakX},${y} ${x},${dripMidY}`);
            dripBottomPath.push(`Q${peakX},${y} ${x},${dripMidY}`);
          }
        }

        dripTopPath.push(`L${actualWidth},0 Z`);
        dripBottomPath.push(`L${actualWidth},${height} L0,${height} Z`);

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d={dripTopPath.join(' ')} fill={dividerColorTop} />
            <path d={dripBottomPath.join(' ')} fill={dividerColorBottom} />
          </svg>
        );

      case 'two-tone-clouds':
        // Cloud-like divider (upside down from typical cloud shape)
        const cloudTransitionY = height * 0.5; // Center position for better balance

        // Scale the SVG path to fit actualWidth
        const scaleX = actualWidth / 1200;
        const scaleY = height / 120;

        // Cloud path points (upside down version) - scaled proportionally
        const cloudPath = `M0,${cloudTransitionY} ` +
          `C${60 * scaleX},${cloudTransitionY - (10 * scaleY)} ${120 * scaleX},${cloudTransitionY + (10 * scaleY)} ${170 * scaleX},${cloudTransitionY + (2 * scaleY)} ` +
          `C${220 * scaleX},${cloudTransitionY - (6 * scaleY)} ${270 * scaleX},${cloudTransitionY - (30 * scaleY)} ${340 * scaleX},${cloudTransitionY - (22 * scaleY)} ` +
          `C${410 * scaleX},${cloudTransitionY - (14 * scaleY)} ${470 * scaleX},${cloudTransitionY + (20 * scaleY)} ${540 * scaleX},${cloudTransitionY + (8 * scaleY)} ` +
          `C${610 * scaleX},${cloudTransitionY - (4 * scaleY)} ${660 * scaleX},${cloudTransitionY - (38 * scaleY)} ${740 * scaleX},${cloudTransitionY - (30 * scaleY)} ` +
          `C${820 * scaleX},${cloudTransitionY - (22 * scaleY)} ${880 * scaleX},${cloudTransitionY + (14 * scaleY)} ${960 * scaleX},${cloudTransitionY + (8 * scaleY)} ` +
          `C${1040 * scaleX},${cloudTransitionY + (2 * scaleY)} ${1100 * scaleX},${cloudTransitionY - (22 * scaleY)} ${1200 * scaleX},${cloudTransitionY - (14 * scaleY)} ` +
          `L${actualWidth},${height} L0,${height} Z`;

        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <rect width={actualWidth} height={height} fill={dividerColorTop} />
            <path d={cloudPath} fill={dividerColorBottom} />
          </svg>
        );

      case 'wave':
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path
              d={`M0,${height / 2} Q${actualWidth / 4},${height * 0.2} ${actualWidth / 2},${height / 2} T${actualWidth},${height / 2}`}
              fill="none"
              stroke={dividerColor}
              strokeWidth="2"
            />
          </svg>
        );

      case 'zigzag':
        const zigzagPoints = [];
        const segments = 10;
        const segmentWidth = actualWidth / segments;
        for (let i = 0; i <= segments; i++) {
          const x = i * segmentWidth;
          const y = i % 2 === 0 ? height * 0.3 : height * 0.7;
          zigzagPoints.push(`${x},${y}`);
        }
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <polyline
              points={zigzagPoints.join(' ')}
              fill="none"
              stroke={dividerColor}
              strokeWidth="2"
            />
          </svg>
        );

      case 'dots':
        const dots = [];
        const dotCount = 20;
        const dotSpacing = actualWidth / (dotCount - 1);
        for (let i = 0; i < dotCount; i++) {
          const cx = i * dotSpacing;
          dots.push(<circle key={i} cx={cx} cy={height / 2} r="2" fill={dividerColor} />);
        }
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            {dots}
          </svg>
        );

      case 'dashed':
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line
              x1="0"
              y1={height / 2}
              x2={actualWidth}
              y2={height / 2}
              stroke={dividerColor}
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          </svg>
        );

      case 'double':
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line x1="0" y1={height * 0.4} x2={actualWidth} y2={height * 0.4} stroke={dividerColor} strokeWidth="2" />
            <line x1="0" y1={height * 0.6} x2={actualWidth} y2={height * 0.6} stroke={dividerColor} strokeWidth="2" />
          </svg>
        );

      case 'line':
      default:
        return (
          <svg width={actualWidth} height={height} viewBox={`0 0 ${actualWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line
              x1="0"
              y1={height / 2}
              x2={actualWidth}
              y2={height / 2}
              stroke={dividerColor}
              strokeWidth="2"
            />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        padding: `${padding}px`,
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        lineHeight: 0,
        fontSize: 0
      }}
    >
      {generateSVG()}
    </div>
  );
};

export default DividerBlock;
