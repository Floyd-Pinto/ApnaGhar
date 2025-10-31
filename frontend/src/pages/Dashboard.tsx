import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PropertyCard from '@/components/PropertyCard';
import TimelineItem from '@/components/TimelineItem';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  Eye, 
  Plus, 
  BarChart3, 
  Wallet, 
  Building2,
  Users,
  Calendar,
  Bell,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Menu,
  MapPin,
  Mic,
  User
} from 'lucide-react';
import propertyExample1 from '@/assets/property-example-1.jpg';
import propertyExample2 from '@/assets/property-example-2.jpg';
import constructionUpdate1 from '@/assets/construction-update-1.jpg';

const Dashboard = () => {
  const { user } = useAuth();
  const userType = user?.role || 'buyer';

  // Mock data for investor dashboard
  const investments = [
    {
      id: '1',
      title: 'Skyline Residences',
      location: 'Bandra West, Mumbai',
      price: '₹2.5 Cr',
      pricePerShare: '₹25,000',
      image: propertyExample1,
      verified: true,
      lastUpdated: '2 hours ago',
      roi: '12',
      completionStatus: '65'
    }
  ];

  const watchlist = [
    {
      id: '2',
      title: 'Green Valley Towers',
      location: 'Powai, Mumbai',
      price: '₹1.8 Cr',
      pricePerShare: '₹18,000',
      image: propertyExample2,
      verified: true,
      lastUpdated: '5 hours ago',
      roi: '15',
      completionStatus: '45'
    }
  ];

  const recentUpdates = [
    {
      id: '1',
      title: 'Foundation Work Completed',
      description: 'All foundation work has been completed as per schedule. Structural reinforcement verified.',
      timestamp: 'Sep 25, 2024, 2:30 PM',
      image: constructionUpdate1,
      geotag: 'Lat: 19.0596, Long: 72.8295',
      flatNumber: 'Tower A - All Floors',
      verified: true
    }
  ];

  // Mock data for builder dashboard
  const builderProjects = [
    {
      id: '1',
      title: 'Skyline Residences',
      location: 'Bandra West, Mumbai',
      price: '₹2.5 Cr',
      image: propertyExample1,
      verified: true,
      lastUpdated: '2 hours ago',
      completionStatus: '65'
    },
    {
      id: '2',
      title: 'Green Valley Towers',
      location: 'Powai, Mumbai',
      price: '₹1.8 Cr',
      image: propertyExample2,
      verified: true,
      lastUpdated: '5 hours ago',
      completionStatus: '45'
    }
  ];

  const InvestorDashboard = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investment
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹5.2L</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 under construction
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portfolio ROI
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+14.2%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Above market average
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Watchlist
            </CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{watchlist.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Properties tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Investments */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Investments</h2>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investments.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
          
          {/* Add More Card */}
          <div className="card-elevated p-6 flex flex-col items-center justify-center text-center min-h-[300px] border-2 border-dashed border-border hover:border-primary transition-colors group cursor-pointer">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              Find New Investment
            </h3>
            <p className="text-muted-foreground text-sm">
              Explore verified properties and grow your portfolio
            </p>
          </div>
        </div>
      </div>

      {/* My Watchlist */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Watchlist</h2>
          <Badge variant="outline" className="text-muted-foreground">
            {watchlist.length} properties
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </div>

      {/* Recent Updates */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Recent Updates</h2>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
        
        <div className="space-y-4">
          {recentUpdates.map((update) => (
            <TimelineItem key={update.id} {...update} />
          ))}
        </div>
      </div>
    </div>
  );

  const BuilderDashboard = () => (
    <div className="space-y-8">
      {/* Builder Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 under construction
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Investors
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,247</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8.2% this month
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capital Raised
            </CardTitle>
            <Wallet className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₹45.2Cr</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +15.3% this quarter
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Updates Posted
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">23</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Projects */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Projects</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Project
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {builderProjects.map((project) => (
            <div key={project.id} className="card-elevated p-0 overflow-hidden">
              <div className="relative">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
                {project.verified && (
                  <div className="absolute top-4 left-4">
                    <Badge className="verified-badge">
                      ApnaGhar Verified
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90 text-foreground">
                    {project.completionStatus}% Complete
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">{project.location}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-semibold">{project.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="text-muted-foreground">{project.lastUpdated}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Post Update
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Search state for the top hero search (only affects the header area)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('buy');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Minimal behavior for now; wire to real search later
    console.log('Search submitted', { selectedTab, searchQuery });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Large top header + hero to resemble 99acres */}
      <div className="relative">
        <div className="sticky top-0 z-50">
          <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 text-white">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-extrabold">ApnaGhar</div>
                <div className="hidden lg:flex items-center text-sm opacity-90">
                  <MapPin className="h-4 w-4 mr-2" />
                  Buy in Western Mumbai
                </div>
              </div>

              <nav className="hidden md:flex items-center space-x-6 text-sm">
                <a className="hover:underline" href="#">For Buyers</a>
                <a className="hover:underline" href="#">For Tenants</a>
                <a className="hover:underline" href="#">For Owners</a>
                <a className="hover:underline" href="#">For Dealers / Builders</a>
                <a className="hover:underline" href="#">Insights</a>
              </nav>

              <div className="flex items-center space-x-3">
                <Button variant="outline" className="text-sm">Post property <span className="ml-2 text-xs bg-green-500 text-white px-2 rounded">FREE</span></Button>
                <Bell className="h-5 w-5 text-white/90" />
                <User className="h-6 w-6 text-white/90" />
                <Menu className="h-6 w-6 text-white/90 md:hidden" />
              </div>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="w-full h-[420px] bg-slate-800">
          <div className="relative w-full h-full overflow-hidden">
            <img src={propertyExample1} alt="hero" className="w-full h-full object-cover opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />

            {/* Right-side hero content */}
            <div className="absolute right-10 top-1/3 max-w-lg text-right text-white">
              <h2 className="text-3xl font-bold mb-3">JOY AURA</h2>
              <p className="text-sm opacity-90 mb-4">100% TRIPARTY PLOT AT ULWE, NAVI MUMBAI — Explore curated listings and projects</p>
              <Button variant="outline" className="text-white">Explore Now</Button>
            </div>
          </div>
        </div>

        {/* Search card that overlaps the hero (attached visually to the hero bottom) */}
        <div className="-mt-14">
          <div className="max-w-4xl mx-auto bg-card p-4 rounded-xl shadow-lg">
            {/* Small secondary nav / tabs attached to the top of search */}
            <div className="mb-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['buy','rent','newlaunch','commercial','plots','projects'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTab(t)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${selectedTab === t ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground bg-transparent'}`}>
                    {t === 'newlaunch' ? 'New Launch' : t === 'plots' ? 'Plots/Land' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}

                <button className="ml-3 px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md border border-green-200">
                  Post Property <span className="ml-2 text-xs bg-green-500 text-white px-2 rounded">FREE</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={selectedTab === 'projects' ? 'Search projects, locations, builders...' : 'Search city, locality or project...'}
                className="flex-1 px-4 py-3 rounded-md border border-input bg-transparent text-foreground"
              />

              <select className="w-44 px-3 py-3 rounded-md border border-input bg-background text-foreground">
                <option>All Residential</option>
                <option>All</option>
                <option>Premium</option>
              </select>

              <div className="flex items-center space-x-2">
                <button type="button" className="w-10 h-10 rounded-full bg-background border border-input flex items-center justify-center text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </button>
                <button type="button" className="w-10 h-10 rounded-full bg-background border border-input flex items-center justify-center text-muted-foreground">
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <Button type="submit" className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white">
                <Search />
                <span className="ml-2">Search</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Page title & description moved below the hero so the new header is only on the first page area */}
        <div className="mt-8 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {userType === 'buyer' ? 'My Properties Dashboard' : 'My Projects Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {userType === 'buyer'
                ? 'Track your real estate investments and property interests'
                : 'Manage your projects and engage with buyers'
              }
            </p>
          </div>
        </div>

        {userType === 'buyer' ? <InvestorDashboard /> : <BuilderDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;