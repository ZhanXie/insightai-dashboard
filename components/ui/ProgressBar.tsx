'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ProgressBarProps {
  className?: string;
}

export function ProgressBar({ className = '' }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 路由变化时开始显示进度条
    setIsVisible(true);
    setProgress(10);

    let interval: NodeJS.Timeout;

    // 进度模拟 - 比完全假的更接近真实
    const startProgressSimulation = () => {
      interval = setInterval(() => {
        setProgress((prev) => {
          // 非线性进度：开始时快，结束时慢
          if (prev >= 85) return Math.min(prev + 1, 90);
          if (prev >= 60) return Math.min(prev + 2, 85);
          if (prev >= 30) return Math.min(prev + 3, 60);
          return Math.min(prev + 5, 30);
        });
      }, 100);
    };

    startProgressSimulation();

    // 超时处理：3秒后强制完成
    const timeout = setTimeout(() => {
      if (isVisible) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
        }, 200);
      }
    }, 3000);

    // 页面加载完成的模拟（实际应用中无法准确知道）
    // 这里假设页面在 500-1500ms 内加载完成
    const randomLoadTime = 500 + Math.random() * 1000;
    const loadCompleteTimeout = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    }, randomLoadTime);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(loadCompleteTimeout);
    };
  }, [pathname]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div
        className="h-1 bg-primary transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isVisible ? 1 : 0
        }}
      />
    </div>
  );
}