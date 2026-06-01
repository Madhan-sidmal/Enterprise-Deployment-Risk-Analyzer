import React from 'react';
import '../styles/risk.css';

/**
 * Animated SVG donut gauge for risk score display.
 * Props: score (0-100), riskLevel ('LOW'|'MEDIUM'|'HIGH'), size (px, default 160)
 */
const RiskScoreWidget = ({ score = 0, riskLevel = 'LOW', size = 160, showLabel = true }) => {
  const color = riskLevel === 'HIGH' ? '#ef4444' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981';
  const label = riskLevel === 'HIGH' ? 'High Risk' : riskLevel === 'MEDIUM' ? 'Medium Risk' : 'Low Risk';

  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ≈ 376.99
  const percent = Math.min(score, 100) / 100;
  const dashOffset = circumference * (1 - percent);

  const bgColor = riskLevel === 'HIGH'
    ? 'rgba(239,68,68,0.08)'
    : riskLevel === 'MEDIUM'
    ? 'rgba(245,158,11,0.08)'
    : 'rgba(16,185,129,0.08)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{
        position: 'relative',
        width: size, height: size,
        borderRadius: '50%',
        background: bgColor,
        ...(riskLevel === 'HIGH' && score > 70 ? { animation: 'riskPulse 2s ease-in-out infinite' } : {})
      }}>
        <svg width={size} height={size} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Glow effect */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeOpacity="0.15"
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}80)`
            }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            fontSize: size > 100 ? '2.2rem' : '1.5rem',
            fontWeight: 900,
            color,
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            {score}
          </div>
          <div style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginTop: 2
          }}>
            /100
          </div>
        </div>
      </div>

      {showLabel && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0.3rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          background: `${color}18`,
          border: `1px solid ${color}40`,
          fontSize: '0.78rem', fontWeight: 700, color
        }}>
          <span>{riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟡' : '🟢'}</span>
          {label}
        </div>
      )}
    </div>
  );
};

export default RiskScoreWidget;
