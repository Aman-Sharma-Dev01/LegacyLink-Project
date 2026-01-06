import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Users,
  Building2,
  ChevronDown,
  X,
  Loader2,
  UserCircle,
  UserPlus,
  MessageCircle,
  Check,
  Clock
} from 'lucide-react';
import { directoryAPI, connectionAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const AlumniDirectoryPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    graduationYears: [],
    companies: [],
    locations: [],
  });
  const [stats, setStats] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [connectingTo, setConnectingTo] = useState(null);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchAlumni = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (selectedYear) params.graduationYear = selectedYear;
      if (selectedCompany) params.company = selectedCompany;
      if (selectedLocation) params.location = selectedLocation;

      const { data } = await directoryAPI.getAlumni(params);
      
      if (append) {
        setAlumni(prev => [...prev, ...data.alumni]);
      } else {
        setAlumni(data.alumni);
      }
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      toast.error('Failed to load alumni directory');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedYear, selectedCompany, selectedLocation]);

  const fetchStats = async () => {
    try {
      const { data } = await directoryAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchAlumni(1);
  }, [fetchAlumni]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch connection statuses when alumni list updates
  useEffect(() => {
    const fetchConnectionStatuses = async () => {
      if (alumni.length === 0) return;
      
      const statuses = {};
      await Promise.all(
        alumni.map(async (alum) => {
          if (alum._id !== currentUser?._id) {
            try {
              const { data } = await connectionAPI.getConnectionStatus(alum._id);
              statuses[alum._id] = data;
            } catch (error) {
              statuses[alum._id] = { status: 'none' };
            }
          }
        })
      );
      setConnectionStatuses(statuses);
    };
    
    fetchConnectionStatuses();
  }, [alumni, currentUser]);

  const handleConnect = async (userId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (connectingTo) return;
    setConnectingTo(userId);
    
    try {
      await connectionAPI.sendRequest(userId);
      setConnectionStatuses(prev => ({
        ...prev,
        [userId]: { status: 'pending', direction: 'sent' }
      }));
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setConnectingTo(null);
    }
  };

  const handleMessage = (userId, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/messages?user=${userId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAlumni(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedYear('');
    setSelectedCompany('');
    setSelectedLocation('');
  };

  const hasActiveFilters = search || selectedYear || selectedCompany || selectedLocation;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Alumni Directory</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Connect with our alumni network. Find mentors, explore career paths, and build meaningful professional relationships.
            </p>
          </motion.div>

          {/* Stats */}
          {stats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.counts.alumni}</div>
                <div className="text-blue-100">Alumni</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.counts.students}</div>
                <div className="text-blue-100">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.topCompanies?.length || 0}+</div>
                <div className="text-blue-100">Companies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.alumniByYear?.length || 0}</div>
                <div className="text-blue-100">Batch Years</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </form>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="w-4 h-4 inline mr-1" />
                      Graduation Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Years</option>
                      {filters.graduationYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Company
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Companies</option>
                      {filters.companies.slice(0, 50).map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Locations</option>
                      {filters.locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    {search && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Search: {search}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
                      </span>
                    )}
                    {selectedYear && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Year: {selectedYear}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedYear('')} />
                      </span>
                    )}
                    {selectedCompany && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {selectedCompany}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCompany('')} />
                      </span>
                    )}
                    {selectedLocation && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {selectedLocation}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLocation('')} />
                      </span>
                    )}
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700 ml-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            <Users className="w-5 h-5 inline mr-2" />
            Showing {alumni.length} of {pagination.total || 0} alumni
          </p>
        </div>

        {/* Alumni Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : alumni.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No alumni found</h3>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {alumni.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/profile/${user._id}`}>
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 h-full">
                      {/* Profile Picture */}
                      <div className="flex justify-center mb-4">
                        {user.profile?.profilePicture && user.profile.profilePicture !== 'default_avatar.png' ? (
                          <img
                            src={user.profile.profilePicture}
                            alt={user.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                        {user.profile?.jobTitle && (
                          <p className="text-gray-600 text-sm">{user.profile.jobTitle}</p>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm text-gray-500">
                        {user.profile?.company && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{user.profile.company}</span>
                          </div>
                        )}
                        {user.profile?.graduationYear && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            <span>Class of {user.profile.graduationYear}</span>
                          </div>
                        )}
                        {user.profile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{user.profile.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {user.profile?.skills && user.profile.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1">
                          {user.profile.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.profile.skills.length > 3 && (
                            <span className="px-2 py-1 text-gray-400 text-xs">
                              +{user.profile.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Connection/Message Buttons */}
                      {user._id !== currentUser?._id && (
                        <div className="mt-4 pt-4 border-t flex gap-2">
                          {(() => {
                            const connStatus = connectionStatuses[user._id];
                            if (connStatus?.status === 'accepted') {
                              return (
                                <>
                                  <span className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm">
                                    <Check className="w-4 h-4" />
                                    Connected
                                  </span>
                                  <button
                                    onClick={(e) => handleMessage(user._id, e)}
                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Message
                                  </button>
                                </>
                              );
                            } else if (connStatus?.status === 'pending') {
                              return (
                                <span className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                                  <Clock className="w-4 h-4" />
                                  {connStatus.direction === 'sent' ? 'Request Sent' : 'Pending'}
                                </span>
                              );
                            } else {
                              return (
                                <button
                                  onClick={(e) => handleConnect(user._id, e)}
                                  disabled={connectingTo === user._id}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  {connectingTo === user._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="w-4 h-4" />
                                      Connect
                                    </>
                                  )}
                                </button>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchAlumni(pagination.page + 1, true)}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium inline-flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Alumni
                      <ChevronDown className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Top Companies Sidebar (optional) */}
        {stats?.topCompanies && stats.topCompanies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Companies</h2>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap gap-3">
                {stats.topCompanies.map((company, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedCompany(company.company);
                      fetchAlumni(1);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    {company.company}
                    <span className="text-xs text-gray-400">({company.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectoryPage;
