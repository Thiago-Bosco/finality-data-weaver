
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  name: string;
  label: string;
  options: FilterOption[];
}

export interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, string>) => void;
  filterFields?: FilterField[];
  searchPlaceholder?: string;
  className?: string;
}

export default function SearchAndFilter({
  onSearch,
  onFilter,
  filterFields = [],
  searchPlaceholder = "Pesquisar...",
  className
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({});

  // Efeito para aplicar filtros quando alterados
  useEffect(() => {
    const debouncedFilter = setTimeout(() => {
      onFilter(filters);
    }, 300);

    return () => clearTimeout(debouncedFilter);
  }, [filters, onFilter]);

  // Efeito para pesquisa com debounce
  useEffect(() => {
    const debouncedSearch = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debouncedSearch);
  }, [searchQuery, onSearch]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Fecha o popover depois da seleção
    setOpenPopover(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const clearFilters = () => {
    setFilters({});
    onFilter({});
  };

  const togglePopover = (field: string) => {
    setOpenPopover(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => filters[key] !== "").length;
  };

  return (
    <div className={cn("flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", className)}>
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      {filterFields && filterFields.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {filterFields.map((field) => (
            <Popover 
              key={field.name} 
              open={openPopover[field.name]} 
              onOpenChange={(open) => setOpenPopover(prev => ({ ...prev, [field.name]: open }))}
            >
              <PopoverTrigger asChild>
                <Button 
                  variant={filters[field.name] ? "default" : "outline"} 
                  size="sm" 
                  className="h-10"
                  onClick={() => togglePopover(field.name)}
                >
                  {field.label}
                  {filters[field.name] && (
                    <Badge className="ml-2 bg-primary/20" variant="secondary">
                      {field.options && field.options.find(opt => opt.value === filters[field.name])?.label || filters[field.name]}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[200px]" align="start">
                <Command>
                  <CommandInput placeholder={`Buscar ${field.label.toLowerCase()}...`} />
                  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => handleFilterChange(field.name, "")}
                      className="justify-between"
                    >
                      <span>Todos</span>
                      {filters[field.name] === "" && <span>✓</span>}
                    </CommandItem>
                    {field.options && field.options.map((option) => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => handleFilterChange(field.name, option.value)}
                        className="justify-between"
                      >
                        <span>{option.label}</span>
                        {filters[field.name] === option.value && <span>✓</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          ))}
          
          {getActiveFiltersCount() > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10" 
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
