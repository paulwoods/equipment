import React from 'react';
import {Search, X} from 'lucide-react';
import {Input} from './ui/input';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const SearchInput = ({
                                value,
                                onChange,
                                placeholder = 'Search...',
                                className = ''
                            }: SearchInputProps): React.JSX.Element => {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input
                type="text"
                placeholder={placeholder}
                className="pl-10 pr-10"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    onClick={() => onChange('')}
                >
                    <X className="h-4 w-4 text-muted-foreground"/>
                </button>
            )}
        </div>
    );
};
