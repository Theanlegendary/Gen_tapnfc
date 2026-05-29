import { supabase } from '@/lib/supabase';
import { User, LoginCredentials, RegisterData } from '@/types/auth';
import { AttendanceRecord } from '@/types/attendance';
import { AppNotification } from '@/types/notifications';
import bcrypt from 'bcryptjs';

export class AttendanceAPI {
  // Authentication
  static async login(credentials: LoginCredentials): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  static async register(data: RegisterData): Promise<User> {
    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        password_hash,
        name: data.name,
        employee_id: data.employeeId,
        role: data.role || 'user',
        contact: data.contact,
        designation: data.designation,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Email or Employee ID already exists');
      }
      throw new Error('Registration failed');
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  static async updateProfile(userId: string, profileData: Partial<User>): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to update profile');
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Attendance
  static async submitAttendance(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: record.userId,
        employee_id: record.employeeId,
        employee_name: record.employeeName,
        date: record.date,
        check_in_time: record.checkInTime,
        check_out_time: record.checkOutTime,
        status: record.status,
        qr_code_data: record.qrCodeData,
        location_coordinates: record.location ? `(${record.location.latitude},${record.location.longitude})` : null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to submit attendance');
    }

    return {
      id: data.id,
      userId: data.user_id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      date: data.date,
      checkInTime: data.check_in_time,
      checkOutTime: data.check_out_time,
      status: data.status,
      qrCodeData: data.qr_code_data,
      location: data.location_coordinates ? {
        latitude: parseFloat(data.location_coordinates.split(',')[0].replace('(', '')),
        longitude: parseFloat(data.location_coordinates.split(',')[1].replace(')', '')),
      } : undefined,
      workingHours: data.working_hours,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async getAttendanceHistory(userId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to fetch attendance history');
    }

    return data.map(record => ({
      id: record.id,
      userId: record.user_id,
      employeeId: record.employee_id,
      employeeName: record.employee_name,
      date: record.date,
      checkInTime: record.check_in_time,
      checkOutTime: record.check_out_time,
      status: record.status,
      qrCodeData: record.qr_code_data,
      location: record.location_coordinates ? {
        latitude: parseFloat(record.location_coordinates.split(',')[0].replace('(', '')),
        longitude: parseFloat(record.location_coordinates.split(',')[1].replace(')', '')),
      } : undefined,
      workingHours: record.working_hours,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
  }

  // Notifications
  static async getNotifications(userId: string, audience: 'admin' | 'user'): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('target_audience', audience)
      .eq(audience === 'admin' ? 'admin_id' : 'user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch notifications');
    }

    return data as AppNotification[];
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      throw new Error('Failed to mark notification as read');
    }
  }

  static async createNotification(notification: Omit<AppNotification, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        type: notification.type,
        target_audience: notification.targetAudience,
        user_id: notification.userId,
        admin_id: notification.adminId,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        metadata: notification.metadata,
        action_url: notification.actionUrl,
      });

    if (error) {
      throw new Error('Failed to create notification');
    }
  }

  // Groups
  static async createGroup(groupData: any): Promise<any> {
    const { data, error } = await supabase
      .from('attendance_groups')
      .insert(groupData)
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to create group');
    }

    return data;
  }

  static async getGroups(adminId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attendance_groups')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch groups');
    }

    return data;
  }

  static async getJoinRequests(adminId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('group_join_requests')
      .select(`
        *,
        attendance_groups!inner(admin_id, name)
      `)
      .eq('attendance_groups.admin_id', adminId)
      .order('requested_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch join requests');
    }

    return data;
  }
}