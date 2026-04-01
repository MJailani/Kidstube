import Spinner from './Spinner';

export default function LoadingGrid({ label = 'Loading videos…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner size={36} />
      <p className="text-[#aaa] text-sm">{label}</p>
    </div>
  );
}
