# Quick Start: WordPress Data in Your Component

## TL;DR - 30 Second Integration

```tsx
import { useWordPressData } from '@/lib/contexts/WordPressDataContext';

function MyComponent() {
  const { data, loading, error } = useWordPressData();
  
  // That's it! You now have access to:
  // - data.categories (WordPress categorieën)
  // - data.posts (alle posts)
  // - data.pages (alle pagina's)
  // - data.tags (alle tags)
  // - data.sitemap (volledige sitemap)
}
```

## Common Use Cases

### 1. Show Category Dropdown

```tsx
function CategorySelector() {
  const { data, loading } = useWordPressData();
  
  if (loading) return <Spinner />;
  
  return (
    <select>
      {data?.categories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
```

### 2. List Recent Posts

```tsx
function RecentPosts() {
  const { data } = useWordPressData();
  
  return (
    <ul>
      {data?.posts.slice(0, 5).map(post => (
        <li key={post.id}>
          <a href={post.link}>{post.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

### 3. Internal Link Suggestions

```tsx
import { findRelevantInternalLinks } from '@/lib/sitemap-loader';

function InternalLinkSuggester({ topic }: { topic: string }) {
  const { data } = useWordPressData();
  
  if (!data?.sitemap) return null;
  
  const suggestions = findRelevantInternalLinks(
    data.sitemap,
    topic,
    3 // max aantal links
  );
  
  return (
    <div>
      <h4>Suggesties voor interne links:</h4>
      {suggestions.map(link => (
        <a key={link.url} href={link.url}>
          {link.title} (relevantie: {link.relevance})
        </a>
      ))}
    </div>
  );
}
```

### 4. Data Status Indicator

```tsx
function WordPressStatus() {
  const { data, loading, error } = useWordPressData();
  
  if (loading) {
    return <Badge variant="warning">WordPress data laden...</Badge>;
  }
  
  if (error) {
    return <Badge variant="error">WordPress niet beschikbaar</Badge>;
  }
  
  if (data) {
    return (
      <Badge variant="success">
        {data.categories.length} categorieën geladen
      </Badge>
    );
  }
  
  return null;
}
```

### 5. Check if Data is Available

```tsx
function MyFeature() {
  const { data } = useWordPressData();
  
  // Check if WordPress data is loaded
  const hasWordPress = Boolean(data?.categories.length);
  
  if (!hasWordPress) {
    return <div>WordPress data niet beschikbaar voor dit project</div>;
  }
  
  // Use the data...
}
```

## Data Structure Reference

```typescript
interface WordPressData {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  
  posts: Array<{
    id: number;
    title: string;
    link: string;
    excerpt?: string;
    status: string;
  }>;
  
  pages: Array<{
    id: number;
    title: string;
    link: string;
    excerpt?: string;
    status: string;
  }>;
  
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  
  sitemap: {
    pages: Array<{
      url: string;
      title: string;
      type: 'post' | 'page' | 'category' | 'tag' | 'other';
      lastModified?: Date;
    }>;
    categories: Array<{ name: string; url: string; count: number }>;
    tags: Array<{ name: string; url: string; count: number }>;
    totalPages: number;
    lastScanned: Date;
  } | null;
}
```

## Hook API Reference

### useWordPressData()

```typescript
const {
  data,              // WordPressData | null
  loading,           // boolean
  error,             // string | null
  loadWordPressData, // (projectId: string) => Promise<void>
  clearData,         // () => void
} = useWordPressData();
```

**Methods:**
- `loadWordPressData(projectId)` - Manueel data laden (meestal niet nodig)
- `clearData()` - Cache en data wissen

## When to Use vs Not Use

### ✅ Use This When:
- Je WordPress categorieën nodig hebt
- Je een lijst van posts/pages wilt tonen
- Je interne link suggesties wilt geven
- Je sitemap data nodig hebt
- Je binnen een client component werkt (gebruik 'use client')

### ❌ Don't Use This When:
- Je in een server component werkt (gebruik direct API call)
- Je real-time data nodig hebt (cache is 5 minuten)
- Je geen toegang hebt tot ProjectProvider/WordPressDataProvider

## Troubleshooting

### "useWordPressData must be used within a WordPressDataProvider"

**Probleem**: Hook aangeroepen buiten provider scope

**Oplossing**: 
```tsx
// ❌ Verkeerd - buiten DashboardLayoutClient
function MyComponent() {
  const { data } = useWordPressData(); // ERROR!
}

// ✅ Goed - binnen client dashboard
// (via DashboardLayoutClient of nested component)
function MyComponent() {
  const { data } = useWordPressData(); // OK!
}
```

### Data is null of leeg

**Mogelijke oorzaken:**
1. Project heeft geen WordPress configuratie
2. WordPress site is niet bereikbaar
3. Data is nog aan het laden
4. Cache is verlopen en nieuwe data wordt geladen

**Check:**
```tsx
const { data, loading, error } = useWordPressData();

console.log({ data, loading, error }); // Debug info

if (loading) return <div>Laden...</div>;
if (error) return <div>Error: {error}</div>;
if (!data) return <div>Geen data</div>;
```

### Cache issues

**Clear cache programmatisch:**
```typescript
const { clearData } = useWordPressData();
clearData(); // Wist data en cache
```

**Clear cache manueel:**
```javascript
// In browser console
localStorage.removeItem('wp_data_PROJECT-ID-HERE');
```

### Performance issues

**Best practices:**
- ✅ Data wordt automatisch gecached (5 min)
- ✅ Gebruik `useMemo` voor zware berekeningen
- ✅ Controleer `loading` state voordat je data gebruikt
- ❌ Roep `loadWordPressData` niet onnodig aan

## Advanced Usage

### Force Refresh Data

```tsx
function RefreshButton() {
  const { loadWordPressData, loading } = useWordPressData();
  const { currentProject } = useProject();
  
  const handleRefresh = async () => {
    if (currentProject?.id) {
      // Clear cache first
      localStorage.removeItem(`wp_data_${currentProject.id}`);
      // Then reload
      await loadWordPressData(currentProject.id);
    }
  };
  
  return (
    <button onClick={handleRefresh} disabled={loading}>
      {loading ? 'Bezig...' : 'Ververs WordPress Data'}
    </button>
  );
}
```

### Combine with Project Context

```tsx
function ProjectWordPressInfo() {
  const { currentProject } = useProject();
  const { data, loading } = useWordPressData();
  
  return (
    <div>
      <h3>{currentProject?.name}</h3>
      {loading ? (
        <p>WordPress data laden...</p>
      ) : (
        <p>
          {data?.posts.length} posts, 
          {data?.pages.length} pagina's
        </p>
      )}
    </div>
  );
}
```

### Filter and Search

```tsx
function SearchablePosts() {
  const { data } = useWordPressData();
  const [search, setSearch] = useState('');
  
  const filteredPosts = useMemo(() => {
    if (!data?.posts) return [];
    
    return data.posts.filter(post =>
      post.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.posts, search]);
  
  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Zoek posts..."
      />
      {filteredPosts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## More Info

- Full documentation: `WORDPRESS_DATA_AUTO_LOADING.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Data flow diagrams: `WORDPRESS_DATA_FLOW.md`
