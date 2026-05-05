import { prisma } from '@/lib/prisma';

async function main() {
  // 商业类模板
  const businessTemplates = [
    {
      name: '市场研究报告',
      slug: 'market-research',
      description: '深入分析市场规模、趋势、竞争格局和机会',
      category: 'business',
      structure: {
        title: '{{topic}}市场研究报告',
        sections: [
          { id: 'executive', title: '执行摘要', content: '' },
          { id: 'market-overview', title: '市场概览', content: '' },
          { id: 'trends', title: '市场趋势', content: '' },
          { id: 'competition', title: '竞争分析', content: '' },
          { id: 'opportunities', title: '市场机会', content: '' },
          { id: 'recommendations', title: '建议', content: '' }
        ]
      },
      prompts: {
        research: '搜索关于{{topic}}的最新市场数据、趋势报告、行业分析',
        analysis: '分析市场规模、增长率、主要玩家、SWOT分析',
        writing: '生成结构化的市场研究报告，包含数据图表和洞察'
      },
      isPublic: true
    },
    {
      name: '竞品分析报告',
      slug: 'competitive-analysis',
      description: '分析竞争对手的产品、策略和市场表现',
      category: 'business',
      structure: {
        title: '{{topic}}竞品分析报告',
        sections: [
          { id: 'overview', title: '分析概览', content: '' },
          { id: 'competitors', title: '主要竞争对手', content: '' },
          { id: 'product-comparison', title: '产品对比', content: '' },
          { id: 'strategy-analysis', title: '策略分析', content: '' },
          { id: 'market-position', title: '市场定位', content: '' },
          { id: 'recommendations', title: '战略建议', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的主要竞争对手、产品特点、市场策略',
        analysis: '对比各竞品优劣势、市场策略、用户反馈',
        writing: '生成竞品分析报告，包含对比矩阵和战略洞察'
      },
      isPublic: true
    },
    {
      name: '商业计划书',
      slug: 'business-proposal',
      description: '制定完整的商业计划，包括市场分析、财务预测等',
      category: 'business',
      structure: {
        title: '{{topic}}商业计划书',
        sections: [
          { id: 'executive-summary', title: '执行摘要', content: '' },
          { id: 'business-description', title: '业务描述', content: '' },
          { id: 'market-analysis', title: '市场分析', content: '' },
          { id: 'organization', title: '组织架构', content: '' },
          { id: 'product-service', title: '产品/服务', content: '' },
          { id: 'marketing', title: '营销策略', content: '' },
          { id: 'financial', title: '财务预测', content: '' },
          { id: 'appendix', title: '附录', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的行业数据、市场机会、成功案例',
        analysis: '分析商业模式、盈利点、风险因素、投资回报',
        writing: '生成专业的商业计划书，包含财务模型和战略规划'
      },
      isPublic: true
    },
    {
      name: '行业分析报告',
      slug: 'industry-analysis',
      description: '全面分析特定行业的发展状况、挑战和前景',
      category: 'business',
      structure: {
        title: '{{topic}}行业分析报告',
        sections: [
          { id: 'industry-overview', title: '行业概览', content: '' },
          { id: 'key-players', title: '主要参与者', content: '' },
          { id: 'market-segments', title: '市场细分', content: '' },
          { id: 'regulatory', title: '监管环境', content: '' },
          { id: 'challenges', title: '行业挑战', content: '' },
          { id: 'future-outlook', title: '未来展望', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}行业的发展历程、市场规模、政策法规',
        analysis: '分析行业生命周期、竞争格局、发展趋势',
        writing: '生成行业分析报告，包含关键指标和发展预测'
      },
      isPublic: true
    }
  ];

  // 学术类模板
  const academicTemplates = [
    {
      name: '文献综述',
      slug: 'literature-review',
      description: '系统梳理特定领域的研究文献，总结研究进展',
      category: 'academic',
      structure: {
        title: '{{topic}}文献综述',
        sections: [
          { id: 'introduction', title: '引言', content: '' },
          { id: 'methodology', title: '研究方法', content: '' },
          { id: 'key-findings', title: '主要发现', content: '' },
          { id: 'theoretical-framework', title: '理论框架', content: '' },
          { id: 'research-gaps', title: '研究空白', content: '' },
          { id: 'conclusions', title: '结论', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的学术论文、研究成果、理论框架',
        analysis: '分析研究方法、理论发展、实证发现',
        writing: '生成系统的文献综述，按时间线和主题组织'
      },
      isPublic: true
    },
    {
      name: '研究摘要',
      slug: 'research-summary',
      description: '总结研究项目的核心内容、方法和发现',
      category: 'academic',
      structure: {
        title: '{{topic}}研究摘要',
        sections: [
          { id: 'background', title: '研究背景', content: '' },
          { id: 'objectives', title: '研究目标', content: '' },
          { id: 'methodology', title: '研究方法', content: '' },
          { id: 'results', title: '研究结果', content: '' },
          { id: 'discussion', title: '讨论', content: '' },
          { id: 'implications', title: '研究意义', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的现有研究和理论基础',
        analysis: '分析研究问题、方法创新、结果意义',
        writing: '生成标准的研究摘要，符合学术规范'
      },
      isPublic: true
    },
    {
      name: '论文大纲',
      slug: 'thesis-outline',
      description: '为学术论文制定详细的结构化大纲',
      category: 'academic',
      structure: {
        title: '{{topic}}论文大纲',
        sections: [
          { id: 'introduction', title: '第一章：引言', content: '' },
          { id: 'literature-review', title: '第二章：文献综述', content: '' },
          { id: 'methodology', title: '第三章：研究方法', content: '' },
          { id: 'findings', title: '第四章：研究发现', content: '' },
          { id: 'discussion', title: '第五章：讨论', content: '' },
          { id: 'conclusion', title: '第六章：结论', content: '' },
          { id: 'references', title: '参考文献', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的学术文献和研究方法',
        analysis: '确定论文结构、章节安排、论证逻辑',
        writing: '生成详细的论文大纲，包含章节要点和写作指导'
      },
      isPublic: true
    }
  ];

  // 技术类模板
  const technicalTemplates = [
    {
      name: '产品需求文档',
      slug: 'product-requirements',
      description: '定义产品的功能需求、用户场景和技术规格',
      category: 'technical',
      structure: {
        title: '{{topic}}产品需求文档',
        sections: [
          { id: 'overview', title: '产品概述', content: '' },
          { id: 'user-stories', title: '用户故事', content: '' },
          { id: 'functional-requirements', title: '功能需求', content: '' },
          { id: 'non-functional', title: '非功能需求', content: '' },
          { id: 'technical-specs', title: '技术规格', content: '' },
          { id: 'implementation-plan', title: '实施计划', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的竞品功能、用户需求、技术趋势',
        analysis: '分析功能优先级、技术可行性、实现复杂度',
        writing: '生成详细的产品需求文档，包含用户流程和技术规范'
      },
      isPublic: true
    },
    {
      name: '技术评审报告',
      slug: 'technical-review',
      description: '对技术方案、架构设计或代码进行系统性评审',
      category: 'technical',
      structure: {
        title: '{{topic}}技术评审报告',
        sections: [
          { id: 'review-scope', title: '评审范围', content: '' },
          { id: 'architecture', title: '架构设计', content: '' },
          { id: 'code-quality', title: '代码质量', content: '' },
          { id: 'performance', title: '性能分析', content: '' },
          { id: 'security', title: '安全性评估', content: '' },
          { id: 'recommendations', title: '改进建议', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的技术标准、最佳实践、架构模式',
        analysis: '评估技术方案的合理性、可维护性、扩展性',
        writing: '生成技术评审报告，包含评分和具体改进建议'
      },
      isPublic: true
    },
    {
      name: '项目提案',
      slug: 'project-proposal',
      description: '提出新项目的背景、目标和实施方案',
      category: 'technical',
      structure: {
        title: '{{topic}}项目提案',
        sections: [
          { id: 'project-background', title: '项目背景', content: '' },
          { id: 'project-objectives', title: '项目目标', content: '' },
          { id: 'technical-approach', title: '技术方案', content: '' },
          { id: 'implementation', title: '实施计划', content: '' },
          { id: 'resources', title: '资源需求', content: '' },
          { id: 'timeline', title: '时间规划', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的技术方案、项目案例、实施方法',
        analysis: '分析项目可行性、技术风险、资源需求',
        writing: '生成项目提案文档，包含技术路线和里程碑'
      },
      isPublic: true
    }
  ];

  // 通用类模板
  const generalTemplates = [
    {
      name: '通用报告',
      slug: 'general-report',
      description: '适用于各种场景的标准报告格式',
      category: 'general',
      structure: {
        title: '{{topic}}报告',
        sections: [
          { id: 'introduction', title: '引言', content: '' },
          { id: 'main-content', title: '主要内容', content: '' },
          { id: 'analysis', title: '分析', content: '' },
          { id: 'conclusions', title: '结论', content: '' },
          { id: 'recommendations', title: '建议', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关信息',
        analysis: '分析关键信息和发展趋势',
        writing: '生成结构化的报告，内容清晰、逻辑严谨'
      },
      isPublic: true
    },
    {
      name: '会议纪要',
      slug: 'meeting-summary',
      description: '记录会议的主要内容和决议',
      category: 'general',
      structure: {
        title: '{{topic}}会议纪要',
        sections: [
          { id: 'meeting-info', title: '会议信息', content: '' },
          { id: 'attendees', title: '参会人员', content: '' },
          { id: 'agenda', title: '会议议程', content: '' },
          { id: 'discussion', title: '讨论内容', content: '' },
          { id: 'decisions', title: '决议事项', content: '' },
          { id: 'action-items', title: '行动项', content: '' }
        ]
      },
      prompts: {
        research: '收集{{topic}}相关的背景资料和会议材料',
        analysis: '整理会议要点、讨论重点和决策结果',
        writing: '生成规范的会议纪要，包含时间、地点、参会人等信息'
      },
      isPublic: true
    },
    {
      name: '学习笔记',
      slug: 'learning-notes',
      description: '记录学习过程中的重点和心得',
      category: 'general',
      structure: {
        title: '{{topic}}学习笔记',
        sections: [
          { id: 'key-points', title: '要点总结', content: '' },
          { id: 'concepts', title: '概念解释', content: '' },
          { id: 'examples', title: '示例说明', content: '' },
          { id: 'questions', title: '疑问与思考', content: '' },
          { id: 'references', title: '参考资料', content: '' }
        ]
      },
      prompts: {
        research: '搜索{{topic}}相关的学习资料和教程',
        analysis: '梳理知识体系，提炼核心概念',
        writing: '生成结构化的学习笔记，便于理解和复习'
      },
      isPublic: true
    }
  ];

  // 创建所有模板
  const allTemplates = [...businessTemplates, ...academicTemplates, ...technicalTemplates, ...generalTemplates];

  for (const template of allTemplates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: {},
      create: template
    });
    console.log(`模板创建成功: ${template.name}`);
  }

  console.log(`\n共创建了 ${allTemplates.length} 个预设模板`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });