# LoadingSkeleton 组件使用示例

## 基础使用

### 1. 仪表盘加载
```tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-48"
      titleHeight="h-8"
      cardCount={4}
      cardColumns={4}
    />
  );
}
```

### 2. 分析页面加载
```tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AnalyticsLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-32"
      titleHeight="h-8"
      chartCount={3}
      chartColumns={2}
    />
  );
}
```

### 3. 文档管理页面加载
```tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DocumentsLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-40"
      titleHeight="h-8"
      showUploadArea={true}
      listItemCount={5}
    />
  );
}
```

### 4. 聊天页面加载
```tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ChatLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-32"
      titleHeight="h-8"
      listItemCount={4}
      cardCount={0}
      chartCount={0}
      showSimpleList={true}
      showButton={true}
    />
  );
}
```

## 高级使用

### 5. 完全自定义内容
```tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function CustomLoading() {
  return (
    <LoadingSkeleton>
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* 自定义骨架屏内容 */}
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </LoadingSkeleton>
  );
}
```

### 6. 组合使用
```tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ComplexLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-56"
      titleHeight="h-8"
      cardCount={2}
      cardColumns={2}
      chartCount={1}
      chartColumns="full"
      listItemCount={3}
      showSimpleList={true}
    />
  );
}
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `titleWidth` | `string` | `"w-48"` | 标题宽度（Tailwind 类名） |
| `titleHeight` | `string` | `"h-8"` | 标题高度（Tailwind 类名） |
| `showTitle` | `boolean` | `true` | 是否显示标题 |
| `cardCount` | `number` | `4` | 统计卡片数量 |
| `cardColumns` | `2 \| 3 \| 4` | `4` | 卡片列数 |
| `chartCount` | `number` | `2` | 图表数量 |
| `chartColumns` | `1 \| 2 \| 'full'` | `2` | 图表布局列数 |
| `listItemCount` | `number` | `5` | 列表项数量 |
| `showUploadArea` | `boolean` | `false` | 是否显示上传区域 |
| `showSimpleList` | `boolean` | `false` | 是否显示简单列表（不带图标） |
| `showButton` | `boolean` | `false` | 是否显示按钮区域 |
| `className` | `string` | - | 自定义类名 |
| `children` | `React.ReactNode` | - | 自定义内容（会覆盖其他属性） |

## 最佳实践

1. **保持一致性**：在整个应用中使用相同的骨架屏风格
2. **适度设计**：不要过度设计骨架屏，保持简单
3. **反映实际布局**：骨架屏应反映实际页面的布局结构
4. **性能考虑**：骨架屏应快速加载，不要包含复杂逻辑
5. **可访问性**：确保骨架屏对屏幕阅读器友好