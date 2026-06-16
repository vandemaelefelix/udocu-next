export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center"
    >
      <span className="sr-only">Loading</span>
      <span
        aria-hidden="true"
        className="block h-10 w-10 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40"
      />
    </div>
  );
}
