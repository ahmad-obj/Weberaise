export function shouldDrawWorkFrame({
  transformChanged,
  mediaChanged,
  force,
}: {
  transformChanged: boolean;
  mediaChanged: boolean;
  force: boolean;
}) {
  return force || transformChanged || mediaChanged;
}
