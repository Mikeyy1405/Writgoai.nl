'use client';

import { useEffect, useState } from 'react';

interface Topic {
  id: string;
  name: string;
  slug: string;
  priority: number;
  target_percentage: number;
  color: string;
  icon: string;
  description: string;
}

interface TopicMetrics {
  topicId: string;
  articleCount: number;
  pillarCount: number;
  clusterCount: number;
  authorityScore: number;
  currentPercentage: number;
}

export default function TopicsOverview() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [metrics, setMetrics] = useState<Record<string, TopicMetrics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      // Fetch topics
      const topicsRes = await fetch('/api/writgo/topics');
      const topicsData = await topicsRes.json();
      
      if (topicsData.success) {
        setTopics(topicsData.topics);
        
        // Fetch metrics for each topic
        const metricsData: Record<string, TopicMetrics> = {};
        for (const topic of topicsData.topics) {
          const metricsRes = await fetch(`/api/writgo/topics/${topic.id}/metrics`);
          const data = await metricsRes.json();
          if (data.success) {
            metricsData[topic.id] = data.metrics;
          }
        }
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-40 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">📊 Topical Authority Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {topics.map(topic => {
          const topicMetrics = metrics[topic.id] || {
            articleCount: 0,
            pillarCount: 0,
            clusterCount: 0,
            authorityScore: 0,
            currentPercentage: 0
          };

          return (
            <div
              key={topic.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-opacity-100 transition-all"
              style={{ borderColor: `${topic.color}40` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{topic.icon}</span>
                <span 
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: `${topic.color}20`,
                    color: topic.color
                  }}
                >
                  Priority {topic.priority}
                </span>
              </div>

              {/* Topic Name */}
              <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                {topic.name}
              </h3>

              {/* Authority Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Authority Score</span>
                  <span className="font-semibold text-white">
                    {topicMetrics.authorityScore.toFixed(0)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${topicMetrics.authorityScore}%`,
                      backgroundColor: topic.color
                    }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Artikelen</span>
                  <span className="text-white font-semibold">
                    {topicMetrics.articleCount}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Pillar / Cluster</span>
                  <span className="text-white font-semibold">
                    {topicMetrics.pillarCount} / {topicMetrics.clusterCount}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Target</span>
                  <span className="text-white font-semibold">
                    {topic.target_percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Huidige</span>
                  <span 
                    className="font-semibold"
                    style={{
                      color: topicMetrics.currentPercentage >= topic.target_percentage 
                        ? '#10B981' 
                        : '#F59E0B'
                    }}
                  >
                    {topicMetrics.currentPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          <span className="font-semibold">Authority Score</span> wordt berekend op basis van aantal pillar pages, clusters, totaal artikelen en gemiddelde ranking.
        </p>
      </div>
    </div>
  );
}
