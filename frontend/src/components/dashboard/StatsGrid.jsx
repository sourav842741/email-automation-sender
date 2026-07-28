import { Send, CalendarCheck, CheckCircle, XCircle, FileCheck } from 'lucide-react';
import StatCard from '../ui/StatCard.jsx';

export default function StatsGrid({ analytics, resume, loading }) {
  const totalSent = analytics?.totalSent || 0;
  const todayCount = analytics?.todayCount || 0;
  const successRate = analytics?.successRate ?? 100;
  const failureCount = analytics?.failureCount || 0;
  const hasResume = !!resume;
  const successCount = analytics?.successCount || 0;

  const cards = [
    { icon: Send, label: 'Total Emails Sent', value: totalSent.toLocaleString(), subtext: `${successCount} successful`, color: 'indigo' },
    { icon: CalendarCheck, label: "Today's Emails", value: todayCount.toLocaleString(), subtext: 'sent today', color: 'emerald' },
    { icon: CheckCircle, label: 'Success Rate', value: `${Math.round(successRate)}%`, subtext: 'delivery rate', color: 'indigo' },
    { icon: XCircle, label: 'Failed Emails', value: failureCount.toLocaleString(), subtext: 'total failures', color: 'orange' },
    { icon: FileCheck, label: 'Resume Uploaded', value: hasResume ? 'Yes' : 'No', subtext: hasResume ? `${resume?.originalName || resume?.fileName || ''}` : 'Upload now', color: 'purple' },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          style={{ animationDelay: `${i * 0.08}s` }}
          className="animate-[fadeIn_0.5s_ease-out_both]"
        >
          <StatCard {...card} loading={loading} />
        </div>
      ))}
    </div>
  );
}
