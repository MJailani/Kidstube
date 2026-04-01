export default function ChAvatar({ ch, size = 9 }) {
  if (!ch) return null;
  if (ch.thumb) {
    return (
      <img
        src={ch.thumb} alt={ch.name}
        className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}
        onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold`}
      style={{ background: ch.color, fontSize: size * 2 }}
    >
      {ch.name[0]}
    </div>
  );
}
