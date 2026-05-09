interface TimerRingProps {
  progress: number;
  isUrgent: boolean;
  remaining: number;
}

const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({ progress, isUrgent, remaining }: TimerRingProps) {
  return (
    <div className="code-timer">
      <div className="timer-ring">
        <svg viewBox="0 0 44 44">
          <circle className="timer-track" cx="22" cy="22" r={RADIUS} />
          <circle
            className={`timer-progress${isUrgent ? ' urgent' : ''}`}
            cx="22"
            cy="22"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
      </div>
      <span className="timer-text">{remaining}s</span>
    </div>
  );
}
