import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search } from 'lucide-react';

interface ProjectFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    onReset: () => void;
}

export interface FilterState {
    search?: string;
    city?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyTypes?: string[];
    projectType?: string;
    status?: string;
    verified?: boolean;
    ordering?: string;
}

const CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

const STATES = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'
];

const PROPERTY_TYPES = [
    { value: '1bhk', label: '1 BHK' },
    { value: '2bhk', label: '2 BHK' },
    { value: '3bhk', label: '3 BHK' },
    { value: '4bhk', label: '4 BHK' },
    { value: 'studio', label: 'Studio' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'villa', label: 'Villa' },
    { value: 'plot', label: 'Plot' },
];

const PROJECT_TYPES = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'mixed', label: 'Mixed Use' },
];

const PROJECT_STATUS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
    { value: '-created_at', label: 'Newest First' },
    { value: 'created_at', label: 'Oldest First' },
    { value: 'starting_price', label: 'Price: Low to High' },
    { value: '-starting_price', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: '-verification_score', label: 'Highest Rated' },
];

export default function ProjectFilters({ onFilterChange, onReset }: ProjectFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({});
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterUpdate = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handlePriceChange = (value: [number, number]) => {
        setPriceRange(value);
        const newFilters = { ...filters, minPrice: value[0], maxPrice: value[1] };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handlePropertyTypeToggle = (type: string) => {
        const newTypes = selectedPropertyTypes.includes(type)
            ? selectedPropertyTypes.filter(t => t !== type)
            : [...selectedPropertyTypes, type];

        setSelectedPropertyTypes(newTypes);
        const newFilters = { ...filters, propertyTypes: newTypes.length > 0 ? newTypes : undefined };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        setFilters({});
        setPriceRange([0, 50000000]);
        setSelectedPropertyTypes([]);
        onReset();
    };

    const activeFilterCount = Object.keys(filters).filter(key => {
        const value = filters[key as keyof FilterState];
        return value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    return (
        <div className="space-y-4">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Filters Card */}
            <Card className={`${showFilters || 'hidden lg:block'}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary">{activeFilterCount}</Badge>
                            )}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            <X className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search projects..."
                                className="pl-9"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterUpdate('search', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <Label>Location</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Select
                                    value={filters.city || ''}
                                    onValueChange={(value) => handleFilterUpdate('city', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Cities</SelectItem>
                                        {CITIES.map(city => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    value={filters.state || ''}
                                    onValueChange={(value) => handleFilterUpdate('state', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="State" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All States</SelectItem>
                                        {STATES.map(state => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                        <Label>Price Range</Label>
                        <div className="space-y-2">
                            <Slider
                                value={priceRange}
                                onValueChange={handlePriceChange}
                                min={0}
                                max={50000000}
                                step={500000}
                                className="w-full"
                            />
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>₹{(priceRange[0] / 100000).toFixed(1)}L</span>
                                <span>₹{(priceRange[1] / 10000000).toFixed(1)}Cr</span>
                            </div>
                        </div>
                    </div>

                    {/* Property Types */}
                    <div className="space-y-3">
                        <Label>Property Types</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {PROPERTY_TYPES.map(type => (
                                <div key={type.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={type.value}
                                        checked={selectedPropertyTypes.includes(type.value)}
                                        onCheckedChange={() => handlePropertyTypeToggle(type.value)}
                                    />
                                    <label
                                        htmlFor={type.value}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {type.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project Type */}
                    <div className="space-y-2">
                        <Label>Project Type</Label>
                        <Select
                            value={filters.projectType || ''}
                            onValueChange={(value) => handleFilterUpdate('projectType', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Types</SelectItem>
                                {PROJECT_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Project Status */}
                    <div className="space-y-2">
                        <Label>Project Status</Label>
                        <Select
                            value={filters.status || ''}
                            onValueChange={(value) => handleFilterUpdate('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                {PROJECT_STATUS.map(status => (
                                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Verified Only */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="verified"
                            checked={filters.verified || false}
                            onCheckedChange={(checked) => handleFilterUpdate('verified', checked)}
                        />
                        <label
                            htmlFor="verified"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Show verified projects only
                        </label>
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select
                            value={filters.ordering || ''}
                            onValueChange={(value) => handleFilterUpdate('ordering', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
