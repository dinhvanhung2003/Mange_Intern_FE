import { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadline: string; // ISO string hoặc date string
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ text: string; isLate: boolean }>({
    text: "...",
    isLate: false,
  });

  const calculateTimeLeft = (targetDate: string) => {
    const now = Date.now();
    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { text: "Trễ hạn", isLate: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      isLate: false,
    };
  };

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(deadline));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <span
      className={
        timeLeft.isLate ? "text-red-600 font-bold" : "text-green-600 font-semibold"
      }
    >
      {timeLeft.text}
    </span>
  );
}
