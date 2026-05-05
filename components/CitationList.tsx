/**
 * 引用列表组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Citation {
  id: string;
  type: 'web' | 'document';
  title: string;
  url?: string;
  snippet: string;
}

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">参考文献</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {citations.map((citation, index) => (
            <li key={citation.id} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{citation.title}</span>
                  <Badge variant={citation.type === 'web' ? 'default' : 'secondary'}>
                    {citation.type === 'web' ? '网页' : '文档'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{citation.snippet}</p>
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {citation.url}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
