
import { Settings, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-center relative">
        <img src="/lovable-uploads/68782036-637d-4eae-9d56-aeb41156f0bd.png" alt="RVJ Logo" className="h-14 w-auto" />
        <div className="flex items-center gap-4 absolute right-4">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <UserCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
