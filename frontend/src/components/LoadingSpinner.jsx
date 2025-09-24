export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-cream rounded-full animate-spin border-t-primary"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-primary/20"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="font-display text-lg font-semibold text-primary">
          Comparing rates across platforms...
        </p>
        <p className="text-sm text-muted-foreground">This may take a few seconds</p>
      </div>
    </div>
  );
}
