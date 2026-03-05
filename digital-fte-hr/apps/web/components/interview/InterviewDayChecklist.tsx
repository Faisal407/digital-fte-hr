'use client';

import { useState } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'before' | 'day-of' | 'questions';
  completed: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    title: 'Research the company',
    description: 'Visit website, read recent news, understand products',
    category: 'before',
    completed: false,
  },
  {
    id: '2',
    title: 'Research your interviewer',
    description: 'Find them on LinkedIn, check their background',
    category: 'before',
    completed: false,
  },
  {
    id: '3',
    title: 'Prepare success stories',
    description: '3-5 stories using STAR method for common questions',
    category: 'before',
    completed: false,
  },
  {
    id: '4',
    title: 'Mock interview practice',
    description: 'Practice with AI coach or friend',
    category: 'before',
    completed: false,
  },
  {
    id: '5',
    title: 'Get directions/test connection',
    description: 'For video interviews, test camera/mic/internet',
    category: 'day-of',
    completed: false,
  },
  {
    id: '6',
    title: 'Dress professionally',
    description: 'Match company culture + be 10% more formal',
    category: 'day-of',
    completed: false,
  },
  {
    id: '7',
    title: 'Have resumes printed',
    description: 'Keep 3-5 copies in case of panel interview',
    category: 'day-of',
    completed: false,
  },
  {
    id: '8',
    title: 'Arrive 15 minutes early',
    description: 'On time is late, early is on time',
    category: 'day-of',
    completed: false,
  },
  {
    id: '9',
    title: 'Why do you want this role?',
    description: 'Specific reasons beyond salary/location',
    category: 'questions',
    completed: false,
  },
  {
    id: '10',
    title: 'Tell me about a challenge',
    description: 'STAR format: Situation, Task, Action, Result',
    category: 'questions',
    completed: false,
  },
  {
    id: '11',
    title: 'Where do you see yourself?',
    description: '3-5 year goals aligned with company',
    category: 'questions',
    completed: false,
  },
  {
    id: '12',
    title: 'Questions for the interviewer',
    description: 'Ask 3-5 thoughtful questions at the end',
    category: 'questions',
    completed: false,
  },
];

interface InterviewDayChecklistProps {
  companyName?: string;
  interviewDate?: string;
}

export function InterviewDayChecklist({
  companyName = 'Company Name',
}: InterviewDayChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const categories = {
    before: { label: 'Before the Interview', emoji: '📚' },
    'day-of': { label: 'Day Of Interview', emoji: '📅' },
    questions: { label: 'Common Questions', emoji: '❓' },
  };

  const completionRate = Math.round((items.filter((i) => i.completed).length / items.length) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Interview Day Checklist</h2>
        <p className="mt-2 text-gray-600">{companyName} Interview Preparation</p>
      </div>

      {/* Progress Bar */}
      <div className="rounded-lg bg-white p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Overall Preparation</span>
          <span className="text-2xl font-bold text-primary-400">{completionRate}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary-400 transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Checklist by Category */}
      <div className="space-y-8">
        {(Object.entries(categories) as [keyof typeof categories, (typeof categories)[keyof typeof categories]][]).map(
          ([key, { label, emoji }]) => {
            const categoryItems = items.filter((item) => item.category === key);
            const categoryCompletion = Math.round(
              (categoryItems.filter((i) => i.completed).length / categoryItems.length) * 100
            );

            return (
              <div key={key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{label}</h3>
                    <p className="text-xs text-gray-500">{categoryCompletion}% complete</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-400">
                    {categoryItems.filter((i) => i.completed).length}/{categoryItems.length}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleItem(item.id)}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-400 focus:ring-primary-400"
                      />
                      <div className="flex-1">
                        <p
                          className={`font-semibold transition-colors ${
                            item.completed ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      </div>
                      {item.completed && (
                        <span className="text-xl">✅</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Final Tips */}
      {completionRate === 100 && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-6">
          <p className="text-green-900 font-semibold">
            🎉 You're fully prepared! You've got this. Remember to be authentic and show genuine interest in the role.
          </p>
        </div>
      )}

      {/* Quick Tips */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
        <h4 className="font-bold text-blue-900">💡 Last Minute Tips</h4>
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          <li>✓ Get good sleep the night before</li>
          <li>✓ Eat a proper breakfast</li>
          <li>✓ Practice your handshake (firm but not crushing)</li>
          <li>✓ Maintain eye contact during conversation</li>
          <li>✓ Smile and be genuinely enthusiastic</li>
          <li>✓ Follow up with a thank you email within 24 hours</li>
        </ul>
      </div>
    </div>
  );
}
