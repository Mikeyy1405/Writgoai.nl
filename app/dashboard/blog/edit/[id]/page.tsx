import PostEditor from '@/components/blog/PostEditor';

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return <PostEditor postId={params.id} />;
}
