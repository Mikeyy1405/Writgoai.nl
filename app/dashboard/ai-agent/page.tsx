import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'AI Agent - WritGo.nl',
  description: 'Your personal AI virtual assistant',
};

export default async function AIAgentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get task stats
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('status')
    .eq('user_id', user.id);

  const stats = {
    running: tasks?.filter((t) => t.status === 'running').length || 0,
    queued: tasks?.filter((t) => t.status === 'queued').length || 0,
    completed: tasks?.filter((t) => t.status === 'completed').length || 0,
    failed: tasks?.filter((t) => t.status === 'failed').length || 0,
  };

  // Get recent tasks
  const { data: recentTasks } = await supabase
    .from('agent_tasks')
    .select('*, agent_templates(name, icon)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get templates
  const { data: templates } = await supabase
    .from('agent_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_public.eq.true,is_system.eq.true`)
    .limit(6);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 AI Agent</h1>
        <p className="text-gray-600">
          Your personal virtual assistant - automate tasks, research, and more
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/ai-agent/chat"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">💬</div>
          <div className="font-bold text-lg">Chat with Agent</div>
          <div className="text-sm opacity-90">
            Tell your agent what to do
          </div>
        </Link>

        <Link
          href="/dashboard/ai-agent/templates"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">📚</div>
          <div className="font-bold text-lg">Templates</div>
          <div className="text-sm opacity-90">
            Pre-built workflows & playbooks
          </div>
        </Link>

        <Link
          href="/dashboard/ai-agent/tasks"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg hover:shadow-lg transition-shadow"
        >
          <div className="text-3xl mb-2">📋</div>
          <div className="font-bold text-lg">Task History</div>
          <div className="text-sm opacity-90">
            View all your agent tasks
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Running</div>
          <div className="text-3xl font-bold text-blue-600">{stats.running}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Queued</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.queued}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Tasks</h2>
            <Link
              href="/dashboard/ai-agent/tasks"
              className="text-blue-600 hover:underline text-sm"
            >
              View all →
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {!recentTasks || recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🤖</div>
                <div>No tasks yet</div>
                <Link
                  href="/dashboard/ai-agent/chat"
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  Start your first task →
                </Link>
              </div>
            ) : (
              recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/ai-agent/tasks/${task.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {task.agent_templates?.icon || '📝'}
                        </span>
                        <span className="font-medium">{task.title}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {task.description}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                        {task.duration_seconds && (
                          <span>
                            {Math.floor(task.duration_seconds / 60)}m{' '}
                            {task.duration_seconds % 60}s
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {task.status === 'running' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          Running
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          ✓ Done
                        </span>
                      )}
                      {task.status === 'failed' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          ✗ Failed
                        </span>
                      )}
                      {task.status === 'queued' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Popular Templates */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Popular Templates</h2>
            <Link
              href="/dashboard/ai-agent/templates"
              className="text-blue-600 hover:underline text-sm"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {templates?.map((template) => (
              <Link
                key={template.id}
                href={`/dashboard/ai-agent/templates/${template.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{template.icon || '📝'}</div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{template.name}</div>
                    <div className="text-sm text-gray-600">
                      {template.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {template.category}
                      </span>
                      {template.is_system && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                          Official
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started */}
      {stats.completed === 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">🚀 Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">1. Connect Accounts</div>
              <div className="text-gray-600 mb-2">
                Add your credentials for services like WordPress, Google, etc.
              </div>
              <Link
                href="/dashboard/ai-agent/credentials"
                className="text-blue-600 hover:underline"
              >
                Add credentials →
              </Link>
            </div>
            <div>
              <div className="font-medium mb-1">2. Choose a Template</div>
              <div className="text-gray-600 mb-2">
                Start with a pre-built workflow or create your own
              </div>
              <Link
                href="/dashboard/ai-agent/templates"
                className="text-blue-600 hover:underline"
              >
                Browse templates →
              </Link>
            </div>
            <div>
              <div className="font-medium mb-1">3. Chat with Agent</div>
              <div className="text-gray-600 mb-2">
                Tell your agent what to do in natural language
              </div>
              <Link
                href="/dashboard/ai-agent/chat"
                className="text-blue-600 hover:underline"
              >
                Start chatting →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
