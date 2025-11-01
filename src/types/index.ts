//hello ikram

import { ChatTypeEnum, GenderEnum } from "../enum";

export interface OptionType {
  value: string;
  name: Record<string, string>;
}

export interface ReportBody {
  sessionId: string;
  message: string;
}


export interface MatchSession {
  id: string;
  users: string[];
  status: 'waiting' | 'pending' | 'connected' | 'rejected' | 'ended';
  startedAt: string;
  chatType: 'voice' | 'text';
  endedAt?: string;
}

export interface CleanupStats {
  totalScanned: number;
  totalDeleted: number;
  rejectedDeleted: number;
  endedDeleted: number;
  lastCleanup: Date | null;
  errors: number;
  lastError: string | null;
}


export interface UserPreferences {
  gender: GenderEnum;
  preferredGender: GenderEnum | 'any';
  age: {
    min: number;
    max: number;
  };
  preferredAgeRange: {
    min: number;
    max: number;
  }[];
  topics: string[];
  language: string[];
  chatType: ChatTypeEnum;
}

export interface User {
  socketId: string;
  preferences: UserPreferences;
  isSearching: boolean;
  currentMatch?: string;
  joinedAt: Date;
  location?: {
    country: string;
    region: string;
  };
}


export interface OptionType {
  value: string;
  name: Record<string, string>;
}


export interface FindIpResponse {
  city: {
    geoname_id: number;
    names: {
      de?: string;
      en?: string;
      es?: string;
      fa?: string;
      fr?: string;
      ja?: string;
      ko?: string;
      'pt-BR'?: string;
      ru?: string;
      'zh-CN'?: string;
    };
  };
  continent: {
    code: string;
    geoname_id: number;
    names: {
      de?: string;
      en?: string;
      es?: string;
      fa?: string;
      fr?: string;
      ja?: string;
      ko?: string;
      'pt-BR'?: string;
      ru?: string;
      'zh-CN'?: string;
    };
  };
  country: {
    geoname_id: number;
    is_in_european_union: boolean;
    iso_code: string;
    names: {
      de?: string;
      en?: string;
      es?: string;
      fa?: string;
      fr?: string;
      ja?: string;
      ko?: string;
      'pt-BR'?: string;
      ru?: string;
      'zh-CN'?: string;
    };
  };
  location: {
    latitude: number;
    longitude: number;
    time_zone: string;
    weather_code: string;
  };
  subdivisions: Array<{
    geoname_id?: number;
    iso_code?: string;
    names: {
      en?: string;
      [key: string]: string | undefined;
    };
  }>;
  traits: {
    autonomous_system_number: number;
    autonomous_system_organization: string;
    connection_type: string;
    isp: string;
    user_type: string;
  };
}


export interface LocationData {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  connectionType: string;
}

// ============= Admin Panel Types =============

// Dashboard Types
export interface DashboardOverview {
  totalUsers: number;
  onlineUsers: number;
  activeChats: number;
  totalChats: number;
  totalMessages: number;
  pendingReports: number;
  totalReports: number;
  averageChatDuration: number;
  maxChatDuration: number;
  minChatDuration: number;
}

export interface ServerLoadStats {
  memoryUsage: Array<{ value: number; timestamp: Date }>;
  activeConnections: number;
  chatsByStatus: Record<string, number>;
  timestamp: Date;
}

// User Management Types
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  isOnline?: boolean;
  country?: string;
  gender?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserProfile {
  user: any;
  stats: {
    totalChats: number;
    completedChats: number;
    rejectedChats: number;
    averageChatDuration: number;
    reportsReceived: number;
    reportsMade: number;
  };
  chatHistory: any[];
  reportsAgainst: any[];
  reportsMade: any[];
}

// Chat Management Types
export interface ChatListParams {
  page?: number;
  limit?: number;
  status?: string;
  chatType?: string;
  language?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ChatStatistics {
  totalChats: number;
  activeChats: number;
  statusDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  languageDistribution: Array<{ language: string; count: number }>;
  durationStats: {
    average: number;
    max: number;
    min: number;
    total: number;
  };
  messageStats: {
    total: number;
    averagePerChat: number;
  };
  timeRange: string;
}

// Report Management Types
export interface ReportListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  reportedIp?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  statusDistribution: Record<string, number>;
  categoryDistribution: Array<{ category: string; count: number }>;
  priorityDistribution: Record<string, number>;
  topReportedUsers: Array<{ ip: string; reportCount: number }>;
  topReporters: Array<{ ip: string; reportCount: number }>;
  timeRange: string;
}

export interface UpdateReportStatusRequest {
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  moderatorId: string;
  notes?: string;
}

export interface BulkUpdateReportsRequest {
  reportIds: string[];
  updates: {
    status?: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
    priority?: 'low' | 'medium' | 'high';
    moderatorId?: string;
    notes?: string;
  };
}

// Analytics Types
export interface SiteAnalytics {
  newUsersOverTime: Array<{ date: string; count: number }>;
  chatActivityOverTime: Array<{ date: string; status: string; count: number }>;
  messageVolumeOverTime: Array<{
    date: string;
    totalMessages: number;
    avgMessagesPerChat: number;
  }>;
  userRetention: {
    totalNewUsers: number;
    returningUsers: number;
    retentionRate: number;
  };
  period: string;
  generatedAt: Date;
}

export interface GeographyAnalytics {
  country: string;
  totalUsers: number;
  totalChats: number;
  onlineUsers: number;
}

export interface DevicePlatformStats {
  platforms: Record<string, number>;
  browsers: Record<string, number>;
  note?: string;
}

export interface PeakUsageTimes {
  byHour: Array<{ hour: number; count: number }>;
  byDayOfWeek: Array<{ day: string; dayNumber: number; count: number }>;
  period: string;
}

export interface LanguageAnalytics {
  byUserPreference: Array<{ language: string; userCount: number }>;
  byChat: Array<{ language: string; chatCount: number }>;
}

export interface GenderAnalytics {
  genderDistribution: Record<string, number>;
  genderPreferences: Array<{
    gender: string;
    preferredGender: string;
    count: number;
  }>;
  activeByGender: Record<string, number>;
}

export interface TopicAnalytics {
  byUserPreference: Array<{ topic: string; userCount: number }>;
  byChat: Array<{ topic: string; chatCount: number }>;
}

// API Response Types
export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}