// hooks/useSwipeTracker.ts
import { useState, useEffect } from 'react';

interface PendingVote {
  targetId: string;
  action: 'fire' | 'pass';
}

export const useSwipeTracker = () => {
  const [swipeCount, setSwipeCount] = useState(0);
  const [pendingVotes, setPendingVotes] = useState<PendingVote[]>([]);
  const [showWall, setShowWall] = useState(false);
  const MAX_FREE_SWIPES = 10;

  useEffect(() => {
    const storedCount = localStorage.getItem('guestSwipeCount');
    const storedVotes = localStorage.getItem('guestPendingVotes');
    if (storedCount) setSwipeCount(parseInt(storedCount, 10));
    if (storedVotes) setPendingVotes(JSON.parse(storedVotes));
  }, []);

  const recordSwipe = (targetId: string, action: 'fire' | 'pass') => {
    if (swipeCount >= MAX_FREE_SWIPES) {
      setShowWall(true);
      return false; 
    }

    const newCount = swipeCount + 1;
    const newVotes = [...pendingVotes, { targetId, action }];

    setSwipeCount(newCount);
    setPendingVotes(newVotes);
    localStorage.setItem('guestSwipeCount', newCount.toString());
    localStorage.setItem('guestPendingVotes', JSON.stringify(newVotes));

    if (newCount >= MAX_FREE_SWIPES) {
      setTimeout(() => setShowWall(true), 400); 
    }
    return true; 
  };

  const remainingSwipes = MAX_FREE_SWIPES - swipeCount;

  return { swipeCount, remainingSwipes, pendingVotes, showWall, recordSwipe };
};