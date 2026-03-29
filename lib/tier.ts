export function getTierImage(rank: number | null | undefined): string | null {
  if (rank === null || rank === undefined || rank <= 0) return null;
  if (rank === 1) return '/tier/champion1_clean.png';
  if (rank === 2) return '/tier/champion2_clean.png';
  if (rank === 3) return '/tier/champion3_clean.png';
  if (rank <= 10) return '/tier/Challenger1.webp';
  if (rank <= 30) return '/tier/Challenger2.webp';
  if (rank <= 50) return '/tier/Challenger3.webp';
  if (rank <= 70) return '/tier/Challenger4.webp';
  if (rank <= 100) return '/tier/Challenger5.webp';
  if (rank <= 150) return '/tier/grandMaster1.webp';
  if (rank <= 200) return '/tier/grandMaster2.webp';
  if (rank <= 250) return '/tier/grandMaster3.webp';
  if (rank <= 350) return '/tier/grandMaster4.webp';
  return '/tier/grandMaster5.webp';
}

export function isNearTierBoundary(rank: number | null | undefined): boolean {
  if (rank === null || rank === undefined || rank <= 0) return false;
  
  // 경계 10, 30: +- 1
  if ([10, 30].some(b => Math.abs(rank - b) <= 1)) return true;
  
  // 경계 50, 70: +- 2
  if ([50, 70].some(b => Math.abs(rank - b) <= 2)) return true;
  
  // 경계 100, 150, 200, 250, 350: +- 5
  if ([100, 150, 200, 250, 350].some(b => Math.abs(rank - b) <= 5)) return true;
  
  return false;
}
