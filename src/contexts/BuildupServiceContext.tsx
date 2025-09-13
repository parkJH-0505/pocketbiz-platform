import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BuildupService } from '../types/buildup.types';
import buildupServicesData from '../data/buildupServices.json';

interface BuildupServiceContextType {
  services: BuildupService[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  getService: (id: string) => BuildupService | undefined;
  addService: (service: BuildupService) => Promise<void>;
  updateService: (id: string, updates: Partial<BuildupService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  // Filter and search
  searchServices: (query: string) => BuildupService[];
  filterByCategory: (category: string) => BuildupService[];
  filterByPriceRange: (min: number, max: number) => BuildupService[];
  getRecommendedServices: (kpiScores?: any) => BuildupService[];
  getFeaturedServices: () => BuildupService[];
}

const BuildupServiceContext = createContext<BuildupServiceContextType | undefined>(undefined);

export function BuildupServiceProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<BuildupService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load services from JSON file (simulating backend)
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      // In production, this would be an API call
      // const response = await fetch('/api/buildup-services');
      // const data = await response.json();
      
      // For now, load from local JSON
      setServices(buildupServicesData.services as BuildupService[]);
      setError(null);
    } catch (err) {
      setError('Failed to load services');
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get single service by ID
  const getService = (id: string) => {
    return services.find(s => s.service_id === id);
  };

  // Add new service (admin function)
  const addService = async (service: BuildupService) => {
    try {
      // In production, this would be an API call
      // await fetch('/api/buildup-services', {
      //   method: 'POST',
      //   body: JSON.stringify(service)
      // });
      
      setServices([...services, service]);
      
      // Save to localStorage for persistence
      localStorage.setItem('buildup_services', JSON.stringify([...services, service]));
    } catch (err) {
      console.error('Error adding service:', err);
      throw err;
    }
  };

  // Update existing service (admin function)
  const updateService = async (id: string, updates: Partial<BuildupService>) => {
    try {
      // In production, this would be an API call
      // await fetch(`/api/buildup-services/${id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(updates)
      // });
      
      const updatedServices = services.map(s => 
        s.service_id === id ? { ...s, ...updates } : s
      );
      setServices(updatedServices);
      
      // Save to localStorage
      localStorage.setItem('buildup_services', JSON.stringify(updatedServices));
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  };

  // Delete service (admin function)
  const deleteService = async (id: string) => {
    try {
      // In production, this would be an API call
      // await fetch(`/api/buildup-services/${id}`, {
      //   method: 'DELETE'
      // });
      
      const filteredServices = services.filter(s => s.service_id !== id);
      setServices(filteredServices);
      
      // Save to localStorage
      localStorage.setItem('buildup_services', JSON.stringify(filteredServices));
    } catch (err) {
      console.error('Error deleting service:', err);
      throw err;
    }
  };

  // Search services
  const searchServices = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(lowercaseQuery) ||
      service.description.toLowerCase().includes(lowercaseQuery) ||
      service.subtitle.toLowerCase().includes(lowercaseQuery) ||
      service.deliverables.some(d => d.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Filter by category
  const filterByCategory = (category: string) => {
    if (category === 'all') return services;
    return services.filter(s => s.category === category);
  };

  // Filter by price range
  const filterByPriceRange = (min: number, max: number) => {
    return services.filter(s => {
      const price = s.price_base / 10000; // Convert to 만원
      return price >= min && price <= max;
    });
  };

  // Get recommended services based on KPI scores
  const getRecommendedServices = (kpiScores?: any) => {
    // Simple recommendation logic based on low KPI scores
    if (!kpiScores) return services.slice(0, 3);
    
    const recommendations: BuildupService[] = [];
    
    // Recommend services based on low KPI areas
    if (kpiScores.GO < 3) {
      recommendations.push(...services.filter(s => 
        s.target_axis.includes('GO')
      ).slice(0, 1));
    }
    if (kpiScores.EC < 3) {
      recommendations.push(...services.filter(s => 
        s.target_axis.includes('EC')
      ).slice(0, 1));
    }
    if (kpiScores.PT < 3) {
      recommendations.push(...services.filter(s => 
        s.target_axis.includes('PT')
      ).slice(0, 1));
    }
    
    // Return unique recommendations
    const uniqueRecommendations = Array.from(
      new Set(recommendations.map(s => s.service_id))
    ).map(id => services.find(s => s.service_id === id)!);
    
    return uniqueRecommendations.slice(0, 3);
  };

  // Get featured services
  const getFeaturedServices = () => {
    // Return services with high ratings and review counts
    return services
      .filter(s => s.avg_rating >= 4.5 && s.review_count >= 50)
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 6);
  };

  const value = {
    services,
    loading,
    error,
    getService,
    addService,
    updateService,
    deleteService,
    searchServices,
    filterByCategory,
    filterByPriceRange,
    getRecommendedServices,
    getFeaturedServices
  };

  return (
    <BuildupServiceContext.Provider value={value}>
      {children}
    </BuildupServiceContext.Provider>
  );
}

export function useBuildupServices() {
  const context = useContext(BuildupServiceContext);
  if (context === undefined) {
    throw new Error('useBuildupServices must be used within a BuildupServiceProvider');
  }
  return context;
}