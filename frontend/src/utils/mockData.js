export const EMPTY_STATE_ILLUSTRATIONS = {
  resume: {
    title: 'No resume uploaded yet',
    description: 'Upload your resume to enable automated job applications. We support PDF, DOC, and DOCX formats.',
    action: 'Upload Resume',
  },
  coverLetter: {
    title: 'No cover letter yet',
    description: 'Write or upload a cover letter template to personalize your job applications.',
    action: 'Create Cover Letter',
  },
  templates: {
    title: 'No email templates',
    description: 'Create your first email template to start sending personalized job applications.',
    action: 'Create Template',
  },
  logs: {
    title: 'No email logs yet',
    description: 'Your sent email history will appear here once you start sending applications.',
    action: 'Send Emails',
  },
  analytics: {
    title: 'No analytics data',
    description: 'Analytics will become available after you send your first batch of emails.',
    action: 'Send Your First Email',
  },
  recipients: {
    title: 'No recipients added',
    description: 'Add recipient email addresses to get started with your job application campaign.',
    action: 'Add Recipients',
  },
  dashboard: {
    title: 'Welcome to Email Automation',
    description: 'Start by uploading your resume, creating a template, and setting up your first email campaign.',
    action: 'Get Started',
  },
};

const SKELETON_BASE = 'animate-pulse rounded bg-gray-200 dark:bg-gray-700';

export const SKELETON_CONFIG = {
  card: `${SKELETON_BASE} h-32 w-full`,
  text: `${SKELETON_BASE} h-4 w-full`,
  'text-sm': `${SKELETON_BASE} h-3 w-3/4`,
  'text-lg': `${SKELETON_BASE} h-6 w-1/2`,
  avatar: `${SKELETON_BASE} h-10 w-10 rounded-full`,
  button: `${SKELETON_BASE} h-10 w-24`,
  'input-lg': `${SKELETON_BASE} h-12 w-full`,
  table: `${SKELETON_BASE} h-8 w-full`,
  'table-row': `${SKELETON_BASE} h-12 w-full`,
};
