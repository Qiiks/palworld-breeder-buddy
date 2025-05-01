
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, User } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full py-4 px-6 mb-8 backdrop-blur-md bg-palblue bg-opacity-20 border-b border-palblue sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-palaccent to-palaccent-light p-0.5 animate-pulse-light">
            <div className="w-full h-full rounded-full bg-palblue flex items-center justify-center">
              <Plus className="h-5 w-5 text-palaccent" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              Palworld Breeder Buddy
            </h1>
            <p className="text-xs text-muted-foreground">
              Optimize your breeding strategy
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" className="text-gray-300 hover:text-white">
            Dashboard
          </Button>
          <Button variant="ghost" className="text-gray-300 hover:text-white">
            Breeding Guide
          </Button>
          <Button variant="ghost" className="text-gray-300 hover:text-white">
            About
          </Button>
          <Button variant="outline" className="bg-palblue border-palaccent text-white hover:bg-palblue-light">
            <User className="mr-2 h-4 w-4" /> 
            Guild Data
          </Button>
          <Button className="bg-palaccent hover:bg-palaccent-light text-white">
            Upload Save <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 bg-palblue bg-opacity-90 backdrop-blur-md border-b border-palblue shadow-lg z-40 py-4 px-6">
          <div className="flex flex-col space-y-3">
            <Button variant="ghost" className="text-left justify-start text-gray-300 hover:text-white">
              Dashboard
            </Button>
            <Button variant="ghost" className="text-left justify-start text-gray-300 hover:text-white">
              Breeding Guide
            </Button>
            <Button variant="ghost" className="text-left justify-start text-gray-300 hover:text-white">
              About
            </Button>
            <Button variant="outline" className="text-left justify-start bg-palblue border-palaccent text-white hover:bg-palblue-light">
              <User className="mr-2 h-4 w-4" /> 
              Guild Data
            </Button>
            <Button className="bg-palaccent hover:bg-palaccent-light text-white justify-start">
              Upload Save <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
