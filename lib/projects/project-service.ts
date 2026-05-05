import { prisma } from '@/lib/prisma';
import type { Project, Prisma } from '@/generated/prisma/client';

export class ProjectService {
  /**
   * 创建新项目
   */
  async createProject(userId: string, name: string, description?: string, color?: string): Promise<Project> {
    return prisma.project.create({
      data: {
        userId,
        name,
        description,
        color: color || '#3B82F6', // 默认蓝色
      },
    });
  }

  /**
   * 获取用户的所有项目（分页）
   */
  async getProjects(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: {
            select: { id: true, filename: true, createdAt: true },
            take: 3, // 只返回最近3个文档
          },
          reports: {
            select: { id: true, title: true, createdAt: true },
            take: 3, // 只返回最近3个报告
          },
        },
      }),
      prisma.project.count({ where: { userId } }),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取项目详情
   */
  async getProjectById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        documents: {
          select: { id: true, filename: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        reports: {
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * 更新项目
   */
  async updateProject(id: string, data: { name?: string; description?: string | null; color?: string }): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除项目（级联删除关联的文档和报告）
   */
  async deleteProject(id: string): Promise<Project> {
    return prisma.project.delete({
      where: { id },
    });
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(userId: string) {
    const [projectCount, documentCount, reportCount] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.document.count({ where: { projectId: { not: null }, userId } }),
      prisma.report.count({ where: { userId } }),
    ]);

    return {
      projectCount,
      documentCount,
      reportCount,
    };
  }
}