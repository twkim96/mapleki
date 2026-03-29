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
