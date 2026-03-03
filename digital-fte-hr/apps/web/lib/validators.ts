/**
 * Zod Validation Schemas
 * All form and API input validation
 */

import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

// Job Search Schema
export const jobSearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters'),
  location: z.string().optional(),
  filters: z
    .object({
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional(),
      jobType: z.array(z.enum(['full-time', 'part-time', 'contract', 'freelance'])).optional(),
      remote: z.boolean().optional(),
      experienceLevel: z.array(z.enum(['entry', 'mid', 'senior', 'executive'])).optional(),
      datePosted: z.enum(['24h', 'week', 'month']).optional(),
      excludeApplied: z.boolean().optional(),
    })
    .optional(),
  platforms: z.array(z.string()).optional(),
  maxResults: z.number().min(1).max(200).optional(),
});

// Resume Upload Schema
export const resumeUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'File must be PDF or DOCX',
    ),
  name: z.string().optional(),
});

// Resume Form Schema
export const resumeFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),

  // Experience
  experiences: z
    .array(
      z.object({
        company: z.string().min(1, 'Company name is required'),
        position: z.string().min(1, 'Position is required'),
        startDate: z.string(),
        endDate: z.string().optional(),
        currentlyWorking: z.boolean(),
        description: z.string().optional(),
      }),
    )
    .optional(),

  // Education
  education: z
    .array(
      z.object({
        school: z.string().min(1, 'School name is required'),
        degree: z.string().min(1, 'Degree is required'),
        field: z.string().min(1, 'Field of study is required'),
        graduationYear: z.string(),
      }),
    )
    .optional(),

  // Skills
  skills: z.array(z.string()).optional(),

  // Languages
  languages: z.array(z.string()).optional(),

  // Certifications
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .optional(),
});

// Application Approval Schema
export const applicationApprovalSchema = z.object({
  coverLetterText: z.string().optional(),
  screeningAnswers: z.record(z.string()).optional(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the application details',
  }),
});

// Application Skip Schema
export const applicationSkipSchema = z.object({
  reason: z.string().min(1, 'Please provide a reason').max(500),
});

// Settings - Profile Schema
export const profileSettingsSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  timezone: z.string(),
  preferredJobTitles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default('USD'),
});

// Settings - Notification Schema
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  jobAlerts: z.boolean(),
  applicationUpdates: z.boolean(),
  weeklyReport: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.number().min(0).max(23),
  quietHoursEnd: z.number().min(0).max(23),
});

// Settings - Channel Preferences Schema
export const channelPreferencesSchema = z.object({
  channels: z.array(
    z.object({
      channel: z.enum(['whatsapp', 'telegram', 'email', 'push']),
      isEnabled: z.boolean(),
      preferences: z.record(z.unknown()).optional(),
    }),
  ),
});

// Derived Types from Schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
export type ResumeFormInput = z.infer<typeof resumeFormSchema>;
export type ApplicationApprovalInput = z.infer<typeof applicationApprovalSchema>;
export type ApplicationSkipInput = z.infer<typeof applicationSkipSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type ChannelPreferencesInput = z.infer<typeof channelPreferencesSchema>;
