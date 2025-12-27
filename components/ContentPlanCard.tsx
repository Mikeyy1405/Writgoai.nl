'use client';

import { useState } from 'react';
import type { ComprehensiveContentIdea } from '@/types/content-plan';

interface ContentPlanCardProps {
  article: Partial<ComprehensiveContentIdea>;
  index: number;
  onWrite: (index: number) => void;
  onDelete: (index: number) => void;
  onStatusChange: (index: number, status: string) => void;
}

export default function ContentPlanCard({
  article,
  index,
  onWrite,
  onDelete,
  onStatusChange,
}: ContentPlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const status = article.status || 'todo';
  const hasOutline = article.outline && article.outline.mainSections && article.outline.mainSections.length > 0;
  const hasKeywords = article.keywordStrategy && article.keywordStrategy.peopleAlsoAsk && article.keywordStrategy.peopleAlsoAsk.length > 0;
  const hasSources = article.sources && article.sources.primarySources && article.sources.primarySources.length > 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-5 hover:border-orange-500/50 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          {/* Status & Priority Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(status)}`}>
              {getStatusIcon(status)} {getStatusLabel(status)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(article.priority || 'medium')}`}>
              {article.priority || 'medium'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
              {article.contentType || 'guide'}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
              {article.cluster || 'Geen cluster'}
            </span>
            {article.complexity && (
              <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                {article.complexity}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-1">{article.title}</h3>

          {/* Meta Description */}
          {article.seoMetadata?.metaDescription && (
            <p className="text-gray-400 text-sm mb-2">{article.seoMetadata.metaDescription}</p>
          )}

          {/* Quick Stats */}
          <div className="flex gap-4 text-xs text-gray-500 mb-2">
            {article.writingGuidelines?.wordCountMin && (
              <span>📝 {article.writingGuidelines.wordCountMin}-{article.writingGuidelines.wordCountMax} woorden</span>
            )}
            {article.estimatedWritingTime && (
              <span>⏱️ ~{article.estimatedWritingTime} min</span>
            )}
            {article.searchVolume && (
              <span>🔍 {article.searchVolume} searches/month</span>
            )}
            {article.keywordDifficulty && (
              <span className={`font-medium ${
                article.keywordDifficulty < 30 ? 'text-green-400' :
                article.keywordDifficulty < 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                KD: {article.keywordDifficulty}
              </span>
            )}
          </div>

          {/* Keywords */}
          {article.seoMetadata?.focusKeyword && (
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded font-medium">
                🎯 {article.seoMetadata.focusKeyword}
              </span>
              {article.seoMetadata.secondaryKeywords?.slice(0, 3).map((kw, i) => (
                <span key={i} className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Content Features Indicators */}
          <div className="flex gap-2 text-xs">
            {hasOutline && (
              <span className="text-green-400">✓ Outline</span>
            )}
            {hasKeywords && (
              <span className="text-green-400">✓ Keywords</span>
            )}
            {hasSources && (
              <span className="text-green-400">✓ Sources</span>
            )}
            {article.internalLinking?.suggestedLinks && article.internalLinking.suggestedLinks.length > 0 && (
              <span className="text-green-400">✓ Links</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-start">
          <select
            value={status}
            onChange={(e) => onStatusChange(index, e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs hover:border-orange-500 focus:outline-none focus:border-orange-500"
          >
            <option value="todo">📝 Te doen</option>
            <option value="in_progress">🔄 In progress</option>
            <option value="review">👀 Review</option>
            <option value="published">✅ Gepubliceerd</option>
            <option value="update_needed">🔁 Update nodig</option>
          </select>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white p-2 transition-colors"
            title={expanded ? 'Inklappen' : 'Uitklappen'}
          >
            {expanded ? '▼' : '▶'}
          </button>

          <button
            onClick={() => onWrite(index)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all whitespace-nowrap"
          >
            {status === 'in_progress' ? '↗️ Verder' : 'Schrijven'}
          </button>

          <button
            onClick={() => onDelete(index)}
            className="text-red-400 hover:text-red-300 p-2"
            title="Verwijderen"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
          {/* Content Angle */}
          {article.contentAngle && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">💡 Content Strategie</h4>
              <div className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-300 space-y-1">
                {article.contentAngle.hook && <p><strong>Hook:</strong> {article.contentAngle.hook}</p>}
                {article.contentAngle.uniqueValue && <p><strong>Unieke Waarde:</strong> {article.contentAngle.uniqueValue}</p>}
                {article.contentAngle.targetPain && <p><strong>Probleem:</strong> {article.contentAngle.targetPain}</p>}
                {article.contentAngle.solution && <p><strong>Oplossing:</strong> {article.contentAngle.solution}</p>}
              </div>
            </div>
          )}

          {/* Target Persona */}
          {article.targetPersona && article.targetPersona.name !== 'Default Persona' && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">👤 Target Persona: {article.targetPersona.name}</h4>
              <div className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-300 space-y-2">
                <p><strong>Level:</strong> {article.targetPersona.level}</p>
                {article.targetPersona.painPoints && article.targetPersona.painPoints.length > 0 && (
                  <div>
                    <strong>Pain Points:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {article.targetPersona.painPoints.map((pain, i) => (
                        <li key={i}>{pain}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {article.targetPersona.goals && article.targetPersona.goals.length > 0 && (
                  <div>
                    <strong>Goals:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {article.targetPersona.goals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outline */}
          {hasOutline && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">📋 Artikel Outline</h4>
              <div className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-300 space-y-3">
                {/* Introduction */}
                {article.outline?.introduction && (
                  <div>
                    <p className="font-semibold text-orange-400">Introductie (~{article.outline.introduction.wordCount} woorden)</p>
                    <ul className="list-disc list-inside ml-2 mt-1 text-xs">
                      {article.outline.introduction.hook && <li>Hook: {article.outline.introduction.hook}</li>}
                      {article.outline.introduction.problem && <li>Probleem: {article.outline.introduction.problem}</li>}
                      {article.outline.introduction.solution && <li>Solution: {article.outline.introduction.solution}</li>}
                    </ul>
                  </div>
                )}

                {/* Main Sections */}
                {article.outline?.mainSections?.map((section, i) => (
                  <div key={i}>
                    <p className="font-semibold text-blue-400">H2: {section.heading} (~{section.wordCount} woorden)</p>
                    {section.subheadings && section.subheadings.length > 0 && (
                      <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                        {section.subheadings.map((sub, j) => (
                          <li key={j}>
                            H{sub.level}: {sub.text}
                            {sub.keywords && sub.keywords.length > 0 && (
                              <span className="text-gray-500"> ({sub.keywords.join(', ')})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.keyPoints && section.keyPoints.length > 0 && (
                      <div className="ml-4 mt-1 text-xs">
                        <span className="text-gray-500">Key points:</span>
                        <ul className="list-disc list-inside ml-2">
                          {section.keyPoints.map((point, j) => (
                            <li key={j}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {/* Conclusion */}
                {article.outline?.conclusion && (
                  <div>
                    <p className="font-semibold text-green-400">Conclusie (~{article.outline.conclusion.wordCount} woorden)</p>
                    <ul className="list-disc list-inside ml-2 mt-1 text-xs">
                      {article.outline.conclusion.cta && <li>CTA: {article.outline.conclusion.cta}</li>}
                      {article.outline.conclusion.nextSteps && article.outline.conclusion.nextSteps.length > 0 && (
                        <li>Next steps: {article.outline.conclusion.nextSteps.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* FAQ */}
                {article.outline?.faq && article.outline.faq.length > 0 && (
                  <div>
                    <p className="font-semibold text-purple-400">FAQ ({article.outline.faq.length} vragen)</p>
                    <div className="ml-2 mt-1 text-xs space-y-1">
                      {article.outline.faq.map((faq, i) => (
                        <div key={i}>
                          <p className="text-white">Q: {faq.question}</p>
                          <p className="text-gray-500 ml-2">A: {faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keywords & PAA */}
          {hasKeywords && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keywords */}
              {article.keywordStrategy && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">🎯 Keywords</h4>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-xs space-y-2">
                    {article.keywordStrategy.primary && (
                      <div>
                        <span className="text-orange-400 font-semibold">Primary:</span> {article.keywordStrategy.primary}
                      </div>
                    )}
                    {article.keywordStrategy.longtail && article.keywordStrategy.longtail.length > 0 && (
                      <div>
                        <span className="text-blue-400 font-semibold">Long-tail:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {article.keywordStrategy.longtail.map((kw, i) => (
                            <span key={i} className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {article.keywordStrategy.semantic && article.keywordStrategy.semantic.length > 0 && (
                      <div>
                        <span className="text-purple-400 font-semibold">Semantic:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {article.keywordStrategy.semantic.slice(0, 5).map((kw, i) => (
                            <span key={i} className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* People Also Ask */}
              {article.keywordStrategy?.peopleAlsoAsk && article.keywordStrategy.peopleAlsoAsk.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">❓ People Also Ask</h4>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-xs">
                    <ul className="list-disc list-inside space-y-1">
                      {article.keywordStrategy.peopleAlsoAsk.map((question, i) => (
                        <li key={i} className="text-gray-300">{question}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sources */}
          {hasSources && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">📚 Bronnen</h4>
              <div className="bg-gray-900/50 rounded-lg p-3 text-xs space-y-2">
                {article.sources?.primarySources && article.sources.primarySources.length > 0 && (
                  <div>
                    <span className="text-blue-400 font-semibold">Primary Sources:</span>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {article.sources.primarySources.map((source, i) => (
                        <li key={i} className="text-gray-300">{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {article.sources?.statistics && article.sources.statistics.length > 0 && (
                  <div>
                    <span className="text-green-400 font-semibold">Statistics:</span>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {article.sources.statistics.map((stat, i) => (
                        <li key={i} className="text-gray-300">{stat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {article.sources?.tools && article.sources.tools.length > 0 && (
                  <div>
                    <span className="text-purple-400 font-semibold">Tools:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {article.sources.tools.map((tool, i) => (
                        <span key={i} className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Internal Linking */}
          {article.internalLinking?.suggestedLinks && article.internalLinking.suggestedLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">🔗 Internal Links</h4>
              <div className="bg-gray-900/50 rounded-lg p-3 text-xs space-y-2">
                {article.internalLinking.suggestedLinks.map((link, i) => (
                  <div key={i} className="border-l-2 border-orange-500 pl-2">
                    <p className="text-white font-medium">"{link.anchorText}"</p>
                    <p className="text-gray-400">→ {link.targetTopic}</p>
                    <p className="text-gray-500 text-xs">Placement: {link.placement} | Reason: {link.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'in_progress':
      return 'bg-blue-900/50 text-blue-300 animate-pulse ring-1 ring-blue-400/30';
    case 'review':
      return 'bg-yellow-900/50 text-yellow-300';
    case 'published':
      return 'bg-green-900/50 text-green-300';
    case 'update_needed':
      return 'bg-orange-900/50 text-orange-300';
    default:
      return 'bg-gray-800 text-gray-300';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'in_progress':
      return '🔄';
    case 'review':
      return '👀';
    case 'published':
      return '✅';
    case 'update_needed':
      return '🔁';
    default:
      return '📝';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'in_progress':
      return 'In progress';
    case 'review':
      return 'Review';
    case 'published':
      return 'Gepubliceerd';
    case 'update_needed':
      return 'Update nodig';
    default:
      return 'Te doen';
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500/20 text-red-400';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'low':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'bg-gray-700 text-gray-300';
  }
}
