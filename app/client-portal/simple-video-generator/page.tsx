
import SimpleVideoGenerator from '@/components/simple-video-generator';

export const metadata = {
  title: 'Video Generator | WritgoAI',
  description: 'Genereer professionele AI video\'s in minuten',
};

export default function SimpleVideoGeneratorPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎬 AI Video Generator</h1>
        <p className="text-muted-foreground">
          Genereer professionele video's met AI in slechts 1-2 minuten
        </p>
      </div>
      
      <SimpleVideoGenerator />
    </div>
  );
}
