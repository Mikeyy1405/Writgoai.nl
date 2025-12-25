import MediaLibrary from '@/components/MediaLibrary';

export const metadata = {
  title: 'Media Bibliotheek | Writgo.ai',
  description: 'Beheer al je afbeeldingen en video\'s op één plek',
};

export default function MediaLibraryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <MediaLibrary />
      </div>
    </div>
  );
}
