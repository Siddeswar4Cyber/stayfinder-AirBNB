export function handleImageFallback(event: { currentTarget: HTMLImageElement }, key: string) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = `https://picsum.photos/seed/stayfinder-${encodeURIComponent(key)}/1200/800`;
}
