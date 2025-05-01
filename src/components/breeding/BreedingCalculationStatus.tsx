
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface BreedingCalculationStatusProps {
  isCalculating: boolean;
  pathsFound: number;
  onViewResults: () => void;
}

export function BreedingCalculationStatus({ 
  isCalculating, 
  pathsFound,
  onViewResults
}: BreedingCalculationStatusProps) {
  if (isCalculating) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="animate-spin mx-auto w-12 h-12 border-4 border-palaccent border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Calculating optimal breeding routes...</p>
        </div>
      </div>
    );
  }

  if (pathsFound > 0) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Calculation Complete!</h3>
        <p className="text-muted-foreground mb-6">
          {pathsFound} possible breeding routes found
        </p>
        <Button 
          className="bg-palaccent hover:bg-palaccent-light"
          onClick={onViewResults}
        >
          View Results <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Ready to calculate breeding routes</p>
    </div>
  );
}
