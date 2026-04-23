import React from 'react';
import {Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Button} from './ui/button';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from './ui/tooltip';

export const ThemeToggle = (): React.JSX.Element => {
  const {resolvedTheme, setTheme} = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme"><div className="w-5 h-5"/></Button>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark'
              ? <Sun className="w-5 h-5 text-yellow-400"/>
              : <Moon className="w-5 h-5"/>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
