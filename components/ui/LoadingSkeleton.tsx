import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  /**
   * 页面标题的宽度
   */
  titleWidth?: string;
  
  /**
   * 页面标题高度
   */
  titleHeight?: string;
  
  /**
   * 页面标题是否显示
   */
  showTitle?: boolean;
  
  /**
   * 卡片统计数量
   */
  cardCount?: number;
  
  /**
   * 卡片布局列数
   */
  cardColumns?: 2 | 3 | 4;
  
  /**
   * 图表数量
   */
  chartCount?: number;
  
  /**
   * 图表布局列数
   */
  chartColumns?: 1 | 2 | 'full';
  
  /**
   * 列表项数量
   */
  listItemCount?: number;
  
  /**
   * 是否显示上传区域
   */
  showUploadArea?: boolean;
  
  /**
   * 是否显示简单列表（不带图标）
   */
  showSimpleList?: boolean;
  
  /**
   * 是否显示按钮区域
   */
  showButton?: boolean;
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 子内容 - 用于完全自定义
   */
  children?: React.ReactNode;
}

export function LoadingSkeleton({
  titleWidth = "w-48",
  titleHeight = "h-8",
  showTitle = true,
  cardCount = 4,
  cardColumns = 4,
  chartCount = 2,
  chartColumns = 2,
  listItemCount = 5,
  showUploadArea = false,
  showSimpleList = false,
  showButton = false,
  className,
  children
}: LoadingSkeletonProps) {
  // 如果有自定义内容，直接渲染
  if (children) {
    return <div className={cn("p-6", className)}>{children}</div>;
  }

  return (
    <div className={cn("p-6", className)}>
      <div className="animate-pulse space-y-6">
        {/* 页面标题 */}
        {showTitle && (
          <div className={cn("rounded bg-muted", titleWidth, titleHeight)} />
        )}
        
        {/* 统计卡片区域 */}
        {cardCount > 0 && (
          <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${cardColumns}`}>
            {[...Array(cardCount)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
        )}
        
        {/* 上传区域 */}
        {showUploadArea && (
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-muted" />
            <div className="h-32 rounded-lg border-2 border-dashed border-muted bg-muted/20" />
          </div>
        )}
        
        {/* 图表区域 */}
        {chartCount > 0 && (
          <div className={`grid gap-6 ${chartColumns === 'full' ? '' : `md:grid-cols-${chartColumns}`}`}>
            {[...Array(chartCount)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-48 rounded bg-muted" />
                <div className="h-64 rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        )}
        
        {/* 列表区域 */}
        {listItemCount > 0 && (
          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="space-y-3">
              {[...Array(listItemCount)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  {showSimpleList ? (
                    <div className="space-y-2">
                      <div className="h-4 w-64 rounded bg-muted" />
                      <div className="h-3 w-32 rounded bg-muted" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-48 rounded bg-muted" />
                        <div className="h-3 w-32 rounded bg-muted" />
                      </div>
                    </div>
                  )}
                  <div className="h-8 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 按钮区域 */}
        {showButton && (
          <div className="h-10 w-32 rounded bg-muted" />
        )}
      </div>
    </div>
  );
}