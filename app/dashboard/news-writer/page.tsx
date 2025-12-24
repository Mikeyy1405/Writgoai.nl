import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import NewsWriter from "@/components/NewsWriter";

export default async function NewsWriterPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  return (
    <div className="p-6 lg:p-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">News Writer</h1>
        <p className="text-gray-400 text-lg">
          Genereer nieuwsartikelen met actuele informatie via Perplexity AI
        </p>
      </div>

      <NewsWriter />
    </div>
  );
}
