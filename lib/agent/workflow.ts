/**
 * Agent 工作流状态机核心
 */

import {
  WorkflowContext,
  WorkflowState,
  WorkflowStage,
  StreamUpdate,
  AgentResult,
} from './types';

/**
 * 工作流状态转换规则
 */
const STATE_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  idle: ['researching'],
  researching: ['retrieving', 'error'],
  retrieving: ['analyzing', 'error'],
  analyzing: ['writing', 'error'],
  writing: ['completed', 'error'],
  completed: [],
  error: [],
};

/**
 * 工作流状态机
 */
export class WorkflowStateMachine {
  context: WorkflowContext;
  private abortController: AbortController;
  private timeoutMs: number;
  private timeoutHandle?: NodeJS.Timeout;

  constructor(context: WorkflowContext, options: { timeoutMs?: number } = {}) {
    this.context = context;
    this.abortController = new AbortController();
    this.timeoutMs = options.timeoutMs || 300000; // 默认 5 分钟超时
  }

  /**
   * 获取当前上下文
   */
  getContext(): WorkflowContext {
    return this.context;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): WorkflowState {
    return this.context.currentState;
  }

  /**
   * 检查是否可以转换到目标状态
   */
  canTransitionTo(state: WorkflowState): boolean {
    const allowed = STATE_TRANSITIONS[this.context.currentState];
    return allowed.includes(state);
  }

  /**
   * 转换到目标状态
   */
  transitionTo(state: WorkflowState, message: string, data?: Record<string, unknown>): void {
    if (!this.canTransitionTo(state)) {
      throw new Error(
        `Invalid state transition: ${this.context.currentState} -> ${state}`
      );
    }

    // 更新状态
    this.context.currentState = state;

    // 添加阶段记录
    const stage: WorkflowStage = {
      state,
      message,
      progress: 0,
      data,
    };
    this.context.stages.push(stage);

    // 更新进度
    this.updateProgress(state);

    // 启动超时（仅在开始时）
    if (state === 'researching') {
      this.startTimeout();
    }
  }

  /**
   * 更新阶段进度
   */
  updateProgress(state: WorkflowState): void {
    const stage = this.context.stages.find(s => s.state === state);
    if (stage) {
      // 根据阶段设置初始进度
      const progressMap: Record<WorkflowState, number> = {
        idle: 0,
        researching: 10,
        retrieving: 30,
        analyzing: 60,
        writing: 80,
        completed: 100,
        error: 0,
      };
      stage.progress = progressMap[state];
    }
  }

  /**
   * 设置阶段进度
   */
  setStageProgress(state: WorkflowState, progress: number): void {
    const stage = this.context.stages.find(s => s.state === state);
    if (stage) {
      stage.progress = Math.min(100, Math.max(0, progress));
    }
  }

  /**
   * 处理错误
   */
  handleError(error: Error): void {
    this.context.currentState = 'error';
    this.context.error = error.message;

    const stage: WorkflowStage = {
      state: 'error',
      message: `错误: ${error.message}`,
      progress: 0,
    };
    this.context.stages.push(stage);

    // 中止超时
    this.stopTimeout();
    this.abortController.abort();
  }

  /**
   * 启动超时
   */
  private startTimeout(): void {
    this.timeoutHandle = setTimeout(() => {
      if (this.context.currentState !== 'completed' && this.context.currentState !== 'error') {
        this.handleError(new Error('报告生成超时（5 分钟）'));
      }
    }, this.timeoutMs);
  }

  /**
   * 停止超时
   */
  private stopTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }
  }

  /**
   * 检查是否已中止
   */
  isAborted(): boolean {
    return this.abortController.signal.aborted;
  }

  /**
   * 获取中止信号
   */
  getSignal(): AbortSignal {
    return this.abortController.signal;
  }
}

/**
 * 创建工作流上下文
 */
export function createWorkflowContext(options: {
  reportId: string;
  topic: string;
  templateId: string;
  projectId?: string;
}): WorkflowContext {
  return {
    reportId: options.reportId,
    topic: options.topic,
    projectId: options.projectId,
    templateId: options.templateId,
    currentState: 'idle',
    stages: [],
    tokensUsed: 0,
  };
}

/**
 * 创建工作流状态机
 */
export function createWorkflow(options: {
  reportId: string;
  topic: string;
  templateId: string;
  projectId?: string;
  timeoutMs?: number;
}): WorkflowStateMachine {
  const context = createWorkflowContext(options);
  return new WorkflowStateMachine(context, { timeoutMs: options.timeoutMs });
}

/**
 * 创建流式更新事件
 */
export function createStreamUpdate(update: StreamUpdate): string {
  return `data: ${JSON.stringify(update)}\n\n`;
}

/**
 * 创建阶段更新
 */
export function createStageUpdate(
  stage: WorkflowState,
  message: string,
  progress?: number
): string {
  return createStreamUpdate({
    type: 'stage',
    stage,
    message,
    progress,
  });
}

/**
 * 创建完成更新
 */
export function createCompleteUpdate(): string {
  return createStreamUpdate({
    type: 'complete',
    message: '报告生成完成',
  });
}

/**
 * 创建错误更新
 */
export function createErrorUpdate(error: string): string {
  return createStreamUpdate({
    type: 'error',
    error,
  });
}

/**
 * 累加 Token 使用量
 */
export function addTokensUsed(context: WorkflowContext, tokens: number): void {
  context.tokensUsed += tokens;
}

/**
 * 检查 Agent 结果并处理
 */
export function handleAgentResult<T>(result: AgentResult<T>): T {
  if (!result.success) {
    throw new Error(result.error || 'Agent 执行失败');
  }
  if (result.data === undefined) {
    throw new Error('Agent 未返回数据');
  }
  return result.data;
}
