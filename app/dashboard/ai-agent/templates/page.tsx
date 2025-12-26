import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Templates - AI Agent - WritGo.nl',
  description: 'Pre-built workflows and playbooks for your AI agent',
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get all templates (own + public + system)
  const { data: templates } = await supabase
    .from('agent_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_public.eq.true,is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('usage_count', { ascending: false });

  // Group by category
  const grouped = (templates || []).reduce((acc: any, template) => {
    const category = template.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {});

  const categories = [
    { key: 'research', name: 'Research & Monitoring', icon: '🔍', color: 'blue' },
    { key: 'ecommerce', name: 'E-Commerce', icon: '💰', color: 'green' },
    { key: 'content', name: 'Content Creation', icon: '✍️', color: 'purple' },
    { key: 'admin', name: 'Admin & Tasks', icon: '📊', color: 'yellow' },
    { key: 'other', name: 'Other', icon: '📝', color: 'gray' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">📚 Agent Templates</h1>
          <Link
            href="/dashboard/ai-agent/chat"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            💬 Back to Chat
          </Link>
        </div>
        <p className="text-gray-600">
          Pre-built workflows you can use or customize for your needs
        </p>
      </div>

      {/* Categories */}
      {categories.map((category) => {
        const categoryTemplates = grouped[category.key] || [];

        if (categoryTemplates.length === 0) return null;

        return (
          <div key={category.key} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <h2 className="text-xl font-bold">{category.name}</h2>
              <span className="text-sm text-gray-500">
                ({categoryTemplates.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map((template: any) => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{template.icon || '📝'}</div>
                    <div className="flex gap-1">
                      {template.is_system && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                          Official
                        </span>
                      )}
                      {template.is_scheduled && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>

                  {template.usage_count > 0 && (
                    <div className="text-xs text-gray-500 mb-3">
                      Used {template.usage_count} times
                      {template.avg_duration_seconds && (
                        <span className="ml-2">
                          • Avg {Math.floor(template.avg_duration_seconds / 60)}m
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/ai-agent/chat?template=${template.id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      ▶️ Run
                    </Link>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      👁️
                    </button>
                    {!template.is_system && (
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        ✏️
                      </button>
                    )}
                  </div>

                  {template.is_scheduled && template.schedule_cron && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Schedule:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {template.schedule_cron}
                        </span>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={template.schedule_enabled}
                            className="rounded"
                          />
                          <span>Enabled</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Create New Template */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-bold mb-2">Create Your Own Template</h3>
        <p className="text-gray-600 mb-4">
          Save frequently used workflows as templates for quick access
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          ➕ Create Template
        </button>
      </div>
    </div>
  );
}
