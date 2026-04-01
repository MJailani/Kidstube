export default function Spinner({ size = 32 }) {
  return (
    <div
      style={{ width: size, height: size, border: '3px solid #333', borderTopColor: '#ef4444', borderRadius: '50%' }}
      className="animate-spin"
    />
  );
}
