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
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">🤖 AI Agent</h1>
        <p className="text-gray-400">
          Your personal virtual assistant - automate tasks, research, and more
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/ai-agent/chat"
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all border border-primary-500"
        >
          <div className="text-3xl mb-2">💬</div>
          <div className="font-bold text-lg">Chat with Agent</div>
          <div className="text-sm opacity-90">
            Tell your agent what to do
          </div>
        </Link>

        <Link
          href="/dashboard/ai-agent/templates"
          className="bg-gray-900 text-white p-6 rounded-lg hover:shadow-lg hover:border-primary-500 transition-all border border-gray-800"
        >
          <div className="text-3xl mb-2">📚</div>
          <div className="font-bold text-lg">Templates</div>
          <div className="text-sm opacity-90">
            Pre-built workflows & playbooks
          </div>
        </Link>

        <Link
          href="/dashboard/ai-agent/tasks"
          className="bg-gray-900 text-white p-6 rounded-lg hover:shadow-lg hover:border-primary-500 transition-all border border-gray-800"
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
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Running</div>
          <div className="text-3xl font-bold text-primary-500">{stats.running}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Queued</div>
          <div className="text-3xl font-bold text-primary-400">{stats.queued}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Completed</div>
          <div className="text-3xl font-bold text-white">{stats.completed}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Failed</div>
          <div className="text-3xl font-bold text-gray-500">{stats.failed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <Link
              href="/dashboard/ai-agent/tasks"
              className="text-primary-500 hover:underline text-sm"
            >
              View all →
            </Link>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800">
            {!recentTasks || recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🤖</div>
                <div>No tasks yet</div>
                <Link
                  href="/dashboard/ai-agent/chat"
                  className="text-primary-500 hover:underline text-sm mt-2 inline-block"
                >
                  Start your first task →
                </Link>
              </div>
            ) : (
              recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/ai-agent/tasks/${task.id}`}
                  className="block p-4 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {task.agent_templates?.icon || '📝'}
                        </span>
                        <span className="font-medium text-white">{task.title}</span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
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
                        <span className="px-2 py-1 bg-primary-900 text-primary-500 text-xs rounded border border-primary-500">
                          Running
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-700">
                          ✓ Done
                        </span>
                      )}
                      {task.status === 'failed' && (
                        <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">
                          ✗ Failed
                        </span>
                      )}
                      {task.status === 'queued' && (
                        <span className="px-2 py-1 bg-primary-900 text-primary-400 text-xs rounded border border-primary-700">
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
            <h2 className="text-xl font-bold text-white">Popular Templates</h2>
            <Link
              href="/dashboard/ai-agent/templates"
              className="text-primary-500 hover:underline text-sm"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {templates?.map((template) => (
              <Link
                key={template.id}
                href={`/dashboard/ai-agent/templates/${template.id}`}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-primary-500 hover:shadow transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{template.icon || '📝'}</div>
                  <div className="flex-1">
                    <div className="font-medium mb-1 text-white">{template.name}</div>
                    <div className="text-sm text-gray-400">
                      {template.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                        {template.category}
                      </span>
                      {template.is_system && (
                        <span className="text-xs px-2 py-1 bg-primary-900 text-primary-500 rounded border border-primary-500">
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
        <div className="mt-8 bg-gray-900 border border-primary-500 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3 text-white">🚀 Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1 text-white">1. Connect Accounts</div>
              <div className="text-gray-400 mb-2">
                Add your credentials for services like WordPress, Google, etc.
              </div>
              <Link
                href="/dashboard/ai-agent/credentials"
                className="text-primary-500 hover:underline"
              >
                Add credentials →
              </Link>
            </div>
            <div>
              <div className="font-medium mb-1 text-white">2. Choose a Template</div>
              <div className="text-gray-400 mb-2">
                Start with a pre-built workflow or create your own
              </div>
              <Link
                href="/dashboard/ai-agent/templates"
                className="text-primary-500 hover:underline"
              >
                Browse templates →
              </Link>
            </div>
            <div>
              <div className="font-medium mb-1 text-white">3. Chat with Agent</div>
              <div className="text-gray-400 mb-2">
                Tell your agent what to do in natural language
              </div>
              <Link
                href="/dashboard/ai-agent/chat"
                className="text-primary-500 hover:underline"
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
