export default function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block ${className}`}
      role="status"
      aria-label="loading"
    >
      <svg
        className="animate-spin h-5 w-5 text-green-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
        />
      </svg>
    </div>
  );
}
