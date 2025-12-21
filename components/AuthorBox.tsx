import { AuthorProfile } from '@/lib/author-profile';
import Link from 'next/link';

interface AuthorBoxProps {
  author: AuthorProfile;
  showFull?: boolean;
}

export default function AuthorBox({ author, showFull = false }: AuthorBoxProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Author Image */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-4xl font-bold">
            {author.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {author.name}
              </h3>
              <p className="text-orange-400 font-medium">
                {author.role}
              </p>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-4">
            {author.bio}
          </p>

          {showFull && (
            <>
              {/* Experience */}
              <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-2">
                  Ervaring
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {author.experience}
                </p>
              </div>

              {/* Expertise */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">
                  Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {author.expertise.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">
                  Prestaties
                </h4>
                <ul className="space-y-2">
                  {author.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start text-gray-300 text-sm">
                      <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Social Links */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
            {author.social.linkedin && (
              <a
                href={author.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            )}
            {author.social.twitter && (
              <a
                href={author.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
            <Link
              href="/over-ons"
              className="ml-auto text-orange-500 hover:text-orange-400 font-medium text-sm transition-colors"
            >
              Meer over {author.name.split(' ')[0]} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
